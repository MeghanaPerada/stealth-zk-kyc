import { NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import Proof from '@/lib/models/Proof';

export async function GET() {
  try {
    const db = await connectDB();
    if (!db) {
      // Return professional mock data for demo mode
      return NextResponse.json([
        {
          walletAddress: "V4K5M4P9X7H2L1B0N8J5V4K5M4P9X7H2L1B0N8J5",
          proofHash: "0x89A2E1C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0",
          txId: "TX_7D9F2E4A8B1C6D5E0F9G8H7I6J5K4L3M2N1O0P9Q",
          trustScore: 98,
          sourceType: "DIGILOCKER",
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          walletAddress: "AB3D5G7H9J2L4M6N8P0Q1R2S3T4U5V6W7X8Y9Z0",
          proofHash: "0x3F2B6C8D9E0A1B2C3D4E5F6G7H8I9J0K1L2M3N4",
          txId: "TX_1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T",
          trustScore: 85,
          sourceType: "ORACLE",
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ]);
    }
    const proofs = await Proof.find().sort({ createdAt: -1 }).limit(50);
    return NextResponse.json(proofs);
  } catch (error) {
    console.error('Error fetching proofs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
