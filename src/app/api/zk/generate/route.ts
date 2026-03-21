import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import algosdk from 'algosdk';

import { generateProofIdentifier, hashData } from '@/lib/helpers';
import { merkleService } from '@/lib/merkleService';

const { buildPoseidon } = require('circomlibjs');

// Initialize the Merkle Service if not already initialized
let merkleInitialized = false;

const ORACLE_SECRET = process.env.ORACLE_SECRET || 'stealth_zk_kyc_secret_12345';
const ALGOD_SERVER = process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = process.env.NEXT_PUBLIC_ALGOD_PORT || '443';
const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN || '';
const CONSENT_APP_ID = parseInt(process.env.CONSENT_APP_ID || '0');

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Helper: PAN to ASCII array
const panToAscii = (pan: string) => {
  const ascii = new Array(10).fill(0);
  for (let i = 0; i < Math.min(pan.length, 10); i++) {
    ascii[i] = pan.charCodeAt(i);
  }
  return ascii;
};

/**
 * POST /api/zk/generate
 * 
 * Flow:
 * 1. Verify Oracle HMAC signature.
 * 2. Verify On-chain consent.
 * 3. Calculate Poseidon Identity Hash (Public Input).
 * 4. Generate Groth16 Proof.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      wallet, 
      oracleResult, // { dataHash, signature, issuer, _internalData }
      currentYear = 2026,
      proofSource = "unknown"
    } = body;

    if (!wallet || !oracleResult || !oracleResult.signature) {
      return NextResponse.json({ error: "Missing required ZK generation inputs (Oracle results missing)." }, { status: 400 });
    }

    // --- STEP 1: Verify Oracle HMAC ---
    const expectedSignature = crypto.createHmac('sha256', ORACLE_SECRET)
      .update(oracleResult.dataHash)
      .digest('hex');

    if (expectedSignature !== oracleResult.signature) {
      return NextResponse.json({ error: "Oracle signature verification failed. Untrusted identity data." }, { status: 403 });
    }
    console.log("[ZK] Oracle HMAC verified.");

    if (!merkleInitialized) {
      await merkleService.init();
      merkleInitialized = true;
    }

    // --- STEP 2: Verify On-Chain Consent ---
    if (CONSENT_APP_ID > 0) {
      try {
        const userAccount = algosdk.decodeAddress(wallet);
        const boxNamePrefix = Buffer.from('e');
        const boxName = Buffer.concat([boxNamePrefix, userAccount.publicKey]);
        const boxResponse = await algodClient.getApplicationBoxByName(CONSENT_APP_ID, boxName).do();
        const expiry = algosdk.decodeUint64(boxResponse.value, 'safe');
        if (expiry < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({ error: "Consent expired on-chain." }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ error: "On-chain consent verification failed." }, { status: 403 });
      }
    }

    // --- STEP 3: Calculate Poseidon Hash (to match kycMain.circom / identityHash.circom) ---
    const pii = oracleResult._internalData || oracleResult; // Support both old and new internal format
    const dobNum = parseInt(pii.dob.replace(/-/g, '')); // 2003-08-15 -> 20030815
    const aadhaarLast4 = parseInt(pii.aadhaar_last4);
    const pan_ascii = panToAscii(pii.pan);
    const issuerNum = pii.issuer === "UIDAI" || oracleResult.issuer === "UIDAI" ? 1 : 0;

    const poseidon = await buildPoseidon();
    // Inputs order: dob, aadhaar_last4, pan[10], issuer (Total 13 inputs)
    const poseidonInputs = [dobNum, aadhaarLast4, ...pan_ascii, issuerNum];
    const identityHash = poseidon.F.toObject(poseidon(poseidonInputs)).toString();

    console.log("[ZK] Computed Poseidon Identity Hash:", identityHash);

    // --- STEP 4: Dynamic Proof Identifier & Status ---
    const timestamp = Date.now();
    // Dynamic status logic: all fields non-empty = approved
    const status = Object.values(pii).every(v => v) ? "approved" : "rejected";
    
    const proofIdentifier = await generateProofIdentifier(
      wallet, 
      proofSource === "digilocker" ? "digilocker" : "manual",
      status,
      timestamp
    );

    // --- STEP 5: Nullifier Generation (Poseidon(UserSecret, IdentityAnchor)) ---
    // Deterministic secret for the user (can be random, but deterministic per identity is better for consistency)
    const userSecret = crypto.createHmac('sha256', ORACLE_SECRET)
      .update(identityHash)
      .digest('hex')
      .slice(0, 32); // Use first 32 hex chars as a pseudo-random seed
    const userSecretNum = BigInt('0x' + userSecret).toString();

    const nullifier = poseidon.F.toObject(poseidon([userSecretNum, identityHash])).toString();
    console.log("[ZK] Generated Nullifier:", nullifier);

    // --- STEP 6: Merkle Tree Inclusion Proof ---
    // Add the user to our off-chain Merkle Tree
    merkleService.addLeaf(identityHash);
    const merkleData = merkleService.getProof(identityHash);
    console.log("[ZK] Merkle Root:", merkleData.root);

    // --- STEP 7: Prepare Circuit Input ---
    const birthYear = parseInt(pii.dob.split('-')[0]);
    const circuitInput = {
      dob: dobNum,
      birthYear: birthYear,
      currentYear: currentYear,
      minAge: 18,
      aadhaar_last4: aadhaarLast4,
      pan: pan_ascii,
      issuer: issuerNum,
      public_identity_hash: identityHash,
      proofIdentifier: proofIdentifier,
      timestamp: timestamp,
      userSecret: userSecretNum,
      merkle_path_elements: merkleData.pathElements,
      merkle_path_indices: merkleData.pathIndices
    };
    // --- STEP 6: Generate Proof ---
    // In Client-Side Proving mode, the backend PREPARES the inputs but the BROWSER generates the proof.
    console.log("[ZK] Sending Circuit Inputs to Browser for Client-Side Proving.");

    return NextResponse.json({
      circuitInput,           // The inputs for the WASM
      zkIdentity: identityHash, // The public anchor
      nullifier,              // The public nullifier
      merkleRoot: merkleData.root, // The public merkle root
      proofSource,
      proofIdentifier,
      status,
      timestamp,
      metadata: {
        timestamp: new Date().toISOString(),
        clientSideProvingReady: true
      }
    });

  } catch (err: any) {
    console.error("[ZK] Input Generation Error:", err);
    return NextResponse.json({ error: "Failed to generate ZK circuit inputs.", details: err.message }, { status: 500 });
  }
}

