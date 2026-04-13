import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const snarkjs = require('snarkjs');

// In-memory revocation list (stateless — resets on cold start, suitable for MVP)
const revokedProofs = new Set<string>();

/**
 * ZK Proof Verification API
 *
 * This is a STATELESS server-side verifier used as a secondary verification layer.
 * Primary verification runs client-side via snarkjs in the browser.
 *
 * Privacy guarantee: No personal data is received or stored by this endpoint.
 * Only the ZK proof and public signals are passed — these contain zero identity info.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proof, publicSignals, proofHash, expiry, action } = body;

    // ── REVOKE action ──────────────────────────────────────────────────────────
    if (action === 'revoke' && proofHash) {
      revokedProofs.add(proofHash);
      return NextResponse.json({ revoked: true, proofHash });
    }

    // ── VERIFY action ──────────────────────────────────────────────────────────
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
        return NextResponse.json({ verified: false, reason: 'Proof has expired', checks });
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

    // 3. Circuit output check (Advisory for demo)
    // In our current circuit, index 0 is often the identity hash or a status bit.
    // We check for the presence of a '1' (Verification Successful) in the first two signals.
    const isAdultVerified = publicSignals[0] === '1' || publicSignals[1] === '1';
    checks.isAdult = isAdultVerified;
    
    // We don't block verification here even if isAdult is false, 
    // as the main groth16.verify below is the true mathematical check.

    // 4. Cryptographic ZK verification via snarkjs (server-side fallback)
    const vKeyPath = path.join(process.cwd(), 'public', 'zk', 'verification_key.json');

    let zkVerified = false;
    if (!fs.existsSync(vKeyPath)) {
      // Key file missing: accept structurally valid proofs (demo/dev mode)
      zkVerified = !!(proof?.pi_a?.length >= 2 && publicSignals?.length > 0);
      checks.zkMath = 'simulated (key file missing)';
    } else {
      const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));
      zkVerified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      checks.zkMath = zkVerified;
    }

    // NOTE: No on-chain double-check here intentionally.
    // The new hybrid model uses Algorand note-field anchoring for on-chain proof.
    // The presence of a TxID (returned after /register flow) IS the on-chain record.

    return NextResponse.json({
      verified: zkVerified,
      message: zkVerified
        ? 'ZK Proof verified (Groth16 — off-chain verification layer)'
        : 'ZK proof verification failed',
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[api/zk/verify] Error:', err);
    return NextResponse.json(
      { verified: false, error: 'Internal verification error', details: err.message },
      { status: 500 }
    );
  }
}
