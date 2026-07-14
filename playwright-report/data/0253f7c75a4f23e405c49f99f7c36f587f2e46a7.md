# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-dashboard.spec.ts >> Admin dashboard >> create team member with valid data
- Location: e2e/admin-dashboard.spec.ts:113:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('maintainer_1783978166822@test.example.com').or(getByText('Test Maintainer'))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('maintainer_1783978166822@test.example.com').or(getByText('Test Maintainer'))

```

```yaml
- complementary:
  - heading "FestFind Admin" [level=1]
  - link "Site":
    - /url: /
  - navigation:
    - button "Overview":
      - img
      - text: Overview
    - button "Scraper":
      - img
      - text: Scraper
    - button "Events":
      - img
      - text: Events
    - button "Submissions":
      - img
      - text: Submissions
    - button "Team":
      - img
      - text: Team
    - button "System":
      - img
      - text: System
    - button "Banner":
      - img
      - text: Banner
    - button "Flags":
      - img
      - text: Flags
    - button "Map":
      - img
      - text: Map
  - text: suraj
  - button "Logout"
- main:
  - heading "Team" [level=2]
  - paragraph: Manage admins and maintainers
  - button "Cancel"
  - heading "New team member" [level=3]
  - paragraph: "[object Object]"
  - button "Admin"
  - button "Maintainer"
  - paragraph: Access to Submissions only
  - textbox "Name": Test Maintainer
  - textbox "Email": maintainer_1783978166822@test.example.com
  - textbox "Password (min 8 chars)": Maintainer123!
  - button "Create Account"
  - heading "Current team (3)" [level=3]
  - textbox "Search..."
  - table:
    - rowgroup:
      - row "Name Email Role Joined Active Actions":
        - columnheader "Name"
        - columnheader "Email"
        - columnheader "Role"
        - columnheader "Joined"
        - columnheader "Active"
        - columnheader "Actions"
    - rowgroup:
      - row "Test test@example.com Maintainer 7/13/2026 Active Disable":
        - cell "Test"
        - cell "test@example.com"
        - cell "Maintainer":
          - combobox:
            - option "Admin"
            - option "Maintainer" [selected]
            - option "Remove"
        - cell "7/13/2026"
        - cell "Active"
        - cell "Disable":
          - button "Disable"
      - row "Test test@test.example.com Maintainer 7/13/2026 Active Disable":
        - cell "Test"
        - cell "test@test.example.com"
        - cell "Maintainer":
          - combobox:
            - option "Admin"
            - option "Maintainer" [selected]
            - option "Remove"
        - cell "7/13/2026"
        - cell "Active"
        - cell "Disable":
          - button "Disable"
      - row "suraj suraj.25mca@kct.ac.in Admin 7/7/2026 Active Disable":
        - cell "suraj"
        - cell "suraj.25mca@kct.ac.in"
        - cell "Admin":
          - combobox:
            - option "Admin" [selected]
            - option "Maintainer"
            - option "Remove"
        - cell "7/7/2026"
        - cell "Active"
        - cell "Disable":
          - button "Disable"
  - button "Prev" [disabled]
  - text: Page 1
  - button "Next" [disabled]
```

# Test source

```ts
  30  |     await page.locator('input[placeholder="Email"]').fill(ADMIN.email);
  31  |     await page.locator('input[placeholder="Password"]').fill("WrongPassword!");
  32  |     await page.locator('button[type="submit"]').filter({ hasText: "Login" }).click();
  33  |     await expect(page.locator('.text-red-400, .text-red-500').first()).toBeVisible({ timeout: 10_000 });
  34  |   });
  35  | 
  36  |   test("admin login succeeds and shows overview", async ({ page }) => {
  37  |     await loginAsAdmin(page);
  38  |     await expect(page.getByText("Total Events")).toBeVisible({ timeout: 10_000 });
  39  |   });
  40  | 
  41  |   test("sidebar has all nav items", async ({ page }) => {
  42  |     await loginAsAdmin(page);
  43  |     for (const item of ["Overview", "Scraper", "Events", "Submissions", "Team", "System", "Banner", "Flags", "Map"]) {
  44  |       const navItem = page.locator(`nav >> text="${item}"`).or(page.getByRole("button", { name: item }));
  45  |       await expect(navItem.first()).toBeVisible();
  46  |     }
  47  |   });
  48  | 
  49  |   test("navigation between admin pages works", async ({ page }) => {
  50  |     await loginAsAdmin(page);
  51  | 
  52  |     // Scraper page
  53  |     await page.locator('nav').getByText("Scraper").click();
  54  |     await page.waitForTimeout(1000);
  55  |     await expect(page.getByText("Run Now")).toBeVisible();
  56  | 
  57  |     // Events page
  58  |     await page.locator('nav').getByText("Events").first().click();
  59  |     await page.waitForTimeout(1000);
  60  | 
  61  |     // Submissions page
  62  |     await page.locator('nav').getByText("Submissions").click();
  63  |     await page.waitForTimeout(1000);
  64  | 
  65  |     // Team page
  66  |     await page.locator('nav').getByText("Team").click();
  67  |     await page.waitForTimeout(1000);
  68  |     await expect(page.getByText("Team").first()).toBeVisible();
  69  | 
  70  |     // System page
  71  |     await page.locator('nav').getByText("System").click();
  72  |     await page.waitForTimeout(1000);
  73  |     await expect(page.getByText("System Health")).toBeVisible();
  74  | 
  75  |     // Banner page
  76  |     await page.locator('nav').getByText("Banner").click();
  77  |     await page.waitForTimeout(1000);
  78  | 
  79  |     // Flags page
  80  |     await page.locator('nav').getByText("Flags").click();
  81  |     await page.waitForTimeout(1000);
  82  |     await expect(page.getByText("Feature Flags")).toBeVisible();
  83  | 
  84  |     // Back to overview
  85  |     await page.locator('nav').getByText("Overview").click();
  86  |     await page.waitForTimeout(1000);
  87  |     await expect(page.getByText("Total Events")).toBeVisible();
  88  |   });
  89  | 
  90  |   test("events page shows events and filters", async ({ page }) => {
  91  |     await loginAsAdmin(page);
  92  |     await page.locator('nav').getByText("Events").first().click();
  93  |     await page.waitForTimeout(3000);
  94  |     // Filter select should exist
  95  |     const filter = page.locator("select").first();
  96  |     await expect(filter).toBeVisible();
  97  |   });
  98  | 
  99  |   test("users page shows create form", async ({ page }) => {
  100 |     await loginAsAdmin(page);
  101 |     await page.locator('nav').getByText("Team").click();
  102 |     await page.waitForTimeout(2000);
  103 | 
  104 |     const addBtn = page.getByRole("button", { name: /add member/i });
  105 |     await expect(addBtn).toBeVisible();
  106 |     await addBtn.click();
  107 | 
  108 |     await expect(page.locator('input[placeholder="Name"]')).toBeVisible();
  109 |     await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
  110 |     await expect(page.locator('input[placeholder*="Password"]')).toBeVisible();
  111 |   });
  112 | 
  113 |   test("create team member with valid data", async ({ page }) => {
  114 |     await loginAsAdmin(page);
  115 |     await page.locator('nav').getByText("Team").click();
  116 |     await page.waitForTimeout(2000);
  117 | 
  118 |     await page.getByRole("button", { name: /add member/i }).click();
  119 |     await page.waitForTimeout(500);
  120 | 
  121 |     const uniqueEmail = `maintainer_${Date.now()}@test.example.com`;
  122 |     await page.locator('input[placeholder="Name"]').fill("Test Maintainer");
  123 |     await page.locator('input[placeholder="Email"]').fill(uniqueEmail);
  124 |     await page.locator('input[placeholder*="Password"]').fill("Maintainer123!");
  125 | 
  126 |     await page.getByRole("button", { name: /maintainer/i }).click();
  127 |     await page.getByRole("button", { name: /create account/i }).click();
  128 | 
  129 |     await page.waitForTimeout(3000);
> 130 |     await expect(page.getByText(uniqueEmail).or(page.getByText("Test Maintainer"))).toBeVisible({ timeout: 10_000 });
      |                                                                                     ^ Error: expect(locator).toBeVisible() failed
  131 |   });
  132 | 
  133 |   test("scraper page shows status cards", async ({ page }) => {
  134 |     await loginAsAdmin(page);
  135 |     await page.locator('nav').getByText("Scraper").click();
  136 |     await page.waitForTimeout(2000);
  137 |     await expect(page.getByText("Status")).toBeVisible();
  138 |     await expect(page.getByText("Run Now")).toBeVisible();
  139 |   });
  140 | 
  141 |   test("health page shows system info", async ({ page }) => {
  142 |     await loginAsAdmin(page);
  143 |     await page.locator('nav').getByText("System").click();
  144 |     await page.waitForTimeout(2000);
  145 |     await expect(page.getByText("DB Size")).toBeVisible();
  146 |     await expect(page.getByText("Uploads")).toBeVisible();
  147 |   });
  148 | 
  149 |   test("announcements page renders with create form", async ({ page }) => {
  150 |     await loginAsAdmin(page);
  151 |     await page.locator('nav').getByText("Banner").click();
  152 |     await page.waitForTimeout(2000);
  153 |     await expect(page.locator('input[placeholder="Title"]')).toBeVisible();
  154 |     await expect(page.locator('textarea[placeholder*="Message"]')).toBeVisible();
  155 |   });
  156 | 
  157 |   test("create and delete announcement", async ({ page }) => {
  158 |     await loginAsAdmin(page);
  159 |     await page.locator('nav').getByText("Banner").click();
  160 |     await page.waitForTimeout(2000);
  161 | 
  162 |     const title = `E2E Test Announcement ${Date.now()}`;
  163 |     await page.locator('input[placeholder="Title"]').fill(title);
  164 |     await page.locator('textarea[placeholder*="Message"]').fill("This is an E2E test announcement.");
  165 |     await page.getByRole("button", { name: /create/i }).click();
  166 | 
  167 |     await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
  168 | 
  169 |     // Delete it
  170 |     const delBtn = page.locator("button").filter({ hasText: /del/i }).last();
  171 |     if (await delBtn.isVisible()) {
  172 |       await delBtn.click();
  173 |       await page.waitForTimeout(2000);
  174 |     }
  175 |   });
  176 | 
  177 |   test("flags page shows toggle section", async ({ page }) => {
  178 |     await loginAsAdmin(page);
  179 |     await page.locator('nav').getByText("Flags").click();
  180 |     await page.waitForTimeout(2000);
  181 |     await expect(page.getByText("Feature Flags")).toBeVisible();
  182 |   });
  183 | 
  184 |   test("admin logout works", async ({ page }) => {
  185 |     await loginAsAdmin(page);
  186 |     const logoutBtn = page.getByRole("button", { name: /logout/i });
  187 |     await expect(logoutBtn).toBeVisible({ timeout: 5000 });
  188 |     await logoutBtn.click();
  189 |     // Should show login form again
  190 |     await expect(page.locator('input[placeholder="Email"]')).toBeVisible({ timeout: 10_000 });
  191 |   });
  192 | 
  193 |   test("non-admin cannot access admin", async ({ page }) => {
  194 |     const regEmail = `nonadmin_${Date.now()}@test.example.com`;
  195 |     await page.goto("/");
  196 |     await page.locator('button[role="tab"]').filter({ hasText: "Host" }).click();
  197 |     await expect(page.getByText("Sign in to continue")).toBeVisible({ timeout: 10_000 });
  198 | 
  199 |     await page.getByRole("link", { name: /sign up/i }).or(page.getByRole("button", { name: /sign up/i })).click();
  200 |     await page.locator('input[placeholder="Your name"]').fill("Non Admin");
  201 |     await page.locator('input[placeholder="Email address"]').fill(regEmail);
  202 |     await page.locator('input[placeholder*="Password"]').fill("TestPass123!");
  203 |     await page.locator('button[type="submit"]').click();
  204 |     await expect(page.getByText("Put Your Event on the Map")).toBeVisible({ timeout: 15_000 });
  205 | 
  206 |     // Try accessing admin
  207 |     await page.goto(ADMIN_URL);
  208 |     await expect(page.getByText("Access Denied")).toBeVisible({ timeout: 10_000 });
  209 |   });
  210 | 
  211 |   test("no JS errors on admin dashboard", async ({ page }) => {
  212 |     const errors: string[] = [];
  213 |     page.on("console", msg => {
  214 |       if (msg.type() === "error") errors.push(msg.text());
  215 |     });
  216 |     await loginAsAdmin(page);
  217 |     await page.waitForTimeout(3000);
  218 |     const realErrors = errors.filter(e =>
  219 |       !e.includes("favicon") && !e.includes("net::ERR") && !e.includes("third-party") && !e.includes("Failed to load resource")
  220 |     );
  221 |     expect(realErrors).toEqual([]);
  222 |   });
  223 | });
  224 | 
```