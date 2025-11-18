import { jest } from '@jest/globals'

const projectRoot = process.cwd()
const dbModulePath = require.resolve(`${projectRoot}/lib/db.ts`)
const nodemailerModulePath = require.resolve('nodemailer')

const emailLogCreateMock = jest.fn()

describe('lib/email', () => {
  const sendMailMock = jest.fn()
  const verifyMock = jest.fn()
  const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock, verify: verifyMock }))
  const createMockEvent = (overrides: Partial<any> = {}) => ({
    guestName: 'Jamie Guest',
    guestEmail: 'jamie@example.com',
    roomNumber: '301',
    roomType: 'Deluxe Suite',
    checkIn: new Date('2025-05-10T15:00:00.000Z'),
    checkOut: new Date('2025-05-15T11:00:00.000Z'),
    guests: 2,
    totalAmount: 1299,
    bookingId: 'booking-123',
    confirmationCode: 'CONF-123',
    specialRequests: 'Late checkout',
    ...overrides,
  })

  beforeEach(() => {
    jest.resetModules()
    sendMailMock.mockReset()
    verifyMock.mockReset()
    verifyMock.mockResolvedValue(true)
    createTransportMock.mockReset()
    createTransportMock.mockReturnValue({ sendMail: sendMailMock, verify: verifyMock })
    emailLogCreateMock.mockReset()

    process.env = {
      ...process.env,
      SMTP_HOST: 'smtp.test',
      SMTP_PORT: '2525',
      SMTP_USER: 'mailer@test',
      SMTP_PASS: 'secret',
      SMTP_FROM_EMAIL: 'noreply@test',
      SMTP_FROM_NAME: 'SmartHotel QA',
      ADMIN_EMAIL: 'admin@test',
      NEXT_PUBLIC_APP_URL: 'https://app.test',
    }

    jest.doMock(nodemailerModulePath, () => ({
      __esModule: true,
      default: { createTransport: createTransportMock },
      createTransport: createTransportMock,
    }))

    jest.doMock(dbModulePath, () => ({
      __esModule: true,
      prisma: {
        emailLog: {
          create: emailLogCreateMock,
        },
      },
      default: {
        emailLog: {
          create: emailLogCreateMock,
        },
      },
    }))

    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('resolves nodemailer module variants gracefully', async () => {
    const { emailTemplates } = await import('@/lib/email')
    expect(emailTemplates).toHaveProperty('bookingConfirmation')
    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'smtp.test',
      port: 2525,
      secure: false,
      auth: { user: 'mailer@test', pass: 'secret' },
    })
  })

  it('sends booking confirmation email and logs to console', async () => {
    const { sendBookingConfirmation } = await import('@/lib/email')
    const payload = createMockEvent()

    await sendBookingConfirmation(payload)

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jamie@example.com',
        subject: expect.stringContaining('Booking Confirmation'),
        html: expect.stringContaining(payload.confirmationCode),
      }),
    )
    expect(console.log).toHaveBeenCalledWith(
      'Booking confirmation email sent to jamie@example.com',
    )
  })

  it('logs error but does not throw when booking confirmation email fails', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('smtp error'))
    const { sendBookingConfirmation } = await import('@/lib/email')

    await expect(sendBookingConfirmation(createMockEvent())).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalledWith(
      'Failed to send booking confirmation email:',
      expect.any(Error),
    )
  })

  it('sends admin booking alert using admin email', async () => {
    const { sendAdminBookingAlert } = await import('@/lib/email')

    await sendAdminBookingAlert({
      bookingId: 'booking-42',
      guestName: 'Alex',
      guestEmail: 'alex@test',
      roomNumber: '401',
      checkIn: new Date('2025-05-01'),
      checkOut: new Date('2025-05-03'),
      totalAmount: 499,
    })

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@test',
        subject: expect.stringContaining('New Booking Alert'),
      }),
    )
  })

  it('sends booking reminder with html content', async () => {
    const { sendBookingReminder } = await import('@/lib/email')

    await sendBookingReminder({
      guestName: 'Jamie Guest',
      guestEmail: 'jamie@example.com',
      roomNumber: '301',
      checkIn: new Date('2025-05-10'),
      confirmationCode: 'CONF-XYZ',
    })

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jamie@example.com',
        subject: expect.stringContaining('Check-in Reminder'),
      }),
    )
  })

  it('sends password reset email with reset link', async () => {
    const { sendPasswordResetEmail } = await import('@/lib/email')
    await sendPasswordResetEmail({ name: 'Taylor', email: 'taylor@test', resetUrl: 'https://app.test/reset/token-123' })

    expect(sendMailMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: 'taylor@test',
        subject: 'Reset Your Password - SmartHotel',
        html: expect.stringContaining('https://app.test/reset/token-123'),
      }),
    )
  })

  it('sends password reset confirmation email', async () => {
    const { sendPasswordResetConfirmation } = await import('@/lib/email')
    await sendPasswordResetConfirmation({ name: 'Taylor', email: 'taylor@test' })

    expect(sendMailMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: 'taylor@test',
        subject: 'Password Changed Successfully - SmartHotel',
      }),
    )
  })

  it('logs error but does not throw when password reset confirmation fails', async () => {
    const { sendPasswordResetConfirmation } = await import('@/lib/email')
    sendMailMock.mockRejectedValueOnce(new Error('smtp down'))

    await expect(sendPasswordResetConfirmation({ name: 'Taylor', email: 'taylor@test' })).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalledWith(
      'Failed to send password reset confirmation:',
      expect.any(Error),
    )
  })

  it('sends contact email successfully', async () => {
    const { sendContactEmail } = await import('@/lib/email')

    await sendContactEmail({
      name: 'Jamie Guest',
      email: 'jamie@example.com',
      subject: 'Question about booking',
      message: 'Hello team!',
    })

    expect(sendMailMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: 'admin@test',
        subject: expect.stringContaining('[Contact]'),
      }),
    )
    expect(console.log).toHaveBeenCalledWith(
      'Contact email sent:',
      expect.objectContaining({
        to: 'admin@test',
        subject: expect.stringContaining('[Contact]'),
      }),
    )
  })

  it('verifies email configuration successfully', async () => {
    const { testEmailConfiguration } = await import('@/lib/email')
    const result = await testEmailConfiguration()

    expect(result).toBe(true)
    expect(verifyMock).toHaveBeenCalled()
  })

  it('returns false when email configuration verification fails', async () => {
    const { testEmailConfiguration } = await import('@/lib/email')
    verifyMock.mockRejectedValueOnce(new Error('verify failed'))

    const result = await testEmailConfiguration()
    expect(result).toBe(false)
    expect(console.error).toHaveBeenCalledWith('Email configuration is invalid:', expect.any(Error))
  })

  it('sends booking status update email and logs outcome', async () => {
    const { sendBookingStatusUpdate } = await import('@/lib/email')

    await sendBookingStatusUpdate({
      guestName: 'Jordan',
      guestEmail: 'jordan@test',
      bookingId: 'booking-555',
      status: 'CONFIRMED',
      roomNumber: '808',
      checkIn: new Date('2025-06-01'),
      checkOut: new Date('2025-06-05'),
    })

    expect(sendMailMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: 'jordan@test',
        subject: 'Booking Update - CONFIRMED',
      }),
    )
    expect(console.log).toHaveBeenCalledWith('Booking status update sent to jordan@test')
  })

  it('logs error but does not throw when booking status update fails', async () => {
    const { sendBookingStatusUpdate } = await import('@/lib/email')
    sendMailMock.mockRejectedValueOnce(new Error('status-fail'))

    await expect(
      sendBookingStatusUpdate({
        guestName: 'Jordan',
        guestEmail: 'jordan@test',
        bookingId: 'booking-555',
        status: 'CANCELLED',
        roomNumber: '808',
        checkIn: new Date('2025-06-01'),
        checkOut: new Date('2025-06-05'),
      }),
    ).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalledWith(
      'Failed to send booking status update:',
      expect.any(Error),
    )
  })

  it('logs error but does not throw when admin booking alert fails', async () => {
    const { sendAdminBookingAlert } = await import('@/lib/email')
    sendMailMock.mockRejectedValueOnce(new Error('admin-error'))

    await expect(
      sendAdminBookingAlert({
        bookingId: 'booking-42',
        guestName: 'Alex',
        guestEmail: 'alex@test',
        roomNumber: '401',
        checkIn: new Date('2025-05-01'),
        checkOut: new Date('2025-05-03'),
        totalAmount: 499,
      }),
    ).resolves.toBeUndefined()

    expect(console.error).toHaveBeenCalledWith(
      'Failed to send admin booking alert:',
      expect.any(Error),
    )
  })

  it('logs error but does not throw when booking reminder fails', async () => {
    const { sendBookingReminder } = await import('@/lib/email')
    sendMailMock.mockRejectedValueOnce(new Error('reminder-error'))

    await expect(
      sendBookingReminder({
        guestName: 'Jamie Guest',
        guestEmail: 'jamie@example.com',
        roomNumber: '301',
        checkIn: new Date('2025-05-10'),
        confirmationCode: 'CONF-XYZ',
      }),
    ).resolves.toBeUndefined()

    expect(console.error).toHaveBeenCalledWith(
      'Failed to send booking reminder:',
      expect.any(Error),
    )
  })

  it('prefers CONTACT_EMAIL when sending contact messages', async () => {
    process.env.CONTACT_EMAIL = 'support@test'
    const { sendContactEmail } = await import('@/lib/email')

    await sendContactEmail({
      name: 'Jamie Guest',
      email: 'jamie@example.com',
      subject: 'Partnership',
      message: 'Let us collaborate!',
    })

    expect(sendMailMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ to: 'support@test' }),
    )
    delete process.env.CONTACT_EMAIL
  })

  it('falls back to default contact email when none configured', async () => {
    const originalContact = process.env.CONTACT_EMAIL
    const originalAdmin = process.env.ADMIN_EMAIL
    const originalFromEmail = process.env.SMTP_FROM_EMAIL
    const originalSmtpUser = process.env.SMTP_USER

    delete process.env.CONTACT_EMAIL
    delete process.env.ADMIN_EMAIL
    delete process.env.SMTP_FROM_EMAIL
    delete process.env.SMTP_USER

    // Keep SMTP configured so email sending still works
    process.env.SMTP_HOST = 'smtp.test'
    process.env.SMTP_USER = 'mailer@test'
    process.env.SMTP_PASS = 'secret'
    // Don't set ADMIN_EMAIL or CONTACT_EMAIL to test fallback

    jest.resetModules()
    const { sendContactEmail } = await import('@/lib/email')

    await sendContactEmail({
      name: 'Jamie Guest',
      email: 'jamie@example.com',
      subject: 'Question',
      message: 'Need help',
    })

    // Fallback should use SMTP_USER (mailer@test) or default to info@smarthotel.com
    expect(sendMailMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ 
        to: expect.stringMatching(/^(mailer@test|info@smarthotel\.com)$/)
      }),
    )

    process.env.CONTACT_EMAIL = originalContact
    process.env.ADMIN_EMAIL = originalAdmin
    process.env.SMTP_FROM_EMAIL = originalFromEmail
    process.env.SMTP_USER = originalSmtpUser
  })

  it('booking confirmation template omits special requests when not provided', async () => {
    const { emailTemplates } = await import('@/lib/email')
    const template = emailTemplates.bookingConfirmation({
      guestName: 'Sam',
      guestEmail: 'sam@test',
      roomNumber: '101',
      roomType: 'Standard',
      checkIn: new Date('2025-01-01'),
      checkOut: new Date('2025-01-03'),
      guests: 2,
      totalAmount: 300,
      bookingId: 'booking-1',
      confirmationCode: 'CONF-1',
    })

    expect(template.html).not.toContain('Special Requests:')
  })
})
