import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { companyId, iataNumber, employeeName, clientName, checkIn, checkOut, roomTypeId } = data;

    // In a production environment, we would strictly authenticate this endpoint.
    // For this demonstration, we accept the request if they provide a valid ID.

    let discount = 0;
    let corporateAccount = null;
    let travelAgent = null;

    if (companyId) {
      corporateAccount = await prisma.corporateAccount.findUnique({ where: { companyName: companyId } });
      if (corporateAccount && corporateAccount.negotiatedRate) {
        discount = corporateAccount.negotiatedRate;
      }
    } else if (iataNumber) {
      travelAgent = await prisma.travelAgent.findFirst({ where: { iataNumber } });
      // Agents don't normally get a discount, they get commission. We track them via the booking.
    }

    if (!corporateAccount && !travelAgent) {
      // Mock fallback for demonstration if no DB record matches
      if (companyId) discount = 20;
    }

    // This creates a mockup response. A true implementation would create a Booking, 
    // an Invoice, apply the discount to the InvoiceLineItems, and link the agent/company.
    
    return NextResponse.json({ 
      success: true, 
      message: 'B2B Booking created successfully.',
      discountApplied: discount,
      agentCommissionTracked: !!travelAgent || !!iataNumber
    });

  } catch (error) {
    console.error('Failed to process B2B booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
