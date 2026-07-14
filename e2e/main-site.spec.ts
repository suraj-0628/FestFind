import { test, expect } from "@playwright/test";

test.describe("Main site navigation & map", () => {
  test("loads homepage with map panel active", async ({ page }) => {
    await page.goto("/");
    const map = page.locator('[role="application"][aria-label="Interactive map of India"]');
    await expect(map).toBeVisible({ timeout: 30_000 });
    const mapTab = page.locator('button[role="tab"]').filter({ hasText: "Map" });
    await expect(mapTab).toHaveAttribute("aria-selected", "true");
  });

  test("tab list has Map, Online, Host tabs", async ({ page }) => {
    await page.goto("/");
    const tabs = page.locator('button[role="tab"]');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toContainText("Map");
    await expect(tabs.nth(1)).toContainText("Online");
    await expect(tabs.nth(2)).toContainText("Host");
  });

  test("switch to Online tab shows online panel", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Online" }).click();
    const panel = page.locator('[role="tabpanel"][aria-label="Online events"]');
    await expect(panel).toBeVisible({ timeout: 10_000 });
  });

  test("switch to Host tab shows login form when unauthenticated", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });
  });

  test("desktop sidebar shows search, stats, sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('input[aria-label="Search events"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Total")).toBeVisible();
    await expect(page.getByText("Ongoing")).toBeVisible();
    await expect(page.getByText("Upcoming")).toBeVisible();
  });

  test("search input accepts text", async ({ page }) => {
    await page.goto("/");
    const search = page.locator('input[aria-label="Search events"]');
    await expect(search).toBeVisible({ timeout: 10_000 });
    await search.fill("hackathon");
    await expect(search).toHaveValue("hackathon");
  });

  test("map legend shows status categories", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Ongoing")).toBeVisible();
    await expect(page.getByText("Upcoming")).toBeVisible();
    await expect(page.getByText("Past")).toBeVisible();
  });

  test("page has correct title and meta", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/FestFind/);
  });

  test("no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForTimeout(3000);
    const realErrors = errors.filter(e =>
      !e.includes("favicon") &&
      !e.includes("net::ERR") &&
      !e.includes("third-party cookie") &&
      !e.includes("Failed to load resource") &&
      !e.includes("ResizeObserver")
    );
    expect(realErrors).toEqual([]);
  });

  test("no JS exceptions on page load", async ({ page }) => {
    const exceptions: Error[] = [];
    page.on("pageerror", err => exceptions.push(err));
    await page.goto("/");
    await page.waitForTimeout(3000);
    expect(exceptions).toEqual([]);
  });

  test("SPA handles unknown routes gracefully", async ({ page }) => {
    await page.goto("/nonexistent-page-xyz");
    // SPA serves index.html for all routes — just check it loads
    await expect(page).toHaveTitle(/FestFind/);
  });
});
