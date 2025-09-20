import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Hello from SmartHotel API!',
    timestamp: new Date().toISOString(),
    status: 'working'
  })
}
