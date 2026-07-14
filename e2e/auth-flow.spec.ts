import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "E2E Test User",
  email: `e2etest_${Date.now()}@test.example.com`,
  password: "TestPass123!",
};

test.describe("Authentication flow", () => {
  test("login form appears when clicking Host tab while logged out", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[placeholder="Email address"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Sign In");
  });

  test("toggle to register mode", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: /sign up/i }).or(page.getByRole("button", { name: /sign up/i })).click();
    await expect(page.getByText("Join FestFind")).toBeVisible();
    await expect(page.locator('input[placeholder="Your name"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Create Account");
  });

  test("toggle back to login mode", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: /sign up/i }).or(page.getByRole("button", { name: /sign up/i })).click();
    await expect(page.getByText("Join FestFind")).toBeVisible();

    await page.getByRole("link", { name: /sign in$/i }).or(page.getByRole("button", { name: /sign in$/i })).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible();
  });

  test("register with valid data", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: /sign up/i }).or(page.getByRole("button", { name: /sign up/i })).click();
    await expect(page.getByText("Join FestFind")).toBeVisible();

    await page.locator('input[placeholder="Your name"]').fill(TEST_USER.name);
    await page.locator('input[placeholder="Email address"]').fill(TEST_USER.email);
    await page.locator('input[placeholder*="Password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();

    // Should auto-switch to submit tab after successful registration
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible({ timeout: 15_000 });
  });

  test("register with existing email shows error", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: /sign up/i }).or(page.getByRole("button", { name: /sign up/i })).click();
    await expect(page.getByText("Join FestFind")).toBeVisible();

    await page.locator('input[placeholder="Your name"]').fill("Duplicate User");
    await page.locator('input[placeholder="Email address"]').fill(TEST_USER.email);
    await page.locator('input[placeholder*="Password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.text-red-400')).toBeVisible({ timeout: 10_000 });
  });

  test("register with short password fails validation", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: /sign up/i }).or(page.getByRole("button", { name: /sign up/i })).click();

    await page.locator('input[placeholder="Your name"]').fill("Short Pass User");
    await page.locator('input[placeholder="Email address"]').fill("short@test.com");
    await page.locator('input[placeholder*="Password"]').fill("123");
    await page.locator('button[type="submit"]').click();

    // HTML5 minLength=6 validation should prevent submission
    await expect(page.getByText("Join FestFind")).toBeVisible();
  });

  test("login with valid credentials", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.locator('input[placeholder="Email address"]').fill(TEST_USER.email);
    await page.locator('input[placeholder*="Password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();

    // Should auto-switch to submit tab after login
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible({ timeout: 15_000 });
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.locator('input[placeholder="Email address"]').fill(TEST_USER.email);
    await page.locator('input[placeholder*="Password"]').fill("WrongPassword123!");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.text-red-400')).toBeVisible({ timeout: 10_000 });
  });

  test("login with nonexistent email shows error", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.locator('input[placeholder="Email address"]').fill("nonexistent@example.com");
    await page.locator('input[placeholder*="Password"]').fill("SomePassword123!");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.text-red-400')).toBeVisible({ timeout: 10_000 });
  });

  test("logout works", async ({ page }) => {
    // Register a fresh user
    const logoutEmail = `logout_${Date.now()}@test.example.com`;
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: /sign up/i }).or(page.getByRole("button", { name: /sign up/i })).click();
    await page.locator('input[placeholder="Your name"]').fill("Logout Tester");
    await page.locator('input[placeholder="Email address"]').fill(logoutEmail);
    await page.locator('input[placeholder*="Password"]').fill("TestPass123!");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible({ timeout: 15_000 });

    // Logout
    const logoutBtn = page.getByRole("button", { name: /logout/i });
    await expect(logoutBtn).toBeVisible({ timeout: 5000 });
    await logoutBtn.click();

    // After logout, Host tab should show login form
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });
  });

  test("session persists across page reload", async ({ page }) => {
    const reloadEmail = `reload_${Date.now()}@test.example.com`;
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: /sign up/i }).or(page.getByRole("button", { name: /sign up/i })).click();
    await page.locator('input[placeholder="Your name"]').fill("Reload Tester");
    await page.locator('input[placeholder="Email address"]').fill(reloadEmail);
    await page.locator('input[placeholder*="Password"]').fill("TestPass123!");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible({ timeout: 15_000 });

    // Reload
    await page.reload();
    await page.waitForTimeout(2000);
    // Logout button should still be visible (session persisted)
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible({ timeout: 10_000 });
  });

  test("no JS exceptions during auth flow", async ({ page }) => {
    const exceptions: Error[] = [];
    page.on("pageerror", err => exceptions.push(err));
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    expect(exceptions).toEqual([]);
  });
});
