import { z } from 'zod';
import { NextResponse } from 'next/server';

export function handleZodError(error: z.ZodError) {
  return NextResponse.json(
    { 
      error: 'Validation error', 
      details: error.format() 
    }, 
    { status: 400 }
  );
}

export function toPublicRoomDTO(room: any) {
  if (!room) return room;
  const { 
    status, 
    lastStatusChangeAt, 
    lockId, 
    lockExpiresAt, 
    lastCleanedAt, 
    lastInspectedAt, 
    deletedAt, 
    version, 
    ownerId, 
    ...publicFields 
  } = room;
  return publicFields;
}
