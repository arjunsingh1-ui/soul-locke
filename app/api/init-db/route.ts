import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Database initialization is now handled client-side in memory
    // This endpoint is kept for compatibility and can be extended later for persistence
    return NextResponse.json({ success: true, message: 'Using in-memory storage' });
  } catch (error) {
    console.error('Initialization error:', error);
    return NextResponse.json({ success: true });
  }
}
