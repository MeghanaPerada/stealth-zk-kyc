import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
const snarkjs = require('snarkjs');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proof, publicSignals } = body;

    // 1. Validation
    if (!proof || !publicSignals) {
      return NextResponse.json({ verified: false, error: "Missing proof artifacts for verification." }, { status: 400 });
    }

    // 2. Paths for Verification Key
    const zkPath = path.join(process.cwd(), 'public', 'zk');
    const vKeyPath = path.join(zkPath, 'verification_key.json');

    // 3. Check for vKey existence
    if (!fs.existsSync(vKeyPath)) {
      console.error("ZK Verification Key missing at:", vKeyPath);
      
      // Fallback/Mock for demo if user hasn't uploaded vKey yet
      return NextResponse.json({ 
        verified: false,
        error: "Verification Key (verification_key.json) not found in /zk folder.",
        requirement: "Place verification_key.json in the /zk root directory."
      }, { status: 500 });
    }

    // 4. Load Verification Key
    const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));

    // 5. Verify Proof (Groth16 as requested)
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    // 6. Return Result
    if (res === true) {
      return NextResponse.json({
        verified: true,
        message: "Identity Proof Verified Successfully via Groth16!",
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        verified: false,
        message: "ZK-Groth16 Verification Failed: Proof is mathematically inconsistent with public signals."
      });
    }

  } catch (err: any) {
    console.error("ZK Verification Error:", err);
    return NextResponse.json({ 
      verified: false,
      error: "Internal verification error.",
      details: err.message
    }, { status: 500 });
  }
}
