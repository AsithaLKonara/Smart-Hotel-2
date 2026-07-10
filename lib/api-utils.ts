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
