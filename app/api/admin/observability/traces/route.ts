import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'ENDPOINT_DEPRECATED',
      message: 'Simulated OpenTelemetry traces have been permanently deprecated. Please use Sentry APM for production telemetry.',
    },
    { status: 410 }
  );
}
