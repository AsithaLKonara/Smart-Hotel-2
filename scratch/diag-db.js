const { PrismaClient } = require('@prisma/client')

async function test() {
  const url = "mongodb+srv://asithalkonara_db_user:SmartHotel%402@smarthotel2.uffrecn.mongodb.net/smarthotel?retryWrites=true&w=majority&appName=SmartHotel2"
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  })
  
  try {
    console.log('Connecting to:', url.replace(/:[^@]+@/, ':****@'))
    await prisma.$connect()
    console.log('✅ Success!')
    const count = await prisma.user.count()
    console.log('User count:', count)
  } catch (err) {
    console.error('❌ Failed:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()
