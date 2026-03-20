import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { checkProofOnChain } from '@/lib/algorand';

const snarkjs = require('snarkjs');

// In-memory revocation list (in production: store in DB or on-chain)
const revokedProofs = new Set<string>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proof, publicSignals, proofHash, wallet, expiry, action } = body;

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

    // 3. On-chain existence check (optional)
    if (wallet) {
      checks.onChain = await checkProofOnChain(wallet, proofHash || '');
    }

    // 4. Cryptographic ZK verification
    const zkPath = path.join(process.cwd(), 'public', 'zk');
    const vKeyPath = path.join(zkPath, 'verification_key.json');

    if (!fs.existsSync(vKeyPath)) {
      // No vKey available — semantic check only (demo mode)
      const isStructurallyValid =
        proof &&
        proof.pi_a?.length >= 2 &&
        proof.pi_b?.length >= 2 &&
        proof.pi_c?.length >= 2 &&
        publicSignals?.length > 0;

      checks.zkMath = 'simulated';
      return NextResponse.json({
        verified: isStructurallyValid,
        demo: true,
        message: isStructurallyValid
          ? 'Proof structurally valid (verification_key.json missing — simulated verification)'
          : 'Invalid proof structure',
        checks,
        timestamp: new Date().toISOString(),
      });
    }

    // Real Groth16 verification
    const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));
    const result = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    checks.zkMath = result;

    return NextResponse.json({
      verified: result,
      message: result
        ? 'Identity Proof Verified Successfully via Groth16'
        : 'ZK proof verification failed — proof is mathematically inconsistent',
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
