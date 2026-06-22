# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Booking Flows >> Create a successful booking
- Location: tests/e2e-generated/booking.spec.ts:4:7

# Error details

```
TimeoutError: locator.fill: Timeout 15000ms exceeded.
Call log:
  - waiting for getByLabel(/check in/i)

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
        - generic [ref=e44]:
          - generic [ref=e47]: Reservation Flow
          - heading "Secure Your Stay" [level=1] [ref=e49]
          - generic [ref=e51]:
            - generic [ref=e53]:
              - img [ref=e55]
              - generic [ref=e57]: Dates
            - generic [ref=e58]:
              - img [ref=e60]
              - generic [ref=e65]: Select
            - generic [ref=e66]:
              - img [ref=e68]
              - generic [ref=e70]: Details
            - generic [ref=e71]:
              - img [ref=e73]
              - generic [ref=e76]: Done
        - generic [ref=e79]:
          - img "Luxury Suite" [ref=e81]
          - generic [ref=e84]:
            - generic [ref=e85]:
              - heading "Plan Your Arrival" [level=2] [ref=e86]
              - paragraph [ref=e87]: Select your preferred dates and guest count to view available luxury accommodations.
            - generic [ref=e88]:
              - generic [ref=e89]:
                - generic [ref=e90]:
                  - text: Check-in
                  - textbox [ref=e91]
                - generic [ref=e92]:
                  - text: Check-out
                  - textbox [ref=e93]
              - generic [ref=e94]:
                - text: Guests
                - combobox [ref=e95]:
                  - option "1 Guest"
                  - option "2 Guests" [selected]
                  - option "3 Guests"
                  - option "4 Guests"
                  - option "5 Guests"
                  - option "6 Guests"
            - button "Check Availability" [disabled]
    - contentinfo [ref=e96]:
      - img "Luxury Hotel Lobby" [ref=e98]
      - generic [ref=e100]:
        - generic [ref=e101]:
          - generic [ref=e102]:
            - generic [ref=e103]:
              - generic [ref=e104]:
                - generic [ref=e106]: GP
                - generic [ref=e107]: SMARTHOTEL
              - paragraph [ref=e108]: Luxury 5-Star Accommodation
            - paragraph [ref=e109]: Experience unparalleled luxury where timeless elegance meets modern hospitality.
          - generic [ref=e110]:
            - heading "Quick Links" [level=4] [ref=e111]
            - list [ref=e112]:
              - listitem [ref=e113]:
                - link "Rooms & Suites" [ref=e114] [cursor=pointer]:
                  - /url: /rooms
              - listitem [ref=e115]:
                - link "Facilities" [ref=e116] [cursor=pointer]:
                  - /url: /facilities
              - listitem [ref=e117]:
                - link "Gallery" [ref=e118] [cursor=pointer]:
                  - /url: /gallery
              - listitem [ref=e119]:
                - link "Contact" [ref=e120] [cursor=pointer]:
                  - /url: /contact
          - generic [ref=e121]:
            - heading "Services" [level=4] [ref=e122]
            - list [ref=e123]:
              - listitem [ref=e124]:
                - link "Concierge" [ref=e125] [cursor=pointer]:
                  - /url: /contact
              - listitem [ref=e126]:
                - link "Spa & Wellness" [ref=e127] [cursor=pointer]:
                  - /url: /facilities
              - listitem [ref=e128]:
                - link "Fitness Center" [ref=e129] [cursor=pointer]:
                  - /url: /facilities
              - listitem [ref=e130]:
                - link "Valet Parking" [ref=e131] [cursor=pointer]:
                  - /url: /facilities
          - generic [ref=e132]:
            - heading "Contact" [level=4] [ref=e133]
            - generic [ref=e134]:
              - generic [ref=e135]:
                - img [ref=e136]
                - paragraph [ref=e139]: 123 Grand Boulevard, City Center, Metropolitan Area, ST 10001
              - generic [ref=e140]:
                - img [ref=e141]
                - paragraph [ref=e143]: +1 (800) 555-HOTEL
              - generic [ref=e144]:
                - img [ref=e145]
                - paragraph [ref=e148]: info@smarthotel.com
        - generic [ref=e150]:
          - paragraph [ref=e151]: © 2026 SmartHotel Grand Palace. All rights reserved.
          - link "Contact Us" [ref=e153] [cursor=pointer]:
            - /url: /contact
  - button "Open chat concierge" [ref=e155] [cursor=pointer]:
    - img [ref=e157]
  - button "Open Next.js Dev Tools" [ref=e165] [cursor=pointer]:
    - img [ref=e166]
  - alert [ref=e169]
```

# Test source

```ts
  1  | import { test, expect } from './fixtures/test-data';
  2  | 
  3  | test.describe('Booking Flows', () => {
  4  |   test('Create a successful booking', async ({ page, generateDates }) => {
  5  |     await page.goto('/booking');
  6  |     
  7  |     // Select dates (7 days from now, for 3 nights)
  8  |     const { checkIn, checkOut } = generateDates(7, 3);
  9  |     
  10 |     // Assuming standard date inputs or calendar widget
  11 |     // Note: Selectors may need adjustment based on actual UI
> 12 |     await page.getByLabel(/check in/i).fill(checkIn.toISOString().split('T')[0]);
     |                                        ^ TimeoutError: locator.fill: Timeout 15000ms exceeded.
  13 |     await page.getByLabel(/check out/i).fill(checkOut.toISOString().split('T')[0]);
  14 |     await page.getByRole('button', { name: /search|check availability/i }).click();
  15 | 
  16 |     // Select first available room
  17 |     await page.getByRole('button', { name: /book|select/i }).first().click();
  18 | 
  19 |     // Fill guest details
  20 |     await page.getByLabel(/first name/i).fill('Test');
  21 |     await page.getByLabel(/last name/i).fill('Guest');
  22 |     await page.getByLabel(/email/i).fill(`test-${Date.now()}@example.com`);
  23 |     await page.getByLabel(/phone/i).fill('+1234567890');
  24 | 
  25 |     // Confirm booking
  26 |     await page.getByRole('button', { name: /confirm reservation/i }).click();
  27 | 
  28 |     // Verify confirmation page
  29 |     await expect(page.getByText(/booking confirmed|success/i)).toBeVisible({ timeout: 15000 });
  30 |   });
  31 | 
  32 |   test('Booking validation prevents empty fields', async ({ page }) => {
  33 |     await page.goto('/booking-flow'); // or whichever step is the direct form
  34 |     
  35 |     // Submit empty form
  36 |     await page.getByRole('button', { name: /confirm reservation/i }).click();
  37 | 
  38 |     // Verify validation errors
  39 |     await expect(page.getByText(/email is required/i)).toBeVisible();
  40 |     await expect(page.getByText(/name is required/i)).toBeVisible();
  41 |   });
  42 | });
  43 | 
```