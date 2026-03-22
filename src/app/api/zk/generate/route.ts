import { NextResponse } from 'next/server';
import crypto from 'crypto';
import algosdk from 'algosdk';

import { generateProofIdentifier } from '@/lib/helpers';
import { merkleService } from '@/lib/merkleService';

const { buildPoseidon } = require('circomlibjs');

// Note: No ORACLE_SECRET needed for HMAC. We use asymmetric Ed25519 signatures only.
const ORACLE_PUBKEY = process.env.NEXT_PUBLIC_ORACLE_PUBKEY || "";
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
 * 1. Initialize Poseidon and Merkle Root.
 * 2. Calculate Identity Hash.
 * 3. Verify Oracle Ed25519 Signature.
 * 4. Verify On-chain consent.
 * 5. Generate Groth16 Proof Inputs.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      wallet, 
      oracleResult, // { signature, issuer, _internalData }
      currentYear = 2026,
      proofSource = "unknown"
    } = body;

    if (!wallet || !oracleResult || !oracleResult.signature) {
      return NextResponse.json({ error: "Missing required ZK generation inputs (Oracle results missing)." }, { status: 400 });
    }

    // --- STEP 1: Initialization ---
    if (!(merkleService as any).root) {
      await merkleService.init();
    }
    const poseidon = await buildPoseidon();

    // --- STEP 2: Calculate Identity Hash (Poseidon) ---
    const pii = oracleResult._internalData || oracleResult; 
    const dobNum = parseInt(pii.dob.replace(/-/g, '')); // 2003-08-15 -> 20030815
    const aadhaarLast4 = parseInt(pii.aadhaar_last4);
    const pan_ascii = panToAscii(pii.pan);
    const issuerNum = pii.issuer === "UIDAI" || oracleResult.issuer === "UIDAI" ? 1 : 0;

    const poseidonInputs = [dobNum, aadhaarLast4, ...pan_ascii, issuerNum];
    const identityHash = poseidon.F.toObject(poseidon(poseidonInputs)).toString();

    // --- STEP 3: Verify Oracle Ed25519 Signature ---
    if (!ORACLE_PUBKEY) {
      return NextResponse.json({ error: "Server Configuration Error: Oracle Public Key is missing." }, { status: 500 });
    }

    const pubKeyBytes = Buffer.from(ORACLE_PUBKEY, "hex");
    const signatureBytes = Buffer.from(oracleResult.signature || "", "hex");
    const dataToVerify = Buffer.from(BigInt(identityHash).toString(16).padStart(64, "0"), "hex");

    // Convert public key to address for verifyBytes
    const oracleAddr = algosdk.encodeAddress(pubKeyBytes);
    const isSignatureValid = algosdk.verifyBytes(new Uint8Array(dataToVerify), new Uint8Array(signatureBytes), oracleAddr);

    if (!isSignatureValid) {
       return NextResponse.json({ error: "Oracle signature verification failed. Untrusted identity data." }, { status: 403 });
    }
    console.log("[ZK] Oracle Ed25519 Signature verified.");

    // --- STEP 4: On-Chain Consent Check ---
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

    // --- STEP 5: Dynamic Proof Identifier & Status ---
    const timestamp = Date.now();
    const status = Object.values(pii).every(v => v) ? "approved" : "rejected";
    
    const proofIdentifier = await generateProofIdentifier(
      wallet, 
      proofSource === "digilocker" ? "digilocker" : "manual",
      status,
      timestamp
    );

    // --- STEP 6: Nullifier Generation (Poseidon(UserSecret, IdentityAnchor)) ---
    const userSecret = crypto.createHash('sha256')
      .update(identityHash + ORACLE_PUBKEY)
      .digest('hex')
      .slice(0, 32); 
    const userSecretNum = BigInt('0x' + userSecret).toString();

    const nullifier = poseidon.F.toObject(poseidon([userSecretNum, identityHash])).toString();

    // --- STEP 7: Merkle Tree Inclusion Proof ---
    merkleService.addLeaf(identityHash);
    const merkleData = merkleService.getProof(identityHash);

    // --- STEP 8: Prepare Circuit Input ---
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

    return NextResponse.json({
      circuitInput,
      zkIdentity: identityHash,
      nullifier,
      merkleRoot: merkleData.root,
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
