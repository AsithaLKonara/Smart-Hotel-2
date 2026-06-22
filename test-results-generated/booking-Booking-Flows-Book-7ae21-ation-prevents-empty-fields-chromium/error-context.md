# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Booking Flows >> Booking validation prevents empty fields
- Location: tests/e2e-generated/booking.spec.ts:32:7

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /confirm reservation/i })

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
      - generic [ref=e41]:
        - generic [ref=e44]:
          - generic [ref=e46] [cursor=pointer]:
            - generic [ref=e48]: 🔍
            - generic [ref=e49]:
              - generic [ref=e50]: Search
              - generic [ref=e51]: Find your perfect room
          - generic [ref=e54]:
            - generic [ref=e56]: 🏨
            - generic [ref=e57]:
              - generic [ref=e58]: Select
              - generic [ref=e59]: Choose your room
          - generic [ref=e62]:
            - generic [ref=e64]: 💳
            - generic [ref=e65]:
              - generic [ref=e66]: Pay
              - generic [ref=e67]: Complete your booking
        - generic [ref=e68]:
          - generic [ref=e69]:
            - heading "Find Your Perfect Getaway" [level=1] [ref=e70]
            - paragraph [ref=e71]: Discover luxury accommodations tailored to your preferences. Start your journey with our smart search.
          - generic [ref=e74]:
            - generic [ref=e75]:
              - generic [ref=e76]:
                - generic [ref=e77]: Location
                - generic [ref=e78]:
                  - img [ref=e79]
                  - textbox "Where are you going?" [ref=e82]
              - generic [ref=e83]:
                - generic [ref=e84]: Check-in
                - generic [ref=e85]:
                  - img [ref=e86]
                  - textbox [ref=e88]
              - generic [ref=e89]:
                - generic [ref=e90]: Check-out
                - generic [ref=e91]:
                  - img [ref=e92]
                  - textbox [ref=e94]
              - generic [ref=e95]:
                - generic [ref=e96]: Guests
                - generic [ref=e97]:
                  - img [ref=e98]
                  - combobox [ref=e103]:
                    - option "1 Guest"
                    - option "2 Guests" [selected]
                    - option "3 Guests"
                    - option "4 Guests"
                    - option "5 Guests"
                    - option "6 Guests"
            - generic [ref=e104]:
              - button "Filters" [ref=e106] [cursor=pointer]:
                - img [ref=e107]
                - text: Filters
              - button "Search Hotels" [disabled]:
                - generic:
                  - generic:
                    - img
                  - generic: Search Hotels
          - generic [ref=e109]:
            - heading "Popular Destinations" [level=3] [ref=e110]
            - generic [ref=e111]:
              - button "🏖️ Beach Resorts Miami Beach" [ref=e112] [cursor=pointer]:
                - generic [ref=e113]: 🏖️
                - generic [ref=e114]: Beach Resorts
                - generic [ref=e115]: Miami Beach
              - button "🏙️ City Hotels Downtown District" [ref=e116] [cursor=pointer]:
                - generic [ref=e117]: 🏙️
                - generic [ref=e118]: City Hotels
                - generic [ref=e119]: Downtown District
              - button "🏔️ Mountain Lodges Aspen, CO" [ref=e120] [cursor=pointer]:
                - generic [ref=e121]: 🏔️
                - generic [ref=e122]: Mountain Lodges
                - generic [ref=e123]: Aspen, CO
              - button "🧘 Spa Retreats Sedona, AZ" [ref=e124] [cursor=pointer]:
                - generic [ref=e125]: 🧘
                - generic [ref=e126]: Spa Retreats
                - generic [ref=e127]: Sedona, AZ
    - contentinfo [ref=e128]:
      - img "Luxury Hotel Lobby" [ref=e130]
      - generic [ref=e132]:
        - generic [ref=e133]:
          - generic [ref=e134]:
            - generic [ref=e135]:
              - generic [ref=e136]:
                - generic [ref=e138]: GP
                - generic [ref=e139]: SMARTHOTEL
              - paragraph [ref=e140]: Luxury 5-Star Accommodation
            - paragraph [ref=e141]: Experience unparalleled luxury where timeless elegance meets modern hospitality.
          - generic [ref=e142]:
            - heading "Quick Links" [level=4] [ref=e143]
            - list [ref=e144]:
              - listitem [ref=e145]:
                - link "Rooms & Suites" [ref=e146] [cursor=pointer]:
                  - /url: /rooms
              - listitem [ref=e147]:
                - link "Facilities" [ref=e148] [cursor=pointer]:
                  - /url: /facilities
              - listitem [ref=e149]:
                - link "Gallery" [ref=e150] [cursor=pointer]:
                  - /url: /gallery
              - listitem [ref=e151]:
                - link "Contact" [ref=e152] [cursor=pointer]:
                  - /url: /contact
          - generic [ref=e153]:
            - heading "Services" [level=4] [ref=e154]
            - list [ref=e155]:
              - listitem [ref=e156]:
                - link "Concierge" [ref=e157] [cursor=pointer]:
                  - /url: /contact
              - listitem [ref=e158]:
                - link "Spa & Wellness" [ref=e159] [cursor=pointer]:
                  - /url: /facilities
              - listitem [ref=e160]:
                - link "Fitness Center" [ref=e161] [cursor=pointer]:
                  - /url: /facilities
              - listitem [ref=e162]:
                - link "Valet Parking" [ref=e163] [cursor=pointer]:
                  - /url: /facilities
          - generic [ref=e164]:
            - heading "Contact" [level=4] [ref=e165]
            - generic [ref=e166]:
              - generic [ref=e167]:
                - img [ref=e168]
                - paragraph [ref=e171]: 123 Grand Boulevard, City Center, Metropolitan Area, ST 10001
              - generic [ref=e172]:
                - img [ref=e173]
                - paragraph [ref=e175]: +1 (800) 555-HOTEL
              - generic [ref=e176]:
                - img [ref=e177]
                - paragraph [ref=e180]: info@smarthotel.com
        - generic [ref=e182]:
          - paragraph [ref=e183]: © 2026 SmartHotel Grand Palace. All rights reserved.
          - link "Contact Us" [ref=e185] [cursor=pointer]:
            - /url: /contact
  - button "Open chat concierge" [ref=e187] [cursor=pointer]:
    - img [ref=e189]
  - button "Open Next.js Dev Tools" [ref=e197] [cursor=pointer]:
    - img [ref=e198]
  - alert [ref=e201]
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
  12 |     await page.getByLabel(/check in/i).fill(checkIn.toISOString().split('T')[0]);
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
> 36 |     await page.getByRole('button', { name: /confirm reservation/i }).click();
     |                                                                      ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  37 | 
  38 |     // Verify validation errors
  39 |     await expect(page.getByText(/email is required/i)).toBeVisible();
  40 |     await expect(page.getByText(/name is required/i)).toBeVisible();
  41 |   });
  42 | });
  43 | 
```