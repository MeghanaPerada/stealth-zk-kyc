import { Contract, GlobalState, BoxMap, Account, Txn, Uint64, uint64, assert } from '@algorandfoundation/algorand-typescript'

/**
 * ProofAnchor Contract
 * Immutably stores ZK-KYC proof hashes bound to wallet addresses.
 */
export class ProofAnchor extends Contract {
  /** Total number of proofs anchored on-chain */
  totalProofs = GlobalState<uint64>({ key: 'tp' })

  /** Mapping of Wallet Address -> Proof Hash */
  proofs = BoxMap<Account, string>({ keyPrefix: 'p' })

  /**
   * Anchors a ZK proof hash to the sender's account.
   * Ensures that only the wallet owner can submit their own proof metadata.
   * @param proofHash The cryptographic hash of the ZK proof (e.g., SHA-256)
   */
  public submitProof(proofHash: string): void {
    // Ensure the hash is not empty
    assert(proofHash !== '', 'Proof hash cannot be empty')

    // Store the proof hash in a box keyed by the sender's address
    // This implicitly ensures only the owner can submit for their address
    this.proofs(Txn.sender).value = proofHash

    // Increment global counters
    this.totalProofs.value = this.totalProofs.value + Uint64(1)
  }

  /**
   * Retrieves the proof hash for a given account.
   * @param account The account to query
   * @returns The anchored proof hash
   */
  public getProof(account: Account): string {
    assert(this.proofs(account).exists, 'No proof found for this account')
    return this.proofs(account).value
  }

  /**
   * Returns the total number of proofs anchored by this contract.
   */
  public getTotalProofs(): uint64 {
    return this.totalProofs.value
  }
}
