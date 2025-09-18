import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

export interface QRPayload {
  roomNumber: string
  guestId: string
  bookingId?: string
  hotelId?: string
  expiresAt: number
}

export interface DecodedQR {
  roomNumber: string
  guestId: string
  bookingId?: string
  hotelId?: string
  expiresAt: number
  iat: number
}

/**
 * Generate a signed JWT token for QR code
 */
export async function generateQRToken(payload: Omit<QRPayload, 'expiresAt'>): Promise<string> {
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
  
  const token = await new SignJWT({
    ...payload,
    expiresAt
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
  
  return token
}

/**
 * Verify and decode QR token
 */
export async function verifyQRToken(token: string): Promise<DecodedQR | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    
    // Check if token has expired
    if (payload.expiresAt && typeof payload.expiresAt === 'number' && Date.now() > payload.expiresAt) {
      return null
    }
    
    return payload as unknown as DecodedQR
  } catch (error) {
    console.error('QR token verification failed:', error)
    return null
  }
}

/**
 * Generate QR code URL for room ordering
 */
export function generateOrderingURL(token: string, baseURL?: string): string {
  // Use static production URL for consistency
  const defaultURL = process.env.NODE_ENV === 'production' 
    ? 'https://smarthotel-demo.vercel.app'
    : process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  return `${baseURL || defaultURL}/order?token=${token}`
}

/**
 * Generate QR code data for printing
 */
export function generateQRData(roomNumber: string, guestId: string, bookingId?: string, hotelId?: string): string {
  const baseURL = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseURL}/order?room=${roomNumber}&guest=${guestId}${bookingId ? `&booking=${bookingId}` : ''}${hotelId ? `&hotel=${hotelId}` : ''}`
}
