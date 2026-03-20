import { NextResponse } from 'next/server';
import crypto from 'crypto';
import algosdk from 'algosdk';

/**
 * MOCK ORACLE SECRET (In production, this would be in .env.local)
 */
const ORACLE_SECRET = process.env.ORACLE_SECRET || 'stealth_zk_kyc_secret_12345';

/**
 * Algorand Config
 */
const ALGOD_SERVER = process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = process.env.NEXT_PUBLIC_ALGOD_PORT || '443';
const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN || '';
const CONSENT_APP_ID = parseInt(process.env.CONSENT_APP_ID || '0');

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

/**
 * POST /api/oracle/fetch
 * 
 * Logic:
 * 1. Receive wallet address and requested permissions.
 * 2. Verify on-chain consent exists and is valid (via Boxes).
 * 3. Fetch (simulated) user data from DigiLocker.
 * 4. Hash the PII.
 * 5. Sign the hash using HMAC with ORACLE_SECRET.
 * 6. Return data hash + signature.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, permissions, userInputData } = body;

    if (!wallet || !permissions) {
      return NextResponse.json({ error: "Missing wallet or permissions" }, { status: 400 });
    }

    // --- STEP 1: Verify On-Chain Consent (Optional but recommended for strict flow) ---
    // If CONSENT_APP_ID is 0, we skip this (for initial setup/demo flexibility)
    if (CONSENT_APP_ID > 0) {
      try {
        const userAccount = algosdk.decodeAddress(wallet);
        // Box names in PuyaTS: keyPrefix + keyBytes
        // For ConsentManager: permissions = BoxMap('p'), expiries = BoxMap('e')
        const boxNamePrefix = Buffer.from('e');
        const boxName = Buffer.concat([boxNamePrefix, userAccount.publicKey]);
        
        const boxResponse = await algodClient.getApplicationBoxByName(CONSENT_APP_ID, boxName).do();
        const boxValue = boxResponse.value;
        
        // Value is uint64 (8 bytes)
        const expiry = algosdk.decodeUint64(boxValue, 'safe');
        const currentTimestamp = Math.floor(Date.now() / 1000);
        
        if (expiry < currentTimestamp) {
          return NextResponse.json({ error: "Consent expired on-chain" }, { status: 403 });
        }
        console.log(`[Oracle] On-chain consent verified for ${wallet}. Expiry: ${expiry}`);
      } catch (boxErr) {
        console.error("[Oracle] Consent verification failed (Box not found or error):", boxErr);
        return NextResponse.json({ error: "No valid consent found on-chain. Please Approve Consent first." }, { status: 403 });
      }
    } else {
      console.warn("[Oracle] CONSENT_APP_ID not set. Skipping on-chain verification for demo.");
    }

    // --- STEP 2: Fetch Simulated Data (DigiLocker) ---
    // In a real app, this would perform OAuth/Fetch from actual DigiLocker APIs
    // Using userInputData to simulate a specific record lookup
    const idData = {
      dob: userInputData?.dob || "2003-08-15",
      aadhaar_last4: userInputData?.aadhaar_last4 || "1234",
      pan: userInputData?.pan || "ABCDE1234F",
      issuer: "UIDAI"
    };

    // --- STEP 3: Cryptographic Signing (HMAC) ---
    // We hash the identifying fields in a deterministic way
    const dataToHash = JSON.stringify({
      dob: idData.dob,
      aadhaar_last4: idData.aadhaar_last4,
      pan: idData.pan,
      issuer: idData.issuer
    });

    const dataHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
    const signature = crypto.createHmac('sha256', ORACLE_SECRET)
      .update(dataHash)
      .digest('hex');

    // --- STEP 4: Return result ---
    // IMPORTANT: In prod, we only return the hash + signature + issuer
    // The raw PII is ONLY used by the ZK backend (same machine/trusted environment)
    return NextResponse.json({
      dataHash,
      signature,
      issuer: idData.issuer,
      // We pass the raw data in the response ONLY for the hackathon backend to consume
      // In a strict prod, this API would be internal-only
      _internalData: idData 
    });

  } catch (error: any) {
    console.error("[Oracle] Error:", error);
    return NextResponse.json({ error: "Internal Oracle error", details: error.message }, { status: 500 });
  }
}
