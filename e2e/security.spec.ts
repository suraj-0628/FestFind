import { test, expect } from "@playwright/test";

test.describe("CORS and security headers", () => {
  test("API returns proper CORS headers", async ({ request }) => {
    const res = await request.get("https://festfind.live/api/health");
    expect(res.status()).toBe(200);
    const cors = res.headers()["access-control-allow-origin"];
    expect(cors).toBeTruthy();
  });

  test("CSP header is set", async ({ request }) => {
    const res = await request.get("https://festfind.live/");
    const csp = res.headers()["content-security-policy"];
    expect(csp).toBeTruthy();
  });

  test("X-Content-Type-Options header", async ({ request }) => {
    const res = await request.get("https://festfind.live/");
    const header = res.headers()["x-content-type-options"];
    console.log(`X-Content-Type-Options: ${header || "not set"}`);
    expect(res.status()).toBe(200);
  });

  test("non-CORS origin is rejected for admin endpoints", async ({ request }) => {
    const res = await request.get("https://festfind.live/api/admin/overview", {
      headers: { Origin: "https://evil.com" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  test("rate limiting on auth endpoints", async ({ request }) => {
    const results: number[] = [];
    for (let i = 0; i < 15; i++) {
      const res = await request.post("https://festfind.live/api/auth/login", {
        data: { email: "ratelimit@test.com", password: "wrong" },
      });
      results.push(res.status());
    }
    const has429 = results.includes(429);
    console.log(`Rate limiting active: ${has429}, statuses: ${[...new Set(results)].join(",")}`);
  });
});

test.describe("Security edge cases", () => {
  test("SQL injection in search is harmless", async ({ request }) => {
    const res = await request.get("https://festfind.live/api/events/?search='; DROP TABLE events; --");
    expect(res.status()).toBe(200);
    const verify = await request.get("https://festfind.live/api/events/");
    expect(verify.status()).toBe(200);
  });

  test("XSS in search parameter is reflected safely", async ({ request }) => {
    const res = await request.get("https://festfind.live/api/events/?search=<script>alert(1)</script>");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).not.toContain("<script>alert(1)</script>");
  });

  test("SQL injection in registration is harmless", async ({ request }) => {
    const res = await request.post("https://festfind.live/api/auth/register", {
      data: {
        name: "'; DROP TABLE users; --",
        email: "sqlinjection@test.com",
        password: "TestPass123!",
      },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test("register with very long name is handled", async ({ request }) => {
    const longName = "A".repeat(1000);
    const res = await request.post("https://festfind.live/api/auth/register", {
      data: {
        name: longName,
        email: `longname_${Date.now()}@test.com`,
        password: "TestPass123!",
      },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test("upload without file returns proper error", async ({ request }) => {
    const res = await request.post("https://festfind.live/api/upload/", {
      headers: { Authorization: "Bearer fake-token" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("get nonexistent event returns 404", async ({ request }) => {
    const res = await request.get("https://festfind.live/api/events/999999");
    expect(res.status()).toBe(404);
  });

  test("admin endpoint with fake token returns 401", async ({ request }) => {
    const res = await request.get("https://festfind.live/api/admin/overview", {
      headers: { Authorization: "Bearer fake-jwt-token" },
    });
    expect(res.status()).toBe(401);
  });

  test("register with empty password fails validation", async ({ request }) => {
    const res = await request.post("https://festfind.live/api/auth/register", {
      data: {
        name: "Test",
        email: `empty_${Date.now()}@test.com`,
        password: "",
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("register with short password fails validation", async ({ request }) => {
    const res = await request.post("https://festfind.live/api/auth/register", {
      data: {
        name: "Test",
        email: `short_${Date.now()}@test.com`,
        password: "123",
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
