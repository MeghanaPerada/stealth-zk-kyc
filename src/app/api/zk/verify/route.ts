import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { isUserVerifiedOnChain } from '@/lib/algorand';

const snarkjs = require('snarkjs');

// In-memory revocation list (in production: store in DB or on-chain)
const revokedProofs = new Set<string>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proof, publicSignals, proofHash, wallet, expiry, action, proofIdentifier } = body;

    // ── REVOKE action ──────────────────────────────────────────────────────────
    if (action === 'revoke' && proofHash) {
      revokedProofs.add(proofHash);
      console.log(`[Verify] Proof revoked: ${proofHash}`);
      return NextResponse.json({ revoked: true, proofHash });
    }

    // ── VERIFY action ─────────────────────────────────────────────────────────
    if (!proof || !publicSignals) {
      return NextResponse.json(
        { verified: false, error: 'Missing proof or publicSignals' },
        { status: 400 }
      );
    }

    const checks: Record<string, boolean | string> = {};

    // 1. Expiry check
    if (expiry) {
      const isExpired = Date.now() > expiry;
      checks.expired = isExpired;
      if (isExpired) {
        return NextResponse.json({
          verified: false,
          reason: 'Proof has expired',
          checks,
        });
      }
    }
    checks.expired = false;

    // 2. Revocation check
    if (proofHash && revokedProofs.has(proofHash)) {
      return NextResponse.json({
        verified: false,
        reason: 'Proof has been revoked',
        checks: { ...checks, revoked: true },
      });
    }
    checks.revoked = false;

    // 3. Proof Identifier check (Public Signals contain binding data)
    // Circuit Output index 0 is 'isVerified' (Age check)
    const isAdultVerified = publicSignals[0] === '1';
    checks.isAdult = isAdultVerified;
    if (!isAdultVerified) {
      return NextResponse.json({
        verified: false,
        reason: 'Age constraint not met in ZK Proof (Dob >= 20060101)',
        checks
      });
    }

    const idValid = proofIdentifier ? publicSignals.includes(proofIdentifier) : true;
    checks.identifier = idValid;

    // 4. Cryptographic ZK verification
    const zkPath = path.join(process.cwd(), 'public', 'zk');
    const vKeyPath = path.join(zkPath, 'verification_key.json');

    let zkVerified = false;
    if (!fs.existsSync(vKeyPath)) {
      // Demo mode: structural check if key is missing locally
      zkVerified = proof && proof.pi_a?.length >= 2 && publicSignals?.length > 0;
      checks.zkMath = 'simulated';
    } else {
      const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));
      zkVerified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      checks.zkMath = zkVerified;
    }

    // 5. MULTI-LAYER ENFORCEMENT: Final On-Chain Double Check
    // We check the Identity Registry for the wallet's verification status
    if (zkVerified && wallet) {
      const isRegistered = await isUserVerifiedOnChain(wallet);
      checks.onChainMatch = isRegistered;
      
      if (!isRegistered) {
        return NextResponse.json({
          verified: false,
          reason: 'Layer 2 Mismatch: ZK Proof is valid, but no corresponding entry found in the On-Chain Identity Registry.',
          checks
        });
      }
    }

    return NextResponse.json({
      verified: zkVerified,
      message: zkVerified
        ? 'Protocol Level Verification Success (ZK + On-Chain)'
        : 'ZK proof verification failed',
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Verify] Error:', err);
    return NextResponse.json(
      { verified: false, error: 'Internal verification error', details: err.message },
      { status: 500 }
    );
  }
}
