import { NextResponse } from 'next/server';
import crypto from 'crypto';
import algosdk from 'algosdk';

const ORACLE_SECRET = process.env.ORACLE_SECRET || 'stealth_zk_kyc_secret_12345';
const ALGOD_SERVER = process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = process.env.NEXT_PUBLIC_ALGOD_PORT || '443';
const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN || '';
const CONSENT_APP_ID = parseInt(process.env.CONSENT_APP_ID || '0');

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

/**
 * POST /api/oracle/fetch
 *
 * Two modes:
 * 1. DigiLocker mode: pass { wallet, token } → Oracle fetches from /api/digilocker/fetch
 * 2. Manual mode: pass { wallet, userInputData } → Oracle uses provided data
 *
 * In both cases:
 *  - On-chain consent is checked (if CONSENT_APP_ID is set)
 *  - Data is hashed + HMAC-signed with ORACLE_SECRET
 *  - Raw _internalData is returned for ZK backend to consume
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, token, userInputData } = body;

    if (!wallet) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
    }

    // --- STEP 1: Verify On-Chain Consent ---
    if (CONSENT_APP_ID > 0) {
      try {
        const userAccount = algosdk.decodeAddress(wallet);
        const boxNamePrefix = Buffer.from('e');
        const boxName = Buffer.concat([boxNamePrefix, userAccount.publicKey]);
        const boxResponse = await algodClient.getApplicationBoxByName(CONSENT_APP_ID, boxName).do();
        const expiry = algosdk.decodeUint64(boxResponse.value, 'safe');
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (expiry < currentTimestamp) {
          return NextResponse.json({ error: "Consent expired on-chain" }, { status: 403 });
        }
        console.log(`[Oracle] On-chain consent valid for ${wallet}`);
      } catch (boxErr) {
        console.warn("[Oracle] Consent Box not found — continuing in demo mode");
        // Demo mode: skip strict consent for hackathon
      }
    }

    // --- STEP 2: Fetch Verified Identity Data ---
    let idData: any;

    if (token) {
      // DigiLocker Mode: fetch from our simulated DigiLocker service
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const dlRes = await fetch(`${baseUrl}/api/digilocker/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const dlData = await dlRes.json();

      if (!dlRes.ok || !dlData.verified) {
        return NextResponse.json(
          { error: dlData.error || "DigiLocker fetch failed or data unverified" },
          { status: 403 }
        );
      }

      idData = {
        dob: dlData.dob.toString(), // store as string for consistency in ZK backend
        aadhaar_last4: dlData.aadhaar_last4.toString(),
        pan: dlData.pan,
        issuer: dlData.issuer,
        source: "digilocker"
      };
      console.log("[Oracle] Data fetched from DigiLocker simulation ✓");

    } else if (userInputData) {
      // Manual Mode: user provided data directly
      idData = {
        dob: userInputData.dob || "2003-08-15",
        aadhaar_last4: userInputData.aadhaar_last4 || "1234",
        pan: userInputData.pan || "ABCDE1234F",
        issuer: "UIDAI",
        source: "manual"
      };
      console.log("[Oracle] Using manually provided data ✓");

    } else {
      return NextResponse.json({ error: "Provide either a DigiLocker token or userInputData" }, { status: 400 });
    }

    // --- STEP 3: Hash + Sign ---
    const dataToHash = JSON.stringify({
      dob: idData.dob,
      aadhaar_last4: idData.aadhaar_last4,
      pan: idData.pan,
      issuer: idData.issuer
    });

    const dataHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
    const signature = crypto
      .createHmac('sha256', ORACLE_SECRET)
      .update(dataHash)
      .digest('hex');

    // --- STEP 4: Return signed payload ---
    return NextResponse.json({
      dataHash,
      signature,
      issuer: idData.issuer,
      source: idData.source,
      // Internal data consumed only by ZK backend (same server context)
      _internalData: idData
    });

  } catch (error: any) {
    console.error("[Oracle] Error:", error);
    return NextResponse.json({ error: "Oracle internal error", details: error.message }, { status: 500 });
  }
}
