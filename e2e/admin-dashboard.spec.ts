import { test, expect } from "@playwright/test";

const ADMIN = {
  email: "suraj.25mca@kct.ac.in",
  password: "admin123",
};

const ADMIN_URL = "/hq-9f3k";

async function loginAsAdmin(page: any) {
  await page.goto(ADMIN_URL);
  await page.locator('input[placeholder="Email"]').fill(ADMIN.email);
  await page.locator('input[placeholder="Password"]').fill(ADMIN.password);
  await page.locator('button[type="submit"]').filter({ hasText: "Login" }).click();
  // Wait for the admin sidebar to appear (any nav item)
  await page.waitForSelector('text=Overview', { timeout: 15_000 });
}

test.describe("Admin dashboard", () => {
  test("admin login page renders", async ({ page }) => {
    await page.goto(ADMIN_URL);
    await expect(page.getByText("FestFind Admin")).toBeVisible();
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Login");
  });

  test("admin login with wrong credentials shows error", async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.locator('input[placeholder="Email"]').fill(ADMIN.email);
    await page.locator('input[placeholder="Password"]').fill("WrongPassword!");
    await page.locator('button[type="submit"]').filter({ hasText: "Login" }).click();
    await expect(page.locator('.text-red-400, .text-red-500').first()).toBeVisible({ timeout: 10_000 });
  });

  test("admin login succeeds and shows overview", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText("Total Events")).toBeVisible({ timeout: 10_000 });
  });

  test("sidebar has all nav items", async ({ page }) => {
    await loginAsAdmin(page);
    for (const item of ["Overview", "Scraper", "Events", "Submissions", "Team", "System", "Banner", "Flags", "Map"]) {
      const navItem = page.locator(`nav >> text="${item}"`).or(page.getByRole("button", { name: item }));
      await expect(navItem.first()).toBeVisible();
    }
  });

  test("navigation between admin pages works", async ({ page }) => {
    await loginAsAdmin(page);

    // Scraper page
    await page.locator('nav').getByText("Scraper").click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("Run Now")).toBeVisible();

    // Events page
    await page.locator('nav').getByText("Events").first().click();
    await page.waitForTimeout(1000);

    // Submissions page
    await page.locator('nav').getByText("Submissions").click();
    await page.waitForTimeout(1000);

    // Team page
    await page.locator('nav').getByText("Team").click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("Team").first()).toBeVisible();

    // System page
    await page.locator('nav').getByText("System").click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("System Health")).toBeVisible();

    // Banner page
    await page.locator('nav').getByText("Banner").click();
    await page.waitForTimeout(1000);

    // Flags page
    await page.locator('nav').getByText("Flags").click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("Feature Flags")).toBeVisible();

    // Back to overview
    await page.locator('nav').getByText("Overview").click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("Total Events")).toBeVisible();
  });

  test("events page shows events and filters", async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('nav').getByText("Events").first().click();
    await page.waitForTimeout(3000);
    // Filter select should exist
    const filter = page.locator("select").first();
    await expect(filter).toBeVisible();
  });

  test("users page shows create form", async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('nav').getByText("Team").click();
    await page.waitForTimeout(2000);

    const addBtn = page.getByRole("button", { name: /add member/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(page.locator('input[placeholder="Name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Password"]')).toBeVisible();
  });

  test("create team member with valid data", async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('nav').getByText("Team").click();
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: /add member/i }).click();
    await page.waitForTimeout(500);

    const uniqueEmail = `maintainer_${Date.now()}@test.example.com`;
    await page.locator('input[placeholder="Name"]').fill("Test Maintainer");
    await page.locator('input[placeholder="Email"]').fill(uniqueEmail);
    await page.locator('input[placeholder*="Password"]').fill("Maintainer123!");

    await page.getByRole("button", { name: /maintainer/i }).click();
    await page.getByRole("button", { name: /create account/i }).click();

    await page.waitForTimeout(3000);
    await expect(page.getByText(uniqueEmail).or(page.getByText("Test Maintainer"))).toBeVisible({ timeout: 10_000 });
  });

  test("scraper page shows status cards", async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('nav').getByText("Scraper").click();
    await page.waitForTimeout(2000);
    await expect(page.getByText("Status")).toBeVisible();
    await expect(page.getByText("Run Now")).toBeVisible();
  });

  test("health page shows system info", async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('nav').getByText("System").click();
    await page.waitForTimeout(2000);
    await expect(page.getByText("DB Size")).toBeVisible();
    await expect(page.getByText("Uploads")).toBeVisible();
  });

  test("announcements page renders with create form", async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('nav').getByText("Banner").click();
    await page.waitForTimeout(2000);
    await expect(page.locator('input[placeholder="Title"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Message"]')).toBeVisible();
  });

  test("create and delete announcement", async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('nav').getByText("Banner").click();
    await page.waitForTimeout(2000);

    const title = `E2E Test Announcement ${Date.now()}`;
    await page.locator('input[placeholder="Title"]').fill(title);
    await page.locator('textarea[placeholder*="Message"]').fill("This is an E2E test announcement.");
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });

    // Delete it
    const delBtn = page.locator("button").filter({ hasText: /del/i }).last();
    if (await delBtn.isVisible()) {
      await delBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test("flags page shows toggle section", async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('nav').getByText("Flags").click();
    await page.waitForTimeout(2000);
    await expect(page.getByText("Feature Flags")).toBeVisible();
  });

  test("admin logout works", async ({ page }) => {
    await loginAsAdmin(page);
    const logoutBtn = page.getByRole("button", { name: /logout/i });
    await expect(logoutBtn).toBeVisible({ timeout: 5000 });
    await logoutBtn.click();
    // Should show login form again
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible({ timeout: 10_000 });
  });

  test("non-admin cannot access admin", async ({ page }) => {
    const regEmail = `nonadmin_${Date.now()}@test.example.com`;
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: /sign up/i }).or(page.getByRole("button", { name: /sign up/i })).click();
    await page.locator('input[placeholder="Your name"]').fill("Non Admin");
    await page.locator('input[placeholder="Email address"]').fill(regEmail);
    await page.locator('input[placeholder*="Password"]').fill("TestPass123!");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible({ timeout: 15_000 });

    // Try accessing admin
    await page.goto(ADMIN_URL);
    await expect(page.getByText("Access Denied")).toBeVisible({ timeout: 10_000 });
  });

  test("no JS errors on admin dashboard", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await loginAsAdmin(page);
    await page.waitForTimeout(3000);
    const realErrors = errors.filter(e =>
      !e.includes("favicon") && !e.includes("net::ERR") && !e.includes("third-party") && !e.includes("Failed to load resource")
    );
    expect(realErrors).toEqual([]);
  });
});
