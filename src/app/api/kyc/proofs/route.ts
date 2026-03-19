import { NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import Proof from '@/lib/models/Proof';

export async function GET() {
  try {
    await connectDB();
    const proofs = await Proof.find().sort({ createdAt: -1 }).limit(50);
    return NextResponse.json(proofs);
  } catch (error) {
    console.error('Error fetching proofs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
