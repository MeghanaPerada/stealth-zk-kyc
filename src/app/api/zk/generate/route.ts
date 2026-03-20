import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import algosdk from 'algosdk';

import { generateProofIdentifier, hashData } from '@/lib/helpers';
const snarkjs = require('snarkjs');
const { buildPoseidon } = require('circomlibjs');

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

    // --- STEP 5: Prepare Circuit Input ---
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
      timestamp: timestamp
    };

    // --- STEP 6: Generate Proof ---
    const zkPath = path.join(process.cwd(), 'public', 'zk');
    const wasmPath = path.join(zkPath, 'kycMain.wasm');
    const zkeyPath = path.join(zkPath, 'kyc.zkey');

    if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
      // Demo Mock fallback if binaries don't exist
      return NextResponse.json({
        mock: true,
        message: "ZK Artifacts (WASM/ZKEY) missing. Displaying simulated proof for demo.",
        zkIdentity: identityHash,
        proofSource,
        proofIdentifier,
        status,
        timestamp,
        proof: { pi_a: ["0", "0", "0"], pi_b: [["0", "0"], ["0", "0"]], pi_c: ["0", "0", "0"] },
        publicSignals: [identityHash, "1", proofIdentifier, timestamp.toString()],
        txId: "MOCK_TX_" + Math.random().toString(36).substring(7).toUpperCase()
      });
    }

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      wasmPath,
      zkeyPath
    );

    // --- STEP 6: Anchor Proof on Algorand (Transaction Note) ---
    let txId = "local_only";
    const ALGORAND_MNEMONIC = process.env.ALGORAND_MNEMONIC;
    
    if (ALGORAND_MNEMONIC && ALGORAND_MNEMONIC !== "YOUR_TESTNET_MNEMONIC_HERE") {
      try {
        const backendAccount = algosdk.mnemonicToSecretKey(ALGORAND_MNEMONIC);
        const params = await algodClient.getTransactionParams().do();
        
        // We anchor the proof by sending a 0-ALGO txn to the user with the proof hash in the note
        const proofHash = crypto.createHash('sha256').update(JSON.stringify(proof)).digest('hex');
        const note = new TextEncoder().encode(`stealth_zk_proof:${proofHash}`);
        
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender: backendAccount.addr,
          receiver: wallet, // Bind to user wallet
          amount: 0,
          note: note,
          suggestedParams: params
        });

        const signedTxn = txn.signTxn(backendAccount.sk);
        const response = await algodClient.sendRawTransaction(signedTxn).do();
        txId = response.txid || "submitted";
        console.log("[ZK] Proof anchored on Algorand. TxID:", txId);
      } catch (anchorErr) {
        console.error("[ZK] Anchoring failed (continuing without anchor):", anchorErr);
      }
    }

    return NextResponse.json({
      proof,
      publicSignals,
      zkIdentity: identityHash,
      proofSource,
      proofIdentifier,
      status,
      timestamp,
      txId: txId,
      metadata: {
        timestamp: new Date().toISOString(),
        anchored: txId !== "local_only"
      }
    });

  } catch (err: any) {
    console.error("[ZK] Generation Error:", err);
    return NextResponse.json({ error: "Failed to generate ZK proof.", details: err.message }, { status: 500 });
  }
}
