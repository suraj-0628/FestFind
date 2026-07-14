import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 }, isMobile: true });

test.describe("Mobile responsive", () => {
  test("mobile layout renders map", async ({ page }) => {
    await page.goto("/");
    const map = page.locator('[role="application"][aria-label="Interactive map of India"]');
    await expect(map).toBeVisible({ timeout: 30_000 });
  });

  test("mobile has bottom tab bar with 3 tabs", async ({ page }) => {
    await page.goto("/");
    const tabs = page.locator('button[role="tab"]');
    await expect(tabs).toHaveCount(3);
  });

  test("mobile search is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('input[aria-label="Search events"]')).toBeVisible({ timeout: 10_000 });
  });

  test("mobile event list shows stats", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);
    const eventsText = page.getByText(/events/);
    await expect(eventsText.first()).toBeVisible();
  });

  test("mobile login form works when clicking Host", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[placeholder="Email address"]')).toBeVisible();
  });

  test("mobile register flow works", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: /sign up/i }).or(page.getByRole("button", { name: /sign up/i })).click();
    await expect(page.getByText("Join FestFind")).toBeVisible();
    await expect(page.locator('input[placeholder="Your name"]')).toBeVisible();
  });

  test("mobile submit form accessible when logged in", async ({ page }) => {
    const regEmail = `mob_${Date.now()}@test.example.com`;
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: /sign up/i }).or(page.getByRole("button", { name: /sign up/i })).click();
    await page.locator('input[placeholder="Your name"]').fill("Mobile User");
    await page.locator('input[placeholder="Email address"]').fill(regEmail);
    await page.locator('input[placeholder*="Password"]').fill("TestPass123!");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible({ timeout: 15_000 });
  });

  test("mobile online events tab works", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Online" }).click();
    await expect(page.getByText("Online Events")).toBeVisible({ timeout: 15_000 });
  });

  test("map is full-width on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[role="application"][aria-label="Interactive map of India"]')).toBeVisible({ timeout: 30_000 });
    const box = await page.locator('[role="application"][aria-label="Interactive map of India"]').boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(375 * 0.8);
    }
  });

  test("no horizontal scroll on mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("no JS errors on mobile", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForTimeout(3000);
    const realErrors = errors.filter(e =>
      !e.includes("favicon") && !e.includes("net::ERR") && !e.includes("third-party") &&
      !e.includes("Failed to load resource") && !e.includes("ResizeObserver")
    );
    expect(realErrors).toEqual([]);
  });
});
