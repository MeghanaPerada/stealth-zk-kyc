import { Contract, Account, assert, log, BoxMap, Global, uint64, Txn } from '@algorandfoundation/algorand-typescript';

/**
 * KYC Anchor Smart Contract
 * Fully anchors the Stealth-ZK-KYC flow on the Algorand blockchain.
 * Uses Box storage to indefinitely and transparently map consent and ZK proof hashes 
 * to user wallet addresses while never storing raw PII on-chain.
 */
export class KycAnchor extends Contract {
  // Box storage per wallet address
  consentExpiry = BoxMap<Account, uint64>({ keyPrefix: 'expiry' });
  consentFields = BoxMap<Account, string>({ keyPrefix: 'fields' });
  proofHashBoxes = BoxMap<Account, string>({ keyPrefix: 'proof' });

  /**
   * 1. grantConsent
   * Wallet owners explicitly opt-in and define what data the oracle is allowed to fetch.
   */
  grantConsent(wallet: Account, allowed_fields: string, expiry: uint64): void {
    assert(Txn.sender === wallet, 'Only the wallet owner can grant consent');
    assert(expiry > Global.latestTimestamp, 'Expiry must be in the future');
    
    this.consentExpiry(wallet).value = expiry;
    this.consentFields(wallet).value = allowed_fields;
    
    log('CONSENT_GRANTED');
  }

  /**
   * 2. revokeConsent
   * Wallet owners can immediately revoke access.
   */
  revokeConsent(wallet: Account): void {
    assert(Txn.sender === wallet, 'Only the wallet owner can revoke consent');
    
    if (this.consentExpiry(wallet).exists) {
      this.consentExpiry(wallet).delete();
    }
    if (this.consentFields(wallet).exists) {
      this.consentFields(wallet).delete();
    }
    
    log('CONSENT_REVOKED');
  }

  /**
   * Helper to verify if consent is currently active.
   */
  hasValidConsent(wallet: Account): boolean {
    return this.consentExpiry(wallet).exists && Global.latestTimestamp < this.consentExpiry(wallet).value;
  }

  /**
   * 3. storeProof
   * Anchors the calculated ZK proof hash into the Box storage.
   * Can be executed by the authorized backend/oracle layer or the user.
   */
  storeProof(wallet: Account, proofHash: string): void {
    assert(this.hasValidConsent(wallet), 'Active consent is required to store proof');
    assert(proofHash !== '', 'Proof hash cannot be empty');
    
    this.proofHashBoxes(wallet).value = proofHash;
    
    log('PROOF_STORED');
  }

  /**
   * 4. verifyProof
   * Publicly callable verifying endpoint ensuring a proof matches the anchored hash.
   */
  verifyProof(wallet: Account, hashToVerify: string): boolean {
    assert(this.proofHashBoxes(wallet).exists, 'No proof exists for this wallet');
    return this.proofHashBoxes(wallet).value === hashToVerify;
  }
}
