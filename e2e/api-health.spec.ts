import { test, expect, request } from "@playwright/test";

const API = "https://festfind.live/api";

test.describe("API endpoint health", () => {
  test("GET /api/health returns 200", async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.status()).toBe(200);
  });

  test("GET /api/events/ returns paginated response", async ({ request }) => {
    const res = await request.get(`${API}/events/`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBeTruthy();
    expect(data).toHaveProperty("total");
  });

  test("GET /api/events/ with pagination params", async ({ request }) => {
    const res = await request.get(`${API}/events/?page=1&page_size=5`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.items)).toBeTruthy();
    expect(data.items.length).toBeLessThanOrEqual(5);
  });

  test("GET /api/events/ with search param", async ({ request }) => {
    const res = await request.get(`${API}/events/?search=hackathon`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("items");
  });

  test("GET /api/events/scrape/status returns status", async ({ request }) => {
    const res = await request.get(`${API}/events/scrape/status`);
    expect(res.status()).toBe(200);
  });

  test("GET /api/admin/public/announcements returns list", async ({ request }) => {
    const res = await request.get(`${API}/admin/public/announcements`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test("GET /api/admin/public/flags returns object", async ({ request }) => {
    const res = await request.get(`${API}/admin/public/flags`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(typeof data).toBe("object");
  });

  test("POST /api/auth/register with invalid data returns error", async ({ request }) => {
    const res = await request.post(`${API}/auth/register`, {
      data: { email: "bad" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("POST /api/auth/login with invalid data returns error", async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: "bad", password: "bad" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("GET /api/auth/me without cookie returns 401", async ({ request }) => {
    const res = await request.get(`${API}/auth/me`);
    expect(res.status()).toBe(401);
  });

  test("admin endpoints without auth return 401", async ({ request }) => {
    const endpoints = [
      `${API}/admin/overview`,
      `${API}/admin/users`,
      `${API}/admin/events`,
      `${API}/admin/system/health`,
    ];
    for (const url of endpoints) {
      const res = await request.get(url);
      expect(res.status()).toBeGreaterThanOrEqual(401);
    }
  });

  test("POST /api/events/ without auth returns 401", async ({ request }) => {
    const res = await request.post(`${API}/events/`, {
      data: { title: "test" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  test("GET /api/events/ with city filter", async ({ request }) => {
    const res = await request.get(`${API}/events/?city=Mumbai`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("items");
  });

  test("GET /api/events/ with category filter", async ({ request }) => {
    const res = await request.get(`${API}/events/?category=Hackathon`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("items");
  });

  test("GET /api/events/ with status filter", async ({ request }) => {
    const res = await request.get(`${API}/events/?status=approved`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("items");
  });

  test("GET /api/events/ with state filter", async ({ request }) => {
    const res = await request.get(`${API}/events/?state=Maharashtra`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("items");
  });

  test("GET /api/events/ with combined filters", async ({ request }) => {
    const res = await request.get(`${API}/events/?city=Mumbai&state=Maharashtra&category=Hackathon&status=approved&page_size=10`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("items");
  });

  test("GET /api/upload/invalid.jpg returns error", async ({ request }) => {
    const res = await request.get(`${API}/upload/nonexistent.jpg`);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("POST /api/upload/ without auth returns 401", async ({ request }) => {
    const res = await request.post(`${API}/upload/`, {
      multipart: {},
    });
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });
});
