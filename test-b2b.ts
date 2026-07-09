import { prisma } from './lib/db';

async function main() {
  try {
    const res1 = await fetch('http://localhost:3000/api/admin/crm/corporate');
    console.log('Corporate:', await res1.json());
    
    const res2 = await fetch('http://localhost:3000/api/admin/crm/travel-agents');
    console.log('Travel Agents:', await res2.json());
  } catch (e) {
    console.error('Server offline');
  }
}
main();
