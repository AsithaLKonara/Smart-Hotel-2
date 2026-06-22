# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flows >> Failed login with invalid credentials
- Location: tests/e2e-generated/auth.spec.ts:20:7

# Error details

```
TimeoutError: locator.fill: Timeout 15000ms exceeded.
Call log:
  - waiting for getByLabel(/email/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic:
    - img "Global Background"
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e7]:
            - img [ref=e8]
            - generic [ref=e10]: +1 (800) 555-HOTEL
          - generic [ref=e11]:
            - img [ref=e12]
            - generic [ref=e15]: info@smarthotel.com
        - generic [ref=e16]:
          - img [ref=e17]
          - generic [ref=e20]: 123 Grand Boulevard, City Center, Metropolitan Area, ST 10001
      - navigation "Primary navigation" [ref=e21]:
        - generic [ref=e22]:
          - link "GP SmartHotel Grand Palace" [ref=e23] [cursor=pointer]:
            - /url: /
            - generic [ref=e26]: GP
            - generic [ref=e28]: SmartHotel Grand Palace
          - generic [ref=e29]:
            - link "Home" [ref=e30] [cursor=pointer]:
              - /url: /
            - link "Rooms" [ref=e31] [cursor=pointer]:
              - /url: /rooms
            - link "Gallery" [ref=e32] [cursor=pointer]:
              - /url: /gallery
            - link "Facilities" [ref=e33] [cursor=pointer]:
              - /url: /facilities
            - link "Contact" [ref=e34] [cursor=pointer]:
              - /url: /contact
          - generic [ref=e35]:
            - link "Sign In" [ref=e36] [cursor=pointer]:
              - /url: /auth/signin
            - link "Book Your Stay" [ref=e37] [cursor=pointer]:
              - /url: /booking
              - button "Book Your Stay" [ref=e38]
    - main [ref=e39]:
      - generic [ref=e40]:
        - img "Luxury Hotel Backdrop" [ref=e42]
        - generic [ref=e46]:
          - generic [ref=e47]:
            - generic [ref=e48]:
              - link "SMART HOTEL" [ref=e49] [cursor=pointer]:
                - /url: /
                - generic [ref=e50]:
                  - text: SMART
                  - generic [ref=e51]: HOTEL
                  - img [ref=e52]
              - generic [ref=e54]:
                - heading "Operational Intelligence." [level=1] [ref=e55]:
                  - text: Operational
                  - text: Intelligence.
                - paragraph [ref=e56]: Welcome to the command center of SmartHotel. Access the multi-tenant orchestration layer and manage luxury at scale.
              - generic [ref=e57]:
                - generic [ref=e60]: Simulator Access
                - generic [ref=e61]:
                  - button "Role Admin" [ref=e62] [cursor=pointer]:
                    - generic [ref=e63]:
                      - generic [ref=e64]: Role
                      - generic [ref=e65]: Admin
                    - img [ref=e67]
                  - button "Role Manager" [ref=e69] [cursor=pointer]:
                    - generic [ref=e70]:
                      - generic [ref=e71]: Role
                      - generic [ref=e72]: Manager
                    - img [ref=e74]
                  - button "Role Receptionist" [ref=e76] [cursor=pointer]:
                    - generic [ref=e77]:
                      - generic [ref=e78]: Role
                      - generic [ref=e79]: Receptionist
                    - img [ref=e81]
                  - button "Role Kitchen" [ref=e83] [cursor=pointer]:
                    - generic [ref=e84]:
                      - generic [ref=e85]: Role
                      - generic [ref=e86]: Kitchen
                    - img [ref=e88]
                  - button "Role Housekeeping" [ref=e90] [cursor=pointer]:
                    - generic [ref=e91]:
                      - generic [ref=e92]: Role
                      - generic [ref=e93]: Housekeeping
                    - img [ref=e95]
                  - button "Role Maintenance" [ref=e97] [cursor=pointer]:
                    - generic [ref=e98]:
                      - generic [ref=e99]: Role
                      - generic [ref=e100]: Maintenance
                    - img [ref=e102]
                  - button "Role Guest" [ref=e104] [cursor=pointer]:
                    - generic [ref=e105]:
                      - generic [ref=e106]: Role
                      - generic [ref=e107]: Guest
                    - img [ref=e109]
            - generic [ref=e111]:
              - img [ref=e112]
              - generic [ref=e115]: Encrypted Quantum Layer Access
          - generic [ref=e117]:
            - generic [ref=e118]:
              - heading "Sign In" [level=2] [ref=e119]
              - paragraph [ref=e120]: Enter your sanctuary credentials or use social access.
            - generic [ref=e121]:
              - button "Google" [ref=e122] [cursor=pointer]:
                - img [ref=e123]
                - generic [ref=e128]: Google
              - button "Facebook" [ref=e129] [cursor=pointer]:
                - img [ref=e130]
                - generic [ref=e132]: Facebook
            - generic [ref=e137]: Universal Security Gate
            - generic [ref=e138]:
              - generic [ref=e139]:
                - generic [ref=e140]:
                  - text: Staff Email
                  - textbox "name@smarthotel.com" [ref=e141]
                - generic [ref=e142]:
                  - generic [ref=e143]:
                    - generic [ref=e144]: Access Key
                    - link "Reset Key?" [ref=e145] [cursor=pointer]:
                      - /url: /auth/forgot-password
                  - generic [ref=e146]:
                    - textbox "••••••••" [ref=e147]
                    - button [ref=e148] [cursor=pointer]:
                      - img [ref=e149]
              - button "Initialize Session" [ref=e152] [cursor=pointer]:
                - generic [ref=e153]:
                  - text: Initialize Session
                  - img [ref=e154]
            - paragraph [ref=e156]:
              - text: Not part of the sanctuary yet?
              - link "Apply for Access" [ref=e157] [cursor=pointer]:
                - /url: "#"
    - contentinfo [ref=e158]:
      - img "Luxury Hotel Lobby" [ref=e160]
      - generic [ref=e162]:
        - generic [ref=e163]:
          - generic [ref=e164]:
            - generic [ref=e165]:
              - generic [ref=e166]:
                - generic [ref=e168]: GP
                - generic [ref=e169]: SMARTHOTEL
              - paragraph [ref=e170]: Luxury 5-Star Accommodation
            - paragraph [ref=e171]: Experience unparalleled luxury where timeless elegance meets modern hospitality.
          - generic [ref=e172]:
            - heading "Quick Links" [level=4] [ref=e173]
            - list [ref=e174]:
              - listitem [ref=e175]:
                - link "Rooms & Suites" [ref=e176] [cursor=pointer]:
                  - /url: /rooms
              - listitem [ref=e177]:
                - link "Facilities" [ref=e178] [cursor=pointer]:
                  - /url: /facilities
              - listitem [ref=e179]:
                - link "Gallery" [ref=e180] [cursor=pointer]:
                  - /url: /gallery
              - listitem [ref=e181]:
                - link "Contact" [ref=e182] [cursor=pointer]:
                  - /url: /contact
          - generic [ref=e183]:
            - heading "Services" [level=4] [ref=e184]
            - list [ref=e185]:
              - listitem [ref=e186]:
                - link "Concierge" [ref=e187] [cursor=pointer]:
                  - /url: /contact
              - listitem [ref=e188]:
                - link "Spa & Wellness" [ref=e189] [cursor=pointer]:
                  - /url: /facilities
              - listitem [ref=e190]:
                - link "Fitness Center" [ref=e191] [cursor=pointer]:
                  - /url: /facilities
              - listitem [ref=e192]:
                - link "Valet Parking" [ref=e193] [cursor=pointer]:
                  - /url: /facilities
          - generic [ref=e194]:
            - heading "Contact" [level=4] [ref=e195]
            - generic [ref=e196]:
              - generic [ref=e197]:
                - img [ref=e198]
                - paragraph [ref=e201]: 123 Grand Boulevard, City Center, Metropolitan Area, ST 10001
              - generic [ref=e202]:
                - img [ref=e203]
                - paragraph [ref=e205]: +1 (800) 555-HOTEL
              - generic [ref=e206]:
                - img [ref=e207]
                - paragraph [ref=e210]: info@smarthotel.com
        - generic [ref=e212]:
          - paragraph [ref=e213]: © 2026 SmartHotel Grand Palace. All rights reserved.
          - link "Contact Us" [ref=e215] [cursor=pointer]:
            - /url: /contact
  - button "Open chat concierge" [ref=e217] [cursor=pointer]:
    - img [ref=e219]
  - button "Open Next.js Dev Tools" [ref=e227] [cursor=pointer]:
    - img [ref=e228]
  - alert [ref=e231]
```

# Test source

```ts
  1  | import { test, expect } from './fixtures/test-data';
  2  | 
  3  | test.describe('Authentication Flows', () => {
  4  |   test('Successful login with valid credentials', async ({ page }) => {
  5  |     // Navigate to login page
  6  |     await page.goto('/auth/signin');
  7  |     
  8  |     // Fill credentials (assuming demo accounts are seeded as per typical structure)
  9  |     await page.getByLabel(/email/i).fill('admin@smarthotel.local');
  10 |     await page.getByLabel(/password/i).fill('password123'); // Adjust based on seed data
  11 |     
  12 |     // Click submit
  13 |     await page.getByRole('button', { name: /sign in|login/i }).click();
  14 |     
  15 |     // Verify successful redirect to dashboard
  16 |     await expect(page).toHaveURL(/.*dashboard/);
  17 |     await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10000 });
  18 |   });
  19 | 
  20 |   test('Failed login with invalid credentials', async ({ page, uniqueEmail }) => {
  21 |     await page.goto('/auth/signin');
  22 |     
> 23 |     await page.getByLabel(/email/i).fill(uniqueEmail);
     |                                     ^ TimeoutError: locator.fill: Timeout 15000ms exceeded.
  24 |     await page.getByLabel(/password/i).fill('wrongpassword');
  25 |     
  26 |     await page.getByRole('button', { name: /sign in|login/i }).click();
  27 |     
  28 |     // Verify error message
  29 |     await expect(page.getByText(/invalid credentials|sign in failed/i)).toBeVisible();
  30 |     await expect(page).toHaveURL(/.*signin/);
  31 |   });
  32 | 
  33 |   test('Session expiration and protected route redirect', async ({ page }) => {
  34 |     // Attempt to access protected route without session
  35 |     await page.goto('/admin/dashboard');
  36 |     
  37 |     // Should automatically redirect to signin
  38 |     await expect(page).toHaveURL(/.*signin.*/);
  39 |   });
  40 | 
  41 |   test('Logout flow', async ({ page }) => {
  42 |     // First login
  43 |     await page.goto('/auth/signin');
  44 |     await page.getByLabel(/email/i).fill('admin@smarthotel.local');
  45 |     await page.getByLabel(/password/i).fill('password123');
  46 |     await page.getByRole('button', { name: /sign in|login/i }).click();
  47 |     await expect(page).toHaveURL(/.*dashboard/);
  48 | 
  49 |     // Click user menu then logout
  50 |     await page.getByRole('button', { name: /user menu|profile/i }).click();
  51 |     await page.getByRole('menuitem', { name: /sign out|logout/i }).click();
  52 | 
  53 |     // Verify redirected back to home or signin
  54 |     await expect(page).toHaveURL(/.*(signin|\/)$/);
  55 |   });
  56 | });
  57 | 
```