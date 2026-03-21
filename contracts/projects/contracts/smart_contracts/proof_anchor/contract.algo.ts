import { Contract, GlobalState, BoxMap, Account, Txn, Uint64, uint64, assert, Global, op, bytes } from '@algorandfoundation/algorand-typescript'

/**
 * ProofAnchor Contract
 * Immutably stores ZK-KYC proof hashes bound to wallet addresses.
 */
export class ProofAnchor extends Contract {
  /** Total number of proofs anchored on-chain */
  totalProofs = GlobalState<uint64>({ key: 'tp' })

  /** Contract secret used to hash wallet addresses into stealth keys */
  appSecret = GlobalState<bytes>({ key: 'sec' })

  /** Mapping of Stealth Key (SHA256(Wallet + Secret)) -> Proof Hash */
  proofs = BoxMap<bytes, string>({ keyPrefix: 'p' })

  /**
   * Derives a stealth key for a given wallet address using the app's secret.
   */
  private getStealthKey(wallet: Account): bytes {
    return op.sha256(wallet.bytes.concat(this.appSecret.value))
  }

  /**
   * Admin method to set or update the secret key.
   * Only the contract creator can call this.
   */
  public updateAppSecret(newSecret: bytes): void {
    assert(Txn.sender === Global.creatorAddress, 'Only creator can execute')
    this.appSecret.value = newSecret
  }

  /**
   * Anchors a ZK proof hash to the sender's account.
   * Ensures that only the wallet owner can submit their own proof metadata.
   * @param proofHash The cryptographic hash of the ZK proof (e.g., SHA-256)
   */
  public submitProof(proofHash: string): void {
    // Ensure the hash is not empty
    assert(proofHash !== '', 'Proof hash cannot be empty')

    // Store the proof hash in a box keyed by the sender's stealth key
    // This protects privacy by not exposing the raw address as the box name
    this.proofs(this.getStealthKey(Txn.sender)).value = proofHash

    // Increment global counters
    this.totalProofs.value = this.totalProofs.value + Uint64(1)
  }

  /**
   * Retrieves the proof hash for a given account.
   * @param account The account to query
   * @returns The anchored proof hash
   */
  public getProof(account: Account): string {
    assert(this.proofs(this.getStealthKey(account)).exists, 'No proof found for this account')
    return this.proofs(this.getStealthKey(account)).value
  }

  /**
   * Returns the total number of proofs anchored by this contract.
   */
  public getTotalProofs(): uint64 {
    return this.totalProofs.value
  }
}
