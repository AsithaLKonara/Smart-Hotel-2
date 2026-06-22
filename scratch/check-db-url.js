const { PrismaClient } = require('@prisma/client')

async function test() {
  const url = "postgresql://postgres:dvuNukMUyU$a484@db.deulklnbpohityejtbhz.supabase.co:5432/postgres";
  
  console.log('🔌 Connecting to Direct Postgres Database...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to Supabase Postgres!');
    
    console.log('\n📊 DATABASE DATA AVAILABILITY SUMMARY:');
    console.log('======================================');
    
    const tables = [
      'user', 'roomType', 'room', 'booking', 'event', 'bookingGuest', 'invoice', 
      'invoiceLineItem', 'payment', 'financialAdjustment', 'task', 'maintenanceRequest', 
      'foodOrder', 'orderItem', 'foodMenu', 'guestPreference', 'staff', 'roomReview', 
      'hotelReview', 'amenity', 'knowledge', 'embeddingCache', 'notification', 'outbox', 
      'syncLog', 'auditLog', 'channelConfig', 'roomMapping', 'gallery', 'heroSlide', 
      'inventory', 'loyaltyPoint', 'loyaltyTransaction', 'navigationLink', 'conversation', 
      'chatCustomer', 'setting', 'socialLink', 'tableBooking', 'complaint', 'testimonial'
    ];
    
    let totalTables = 0;
    let populatedTables = 0;
    
    for (const table of tables) {
      try {
        if (prisma[table]) {
          const count = await prisma[table].count();
          console.log(`- ${table}: ${count} records`);
          totalTables++;
          if (count > 0) {
            populatedTables++;
          }
        } else {
          console.log(`- ${table}: model not found in PrismaClient`);
        }
      } catch (err) {
        console.log(`- ${table}: ❌ Failed to count: ${err.message}`);
      }
    }
    
    console.log('\n📊 DATABASE INTEGRITY REPORT:');
    console.log('=============================');
    console.log(`- Total Schema Tables Verified: ${totalTables}`);
    console.log(`- Tables with Data: ${populatedTables}/${totalTables}`);
    
  } catch (error) {
    console.error('❌ Connection or query failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
