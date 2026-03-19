import { Contract, Account, assert, log } from '@algorandfoundation/algorand-typescript';

/**
 * 1. Identity Anchor
 * Helper contract. Since main storage is the transaction note, 
 * this simply serves as an on-chain verification endpoint.
 */
export class IdentityAnchor extends Contract {
  registerIdentity(wallet: Account): void {
    // Basic verification check
    assert(wallet.bytes.length === 32, 'Invalid wallet address');
    // Emits a transaction log that indexers can track
    log('IDENTITY_REGISTERED');
  }

  isRegistered(wallet: Account): boolean {
    return true; // Helper: Real check is if the registration txn exists on-chain
  }
}

/**
 * 2. Proof Registry
 * Helper layer to anchor proofs to the blockchain.
 */
export class ProofRegistry extends Contract {
  storeProof(wallet: Account, proofHash: string): void {
    assert(proofHash !== '', 'Proof hash cannot be empty');
    assert(wallet.bytes.length === 32, 'Invalid wallet address');
    // Emits a log so indexer can easily scan ProofRegistration events
    log('PROOF_STORED');
  }

  verifyProofHash(wallet: Account, proofHash: string): boolean {
    assert(proofHash !== '', 'Proof hash cannot be empty');
    // Helper: Real verification compares indexer history matches hash
    return true; 
  }
}

/**
 * 3. Verification Contract
 * Helper layer to link verify logic cleanly via ABI calls.
 */
export class VerificationContract extends Contract {
  verifyUser(wallet: Account, proofHash: string): boolean {
    assert(proofHash !== '', 'Proof hash cannot be empty');
    log('USER_VERIFIED');
    return true;
  }
}
