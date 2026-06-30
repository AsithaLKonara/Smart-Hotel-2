import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    const vipEmail = 'johndoe.vip@smarthotel.com'
    let user = await prisma.user.findUnique({ where: { email: vipEmail } })

    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10)
      
      // Get or create guest role
      let role = await prisma.role.findFirst({ where: { name: 'GUEST' } })
      if (!role) {
        role = await prisma.role.create({
          data: { name: 'GUEST', description: 'Hotel Guest', permissions: [] }
        })
      }

      user = await prisma.user.create({
        data: {
          email: vipEmail,
          name: 'John Doe (VIP)',
          password: hashedPassword,
          phone: '+1 555-0199',
          roleId: role.id,
          vipStatus: 'VIP',
          
          guestHistory: {
            create: {
              totalStays: 15,
              totalNights: 42,
              totalSpend: 12500.50,
              lastStayDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            }
          },
          
          loyalty: {
            create: {
              points: 25000,
              totalEarned: 45000,
              totalSpent: 20000,
              tier: 'PLATINUM',
              transactions: {
                create: [
                  { type: 'earned', points: 1500, description: 'Stay - Spring Break' },
                  { type: 'earned', points: 300, description: 'F&B Spend' },
                  { type: 'spent', points: 5000, description: 'Free Night Redemption' }
                ]
              }
            }
          },
          
          guestPreferences: {
            create: {
              dietaryRestrictions: ['Gluten-Free', 'Dairy-Free'],
              allergies: ['Peanuts'],
              roomPreferences: ['High Floor', 'Extra Pillows', 'Away from elevator']
            }
          },

          guestProfile: {
            create: {
              preferences: {
                favoriteDrink: 'Dry Martini',
                transportation: 'Airport Transfer needed'
              }
            }
          }
        }
      })
    }

    return NextResponse.json({ success: true, message: 'VIP Guest CRM Seeded', userId: user.id })
  } catch (error: any) {
    console.error('CRM Seed Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to seed CRM data' }, { status: 500 })
  }
}
