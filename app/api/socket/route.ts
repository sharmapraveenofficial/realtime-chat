import { NextResponse } from 'next/server';

// Return a 200 response to confirm the Socket.io server is running
export function GET() {
  return NextResponse.json({ ok: true });
} 