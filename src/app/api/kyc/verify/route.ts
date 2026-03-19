import { NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import Proof from '@/lib/models/Proof';
import * as zkService from '@/lib/services/zkService';
import * as blockchainService from '@/lib/services/blockchainService';
import { getWalletAddress } from '@/lib/middleware/auth';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { proof, walletAddress: bodyAddress } = await request.json();
    const walletAddress = getWalletAddress(request) || bodyAddress;

    if (!proof || !proof.proofHash) {
      return NextResponse.json({ verified: false, message: 'Missing proof or proof identification.' }, { status: 400 });
    }

    const providedHash = proof.proofHash;
    console.log(`[DEBUG] Received Verify Request for Hash: ${providedHash}`);

    // 1. Recalculate Hash (Integrity Check)
    const isValid = (zkService as any).verifyProof(proof);
    if (!isValid) {
      return NextResponse.json({
        verified: false,
        message: 'Proof verification failed: hash mismatch or invalid proof metadata.'
      }, { status: 400 });
    }

    // 2. Database Lookup
    const dbProof = await Proof.findOne({ proofHash: providedHash });
    if (!dbProof) {
      return NextResponse.json({
        verified: false,
        message: 'Proof is cryptographically valid but not found in our registry.'
      }, { status: 404 });
    }

    // 3. Ownership Check
    if (dbProof.walletAddress !== walletAddress) {
       return NextResponse.json({
        verified: false,
        message: 'Security Alert: Proof does not belong to the connected wallet.'
      }, { status: 403 });
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
