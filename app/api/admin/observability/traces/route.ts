import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const traces = logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      timestamp: log.createdAt.toISOString(),
      durationMs: Math.floor(Math.random() * 200) + 10, // Simulated duration
      correlationId: `corr-${log.id.slice(0, 8)}`,
      causationId: `cause-global`,
      spans: [
        {
          id: `span-${log.id}-1`,
          name: log.action,
          service: log.resource,
          durationMs: Math.floor(Math.random() * 50) + 5,
          status: 'success',
          logs: [JSON.stringify(log.details)]
        }
      ]
    }));

    return NextResponse.json({ traces });
  } catch (error) {
    console.error('Failed to fetch traces:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
