import { faker } from '@faker-js/faker'

export const generateGuestData = () => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  specialRequests: faker.lorem.sentence(),
})

export const getFutureDates = (daysFromNow: number = 7, duration: number = 2) => {
  const checkIn = new Date()
  checkIn.setDate(checkIn.getDate() + daysFromNow)
  
  const checkOut = new Date(checkIn)
  checkOut.setDate(checkOut.getDate() + duration)
  
  return {
    checkIn: checkIn.toISOString().split('T')[0],
    checkOut: checkOut.toISOString().split('T')[0],
  }
}

export const generateTaskData = () => ({
  title: `Task: ${faker.commerce.productName()}`,
  description: faker.lorem.paragraph(),
  priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
})
