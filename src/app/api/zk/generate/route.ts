import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
const snarkjs = require('snarkjs');

// Helper: PAN to ASCII
const panToAscii = (pan: string) => {
  const ascii = new Array(10).fill(0);
  for (let i = 0; i < Math.min(pan.length, 10); i++) {
    ascii[i] = pan.charCodeAt(i);
  }
  return ascii;
};

// HELPER: Poseidon Hash Simulation (must match Circom)
// In a real prod environment, we'd use the circomlibjs poseidon
const calculateIdentityHash = (inputs: any) => {
  // Logic should align with circuits/identityHash.circom
  // For the demo, we use a consistent deterministic hash
  const crypto = require('crypto');
  return "0x" + crypto.createHash('sha256')
    .update(JSON.stringify(inputs))
    .digest('hex');
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dob, birthYear, aadhaar_last4, pan, issuer, currentYear = 2026 } = body;

    // 1. Validation
    if (!dob || !birthYear || !aadhaar_last4 || !pan || !issuer) {
      return NextResponse.json({ error: "Missing required identity parameters for ZK generation." }, { status: 400 });
    }

    // 2. Prepare Inputs
    const pan_ascii = panToAscii(pan);
    
    // We strictly DO NOT STORE these values. They stay in this function's memory only.
    const circuitInput = {
      dob: parseInt(dob.replace(/-/g, '')), // "2003-08-15" -> 20030815
      birthYear: parseInt(birthYear),
      currentYear: currentYear,
      minAge: 18,
      aadhaar_last4: parseInt(aadhaar_last4),
      pan: pan_ascii,
      issuer: issuer === "UIDAI" ? 1 : 0,
      public_identity_hash: calculateIdentityHash({ dob, aadhaar_last4, pan, issuer })
    };

    // 3. Paths for ZK artifacts (Standardized in /zk)
    const zkPath = path.join(process.cwd(), 'public', 'zk');
    const wasmPath = path.join(zkPath, 'kycMain.wasm');
    const zkeyPath = path.join(zkPath, 'kyc.zkey');

    // 4. Check for binary existence
    if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
      console.error("ZK Artifacts missing at:", { wasmPath, zkeyPath });
      
      // Fallback/Mock for demo if user hasn't uploaded binaries yet
      // This allows the UI to stay functional while showing the real code structure
      return NextResponse.json({ 
        error: "ZK Artifacts (WASM/ZKEY) not found in /zk folder. Please ensure the circuits are compiled.",
        requirement: "Place kycMain.wasm and kyc.zkey in the /zk root directory."
      }, { status: 500 });
    }

    // 5. Generate Proof (Groth16 as requested)
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      wasmPath,
      zkeyPath
    );

    // 6. Return Proof artifacts
    return NextResponse.json({
      proof,
      publicSignals,
      metadata: {
        protocol: "groth16",
        curve: "bn128",
        timestamp: new Date().toISOString()
      }
    });

  } catch (err: any) {
    console.error("ZK Proof Generation Error:", err);
    return NextResponse.json({ 
      error: "Failed to generate ZK proof.",
      details: err.message
    }, { status: 500 });
  }
}
