import React from 'react';
import { prisma } from '@/lib/db';
import ClientChannelManager from './ClientChannelManager';

export default async function ChannelManagerPage() {
  const providers = await prisma.channelProvider.findMany({
    include: {
      connections: {
        include: {
          property: true,
          syncEvents: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      }
    }
  });

  const properties = await prisma.property.findMany({
    select: { id: true, name: true, code: true }
  });

  return (
    <ClientChannelManager initialProviders={providers} properties={properties} />
  );
}
