import { Contract, Account, assert, log, BoxMap, Global, uint64, Txn, op, Bytes, bytes } from '@algorandfoundation/algorand-typescript';

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
  proofHashBoxes = BoxMap<Account, bytes>({ keyPrefix: 'proof' });

  // Oracle public key for signature verification
  // Stored as bytes for direct use in ed25519verify
  oraclePubKeyRecord = BoxMap<string, bytes>({ keyPrefix: 'config' });

  /**
   * 1. setupOracle
   * Sets the authorized Oracle public key.
   * @param pubKey The 32-byte public key of the Oracle
   */
  setupOracle(pubKey: bytes): void {
    // In a production app, add creator-only check
    this.oraclePubKeyRecord('opk').value = pubKey;
    log('ORACLE_SETUP');
  }

  /**
   * 2. grantConsent
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
   * 3. revokeConsent
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
   * 4. storeProof
   * Anchors the calculated ZK proof hash into the Box storage.
   * Requires a valid Oracle Signature (Layer 2 Enforcement).
   */
  storeProof(wallet: Account, proofHash: bytes, oracleSignature: bytes): void {
    assert(this.hasValidConsent(wallet), 'Active consent is required to store proof');
    assert(proofHash.length > 0, 'Proof hash cannot be empty');
    
    // 🔥 Protocol Level Enforcement: Verify Oracle Signature
    const opk = this.oraclePubKeyRecord('opk').value;
    assert(opk.length > 0, 'Oracle public key not configured');

    const isSignatureValid = op.ed25519verifyBare(
      proofHash, 
      oracleSignature, 
      opk
    );
    assert(isSignatureValid, 'Invalid Oracle signature: Proof tampering detected');

    // Store the verified proof hash in the Box
    this.proofHashBoxes(wallet).value = proofHash;
    log('PROOF_STORED_ON_CHAIN');
  }

  /**
   * 5. verifyOnChain
   * Publicly callable verifying endpoint ensuring a proof matches the anchored hash.
   */
  verifyOnChain(wallet: Account, hashToVerify: bytes): boolean {
    assert(this.proofHashBoxes(wallet).exists, 'No proof exists for this wallet');
    return this.proofHashBoxes(wallet).value === hashToVerify;
  }
}
