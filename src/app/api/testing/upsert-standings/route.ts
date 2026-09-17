import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'This testing endpoint has been disabled. Use repo tests instead.' }, { status: 403 });
}
