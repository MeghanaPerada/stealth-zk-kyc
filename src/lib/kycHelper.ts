import { NextResponse } from 'next/server';
import connectDB from './config/db';
import User from './models/User';
import Proof from './models/Proof';
import * as validationService from './services/validationService';
import * as zkService from './services/zkService';
import * as documentService from './services/documentService';
import * as blockchainService from './services/blockchainService';

export const issueZkProof = async (walletAddress: string, pan: string, dob: string, sourceType: string) => {
  await connectDB();

  const isPanValid = validationService.validatePAN(pan);
  let age;
  try {
    age = validationService.calculateAge(dob);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const isAdult = age >= 18;

  if (!isPanValid || !isAdult) {
    return NextResponse.json({
      error: 'KYC Failed',
      reasons: { panValid: isPanValid, adult: isAdult }
    }, { status: 400 });
  }

  const trustScore = (documentService as any).getTrustScore(sourceType);

  // Generate proof
  const proof = (zkService as any).generateProof({
    walletAddress,
    age,
    isPanValid,
    trustScore,
    sourceType
  });

  const proofHash = proof.proofHash;

  try {
    // 1. Ensure user exists in the DB
    await User.findOneAndUpdate(
      { walletAddress },
      { walletAddress },
      { upsert: true, new: true }
    );

    // 2. Identify Registration check
    const registered = await (blockchainService as any).isRegistered(walletAddress);
    if (!registered) {
      console.log(`User ${walletAddress} not registered on-chain. Registering now...`);
      await (blockchainService as any).registerIdentity(walletAddress);
    }

    // 3. Store proof hash on Algorand Testnet
    console.log(`[DEBUG] Storing Proof Hash on Chain: ${proofHash}`);
    const txId = await (blockchainService as any).storeProof(proofHash, walletAddress);

    // 4. Save to MongoDB
    const newProof = new Proof({
      walletAddress,
      proofHash,
      txId,
      trustScore,
      sourceType
    });
    
    await newProof.save();
    console.log(`[SECURE] Proof ${proofHash} stored in DB and on-chain (Tx: ${txId})`);

    return NextResponse.json({
      success: true,
      message: `KYC Processed via ${sourceType}. Proof verified and anchored on-chain.`,
      proof,
      proofHash,
      txId,
      trustScore,
      walletAddress
    });

  } catch (fatalErr: any) {
    console.error('Fatal error securely storing proof:', fatalErr);
    return NextResponse.json({ error: 'Failed to record proof to registry/blockchain' }, { status: 500 });
  }
};
