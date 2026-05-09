const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
const { PrismaClient } = require('@prisma/client')

async function listUsers() {
  const prisma = new PrismaClient()
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    console.log(JSON.stringify(users, null, 2))
  } catch (error) {
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()
