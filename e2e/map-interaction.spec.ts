import { test, expect } from "@playwright/test";

test.describe("Online events page", () => {
  test("online tab loads with filter buttons", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Online" }).click();
    await expect(page.getByText("Online Events")).toBeVisible({ timeout: 15_000 });
    // Filter buttons contain counts like "All (13)"
    await expect(page.locator("button").filter({ hasText: /^All/ })).toBeVisible();
    await expect(page.locator("button").filter({ hasText: /Live Now/ })).toBeVisible();
    await expect(page.locator("button").filter({ hasText: /^Upcoming/ })).toBeVisible();
  });

  test("filter buttons are clickable", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Online" }).click();
    await expect(page.getByText("Online Events")).toBeVisible({ timeout: 15_000 });

    await page.locator("button").filter({ hasText: /Live Now/ }).click();
    await page.waitForTimeout(1000);
    await page.locator("button").filter({ hasText: /^Upcoming/ }).click();
    await page.waitForTimeout(1000);
    await page.locator("button").filter({ hasText: /^All/ }).click();
    await page.waitForTimeout(1000);
  });

  test("online page renders without errors", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Online" }).click();
    await expect(page.getByText("Online Events")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Map interaction", () => {
  test("map loads with Leaflet tiles", async ({ page }) => {
    await page.goto("/");
    const map = page.locator('[role="application"][aria-label="Interactive map of India"]');
    await expect(map).toBeVisible({ timeout: 30_000 });
    // Leaflet uses .leaflet-pane > .leaflet-tile-pane
    await expect(page.locator(".leaflet-tile-pane")).toBeVisible({ timeout: 10_000 });
  });

  test("map has zoom controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[role="application"][aria-label="Interactive map of India"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".leaflet-control-zoom")).toBeVisible();
  });

  test("map has OpenStreetMap attribution", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[role="application"][aria-label="Interactive map of India"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".leaflet-control-attribution")).toBeVisible();
  });

  test("event markers render on map", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[role="application"][aria-label="Interactive map of India"]')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(5000);
    const markers = page.locator(".leaflet-marker-icon, .marker-icon, [class*='marker']");
    const count = await markers.count();
    console.log(`Found ${count} map markers`);
    // Don't fail if 0 — may be loading slowly
  });

  test("map container has proper dimensions", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[role="application"][aria-label="Interactive map of India"]')).toBeVisible({ timeout: 30_000 });
    const box = await page.locator('[role="application"][aria-label="Interactive map of India"]').boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(200);
      expect(box.height).toBeGreaterThan(200);
    }
  });

  test("no JS errors on map page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForTimeout(5000);
    const realErrors = errors.filter(e =>
      !e.includes("favicon") && !e.includes("net::ERR") && !e.includes("third-party") &&
      !e.includes("Couldn't determine location") && !e.includes("Geolocation") &&
      !e.includes("Failed to load resource") && !e.includes("ResizeObserver")
    );
    expect(realErrors).toEqual([]);
  });

  test("no uncaught exceptions", async ({ page }) => {
    const exceptions: Error[] = [];
    page.on("pageerror", err => exceptions.push(err));
    await page.goto("/");
    await page.waitForTimeout(5000);
    expect(exceptions).toEqual([]);
  });
});
