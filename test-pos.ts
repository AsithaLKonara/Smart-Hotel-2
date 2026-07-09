import { prisma } from './lib/db';

async function main() {
  try {
    const products = await prisma.pOSProduct.findMany({ take: 1 });
    if (!products.length) return console.log('No products');
    
    const res = await fetch('http://localhost:3000/api/pos/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: null,
        cart: [{ ...products[0], quantity: 1 }],
        totalAmount: products[0].price,
        paymentType: 'CARD'
      })
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Result:', data);
    
    if (data.orderId) {
       const order = await prisma.internalOrder.findUnique({ where: { id: data.orderId }, include: { payments: true } });
       console.log('Created Order:', order);
    }
  } catch (e) {
    console.error(e);
  }
}

main();
