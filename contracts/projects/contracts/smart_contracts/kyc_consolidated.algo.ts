import { Contract, Account, assert, log, BoxMap, Global, GlobalState, Uint64, uint64, Txn, op, Bytes, bytes } from '@algorandfoundation/algorand-typescript';

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

  // --- M-of-N Oracle Consensus State ---
  /**
   * Minimum number of oracle signatures required (M).
   */
  minOracleConsensus = GlobalState<uint64>({ initialValue: 1 });

  /**
   * Set of authorized oracle public keys (N).
   */
  authorizedOracles = BoxMap<bytes, boolean>({ keyPrefix: 'ao' });

  /**
   * 1. addOracle
   * Adds an authorized Oracle public key.
   * @param pubKey The 32-byte public key of the Oracle
   */
  addOracle(pubKey: bytes): void {
    // In a production app, add creator-only check
    this.authorizedOracles(pubKey).value = true;
    log('ORACLE_ADDED');
  }

  /**
   * 1b. removeOracle
   * Revokes an authorized Oracle.
   */
  removeOracle(pubKey: bytes): void {
    // In a production app, add creator-only check
    if (this.authorizedOracles(pubKey).exists) {
      this.authorizedOracles(pubKey).delete();
      log('ORACLE_REMOVED');
    }
  }

  /**
   * 1c. setMinConsensus
   * Sets the M value.
   */
  setMinConsensus(m: uint64): void {
    // In a production app, add creator-only check
    this.minOracleConsensus.value = m;
    log('MIN_CONSENSUS_UPDATED');
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
   * Requires M valid Oracle Signatures (Multi-Oracle Consensus).
   */
  storeProof(
    wallet: Account,
    proofHash: bytes,
    oraclePubKeysInputs: bytes[],
    oracleSignaturesInputs: bytes[]
  ): void {
    assert(this.hasValidConsent(wallet), 'Active consent is required to store proof');
    assert(proofHash.length > 0, 'Proof hash cannot be empty');
    
    // 🔥 Multi-Oracle Consensus: M-of-N Signature Verification
    const m = this.minOracleConsensus.value;
    assert(oraclePubKeysInputs.length >= m, 'Not enough signatures provided');
    assert(oraclePubKeysInputs.length === oracleSignaturesInputs.length, 'Public key and signature arrays must match in length');

    let validSignatureCount = Uint64(0);

    for (let i = Uint64(0); i < oraclePubKeysInputs.length; i++) {
        const pubKey = oraclePubKeysInputs[i];
        const sig = oracleSignaturesInputs[i];

        // Ensure uniqueness of public keys to prevent duplicate counting
        for (let j = Uint64(0); j < i; j++) {
            assert(pubKey !== oraclePubKeysInputs[j], 'Oracle public keys must be unique');
        }

        // Verify the Oracle is authorized
        assert(this.authorizedOracles(pubKey).exists && this.authorizedOracles(pubKey).value === true, 'Unauthorized Oracle');

        // Verify Signature
        const isSignatureValid = op.ed25519verifyBare(proofHash, sig, pubKey);
        assert(isSignatureValid, 'Invalid Oracle signature: Proof tampering detected');

        validSignatureCount++;
    }

    assert(validSignatureCount >= m, 'M-of-N Oracle threshold not met');

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
