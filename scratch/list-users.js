const { PrismaClient } = require('@prisma/client')

async function listUsers() {
  const url = "mongodb+srv://asithalkonara_db_user:SmartHotel%402@smarthotel2.uffrecn.mongodb.net/smarthotel?retryWrites=true&w=majority&appName=SmartHotel2"
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  })
  
  try {
    console.log('Fetching users...')
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        name: true
      }
    })
    console.log('Users in database:')
    console.table(users)
  } catch (err) {
    console.error('❌ Failed:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()
