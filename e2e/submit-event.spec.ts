import { test, expect } from "@playwright/test";

async function registerAndLogin(page: any, prefix: string) {
  const regEmail = `${prefix}_${Date.now()}@test.example.com`;
  await page.goto("/");
  await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
  await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });

  await page.getByRole("link", { name: /sign up/i }).or(page.getByRole("button", { name: /sign up/i })).click();
  await page.locator('input[placeholder="Your name"]').fill(`${prefix} Tester`);
  await page.locator('input[placeholder="Email address"]').fill(regEmail);
  await page.locator('input[placeholder*="Password"]').fill("TestPass123!");
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText("Put Your Event on the Map")).toBeVisible({ timeout: 15_000 });
  return regEmail;
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T10:00`;
}

function nextWeek() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T18:00`;
}

test.describe("Event submission form", () => {
  test("submit tab requires login", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
    await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });
  });

  test("submit form renders all fields when logged in", async ({ page }) => {
    await registerAndLogin(page, "fields");
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible();

    await expect(page.locator("#event-title")).toBeVisible();
    await expect(page.locator("#event-organizer")).toBeVisible();
    await expect(page.locator("#event-city")).toBeVisible();
    await expect(page.locator("#event-state")).toBeVisible();
    await expect(page.locator("#event-category")).toBeVisible();
    await expect(page.locator("#event-start")).toBeVisible();
    await expect(page.locator("#event-end")).toBeVisible();
    await expect(page.locator("#event-description")).toBeVisible();
    await expect(page.locator("#event-type")).toBeVisible();
    await expect(page.locator("#event-venue")).toBeVisible();
    await expect(page.locator("#event-maps-link")).toBeVisible();
    await expect(page.locator("#event-url")).toBeVisible();
  });

  test("submit empty form shows validation", async ({ page }) => {
    await registerAndLogin(page, "empty");
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible();

    await page.locator('button[type="submit"]').filter({ hasText: "Submit for Review" }).click();
    await expect(page.locator('.text-red-400, .text-red-500, [role="alert"]').first()).toBeVisible({ timeout: 5000 });
  });

  test("submit with valid data shows success", async ({ page }) => {
    await registerAndLogin(page, "valid");
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible();

    await page.locator("#event-title").fill("E2E Test Hackathon");
    await page.locator("#event-organizer").fill("E2E Testing University");
    await page.locator("#event-city").fill("Mumbai");
    await page.locator("#event-state").selectOption("Maharashtra");
    await page.locator("#event-category").selectOption("Hackathon");
    await page.locator("#event-start").fill(tomorrow());
    await page.locator("#event-end").fill(nextWeek());
    await page.locator("#event-description").fill("A test hackathon event for E2E testing purposes.");

    await page.locator('button[type="submit"]').filter({ hasText: "Submit for Review" }).click();

    await expect(
      page.getByText("Event Submitted").or(page.getByText("pending review"))
    ).toBeVisible({ timeout: 15_000 });
  });

  test("registration URL validation rejects non-http URLs", async ({ page }) => {
    await registerAndLogin(page, "url");
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible();

    await page.locator("#event-title").fill("URL Test Event");
    await page.locator("#event-organizer").fill("URL Test University");
    await page.locator("#event-city").fill("Delhi");
    await page.locator("#event-state").selectOption("Delhi");
    await page.locator("#event-category").selectOption("Workshop");
    await page.locator("#event-start").fill(tomorrow());
    await page.locator("#event-end").fill(nextWeek());
    await page.locator("#event-url").fill("not-a-valid-url");

    await page.locator('button[type="submit"]').filter({ hasText: "Submit for Review" }).click();
    await expect(page.getByText("URL must start with http")).toBeVisible({ timeout: 5000 });
  });

  test("event type toggle switches between physical and online", async ({ page }) => {
    await registerAndLogin(page, "type");
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible();

    const eventType = page.locator("#event-type");
    await expect(eventType).toHaveValue("physical");

    await eventType.selectOption("online");
    await expect(eventType).toHaveValue("online");

    await eventType.selectOption("physical");
    await expect(eventType).toHaveValue("physical");
  });

  test("word count updates in description", async ({ page }) => {
    await registerAndLogin(page, "word");
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible();

    await page.locator("#event-description").fill("Hello world this is a test description");
    await expect(page.getByText(/\/500 words/)).toBeVisible();
  });

  test("cancel button returns to map", async ({ page }) => {
    await registerAndLogin(page, "cancel");
    await expect(page.getByText("Put Your Event on the Map")).toBeVisible();

    await page.locator('button[type="button"]').filter({ hasText: "Cancel" }).click();

    const mapTab = page.locator('button[role="tab"]').filter({ hasText: "Map" });
    await expect(mapTab).toHaveAttribute("aria-selected", "true");
  });

  test("no JS errors on submit page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await registerAndLogin(page, "jserr");
    await page.waitForTimeout(3000);
    const realErrors = errors.filter(e =>
      !e.includes("favicon") && !e.includes("net::ERR") && !e.includes("third-party") && !e.includes("ResizeObserver")
    );
    expect(realErrors).toEqual([]);
  });
});
