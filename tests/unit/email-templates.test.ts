import { 
  getBookingConfirmationEmail,
  getWelcomeEmail,
  getCheckInReminderEmail,
  getCheckOutReminderEmail,
  getNewsletterEmail
} from '@/lib/email-templates'

describe('Email Templates', () => {
  const mockBookingData = {
    bookingId: 'booking-123',
    confirmationCode: 'GP2024001',
    guestName: 'John Doe',
    guestEmail: 'john.doe@example.com',
    checkIn: '2024-01-15',
    checkOut: '2024-01-18',
    roomType: 'Deluxe King',
    guests: 2,
    totalAmount: 897,
    paymentStatus: 'confirmed',
    roomNumber: '205',
    specialRequests: 'Late checkout requested'
  }

  const mockWelcomeData = {
    guestName: 'Jane Smith',
    checkIn: '2024-01-15'
  }

  const mockNewsletterData = {
    guestName: 'Jane Smith',
    offers: ['Free breakfast', 'Spa discount', 'Room upgrade']
  }

  describe('Booking Confirmation Email', () => {
    test('should generate valid HTML email', () => {
      const email = getBookingConfirmationEmail(mockBookingData)
      
      expect(email).toBeDefined()
      expect(email.subject).toContain('Booking Confirmation')
      expect(email.html).toContain('Grand Palace Hotel')
      expect(email.html).toContain(mockBookingData.confirmationCode)
      expect(email.html).toContain(mockBookingData.guestName)
      expect(email.html).toContain(mockBookingData.roomType)
    })

    test('should include all booking details', () => {
      const email = getBookingConfirmationEmail(mockBookingData)
      
      expect(email.html).toContain('Monday, January 15, 2024')
      expect(email.html).toContain('Thursday, January 18, 2024')
      expect(email.html).toContain(mockBookingData.totalAmount.toString())
      expect(email.html).toContain(mockBookingData.roomNumber)
    })

    test('should include special requests if provided', () => {
      const email = getBookingConfirmationEmail(mockBookingData)
      
      expect(email.html).toContain('Late checkout requested')
    })

    test('should handle missing special requests', () => {
      const bookingDataWithoutRequests = { ...mockBookingData, specialRequests: undefined }
      
      const email = getBookingConfirmationEmail(bookingDataWithoutRequests)
      
      expect(email.html).toBeDefined()
      expect(email.html).not.toContain('undefined')
    })
  })

  describe('Welcome Email', () => {
    test('should generate valid welcome email', () => {
      const email = getWelcomeEmail(mockWelcomeData)
      
      expect(email).toBeDefined()
      expect(email.subject).toContain('Welcome')
      expect(email.html).toContain('Grand Palace Hotel')
      expect(email.html).toContain(mockWelcomeData.guestName)
    })

    test('should include loyalty information', () => {
      const email = getWelcomeEmail(mockWelcomeData)
      
      expect(email.html).toContain('1250')
      expect(email.html).toContain('Gold')
    })
  })

  describe('Check-in Reminder Email', () => {
    test('should generate valid check-in reminder', () => {
      const email = getCheckInReminderEmail(mockBookingData)
      
      expect(email).toBeDefined()
      expect(email.subject).toContain('Reminder: Check-in Tomorrow')
      expect(email.html).toContain(mockBookingData.guestName)
      expect(email.html).toContain(mockBookingData.checkIn)
    })

    test('should include arrival instructions', () => {
      const email = getCheckInReminderEmail(mockBookingData)
      
      expect(email.html).toContain('3:00 PM')
      expect(email.html).toContain('Valid government-issued photo ID')
    })
  })

  describe('Check-out Reminder Email', () => {
    test('should generate valid check-out reminder', () => {
      const email = getCheckOutReminderEmail(mockBookingData)
      
      expect(email).toBeDefined()
      expect(email.subject).toContain('Check-out Reminder')
      expect(email.html).toContain(mockBookingData.guestName)
      expect(email.html).toContain('Thursday, January 18, 2024')
    })

    test('should include departure instructions', () => {
      const email = getCheckOutReminderEmail(mockBookingData)
      
      expect(email.html).toContain('11:00 AM')
      expect(email.html).toContain('front desk')
    })
  })

  describe('Newsletter Email', () => {
    test('should generate valid newsletter', () => {
      const email = getNewsletterEmail(mockNewsletterData)
      
      expect(email).toBeDefined()
      expect(email.subject).toContain('Exclusive Offers')
      expect(email.html).toContain('Grand Palace Hotel')
      expect(email.html).toContain(mockWelcomeData.guestName)
    })

    test('should include current year', () => {
      const email = getNewsletterEmail(mockNewsletterData)
      const currentYear = new Date().getFullYear()
      
      expect(email.html).toContain(currentYear.toString())
    })
  })

  describe('Email Template Validation', () => {
    test('all templates should have valid HTML structure', () => {
      const templates = [
        getBookingConfirmationEmail(mockBookingData),
        getWelcomeEmail(mockWelcomeData),
        getCheckInReminderEmail(mockBookingData),
        getCheckOutReminderEmail(mockBookingData),
        getNewsletterEmail(mockNewsletterData)
      ]

      templates.forEach(template => {
        expect(template.html).toContain('<!DOCTYPE html>')
        expect(template.html).toContain('<html>')
        expect(template.html).toContain('<head>')
        expect(template.html).toContain('<body style=')
        expect(template.html).toContain('</html>')
      })
    })

    test('all templates should include hotel branding', () => {
      const templates = [
        getBookingConfirmationEmail(mockBookingData),
        getWelcomeEmail(mockWelcomeData),
        getCheckInReminderEmail(mockBookingData),
        getCheckOutReminderEmail(mockBookingData),
        getNewsletterEmail(mockNewsletterData)
      ]

      templates.forEach(template => {
        expect(template.html).toContain('Grand Palace Hotel')
        expect(template.html).toContain('+1 (212) 555-0123')
      })
    })

    test('all templates should have valid subjects', () => {
      const templates = [
        getBookingConfirmationEmail(mockBookingData),
        getWelcomeEmail(mockWelcomeData),
        getCheckInReminderEmail(mockBookingData),
        getCheckOutReminderEmail(mockBookingData),
        getNewsletterEmail(mockNewsletterData)
      ]

      templates.forEach(template => {
        expect(template.subject).toBeDefined()
        expect(template.subject.length).toBeGreaterThan(0)
      })
    })
  })
})
