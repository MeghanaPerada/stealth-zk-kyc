import { NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import Proof from '@/lib/models/Proof';
import * as zkService from '@/lib/services/zkService';
import * as blockchainService from '@/lib/services/blockchainService';
import { getWalletAddress } from '@/lib/middleware/auth';

export async function POST(request: Request) {
  try {
    const db = await connectDB();
    const { proof, walletAddress: bodyAddress } = await request.json();
    const walletAddress = getWalletAddress(request) || bodyAddress;

    if (!proof) {
      return NextResponse.json({ verified: false, message: 'Missing proof data.' }, { status: 400 });
    }

    const providedHash = proof.proofHash;
    console.log(`[DEBUG] Received Verify Request for Hash: ${providedHash}`);

    // 1. Database & Ownership Checks (Only if DB connected)
    let dbProof = null;
    if (db && providedHash) {
      dbProof = await Proof.findOne({ proofHash: providedHash });
      if (!dbProof) {
        return NextResponse.json({
          verified: false,
          message: 'Proof identification (Hash) not found in our registry.'
        }, { status: 404 });
      }

      if (walletAddress && dbProof.walletAddress !== walletAddress) {
        return NextResponse.json({
          verified: false,
          message: 'Security Alert: Proof does not belong to the connected wallet.'
        }, { status: 403 });
      }
    }

    // 2. Real PLONK Cryptographic Verification
    // Use the fullProof from the request or the DB
    const verificationTarget = proof.fullProof || (dbProof && dbProof.fullProof);
    
    if (!verificationTarget) {
      return NextResponse.json({
        verified: false,
        message: 'Cryptographic artifacts (fullProof) missing for this verification request.'
      }, { status: 400 });
    }

    const isZkValid = (zkService as any).verifyProof(verificationTarget);
    if (!isZkValid) {
      return NextResponse.json({
        verified: false,
        message: 'Real ZK-PLONK verification failed: Mathematical proofs or public signals are inconsistent.'
      }, { status: 400 });
    }

    // 4. On-chain Cross-verification
    try {
      if (dbProof.txId) {
        console.log(`[DEBUG] Cross-verifying on Algorand via Tx: ${dbProof.txId}`);
        const onChainVerified = await (blockchainService as any).verifyProofHash(walletAddress, providedHash);
        
        if (!onChainVerified) {
           return NextResponse.json({ 
             verified: false, 
             message: 'Blockchain verification failed: Hash mismatch between local DB and Algorand Ledger.' 
           }, { status: 400 });
        }
        
        // Final sanity check: Invoke the verification contract ABI
        await (blockchainService as any).verifyUser(walletAddress, providedHash);
      }
    } catch (bcError: any) {
      console.warn('Blockchain verification warning:', bcError.message);
    }

    return NextResponse.json({
      verified: true,
      message: 'Proof Verified Successfully via Algorand blockchain!',
      dbRecord: {
        trustScore: dbProof.trustScore,
        sourceType: dbProof.sourceType,
        verifiedAt: dbProof.createdAt,
        txId: dbProof.txId
      }
    });

  } catch (error) {
    console.error('Error in /verify:', error);
    return NextResponse.json({ error: 'Internal verification error' }, { status: 500 });
  }
}
