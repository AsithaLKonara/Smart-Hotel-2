import { prisma } from './lib/db';

async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/crm/guests?search=');
    const data = await res.json();
    console.log(`Found ${data.guests?.length} guests`);
    if (data.guests && data.guests.length > 0) {
      console.log('Sample Guest History:', data.guests[0].guestHistory);
    }
  } catch (e) {
    console.error(e);
  }
}

main();
