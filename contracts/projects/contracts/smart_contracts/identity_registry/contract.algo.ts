import { Contract, BoxMap, Account, assert } from '@algorandfoundation/algorand-typescript'

/**
 * IdentityRegistry Contract
 * Maintains a public registry of verified wallets and their associated proof IDs.
 * Allows organizations to query if a user has completed ZK-KYC.
 */
export class IdentityRegistry extends Contract {
  /** Mapping of Wallet Address -> Proof ID */
  verifiedWallets = BoxMap<Account, string>({ keyPrefix: 'v' })

  /**
   * Registers a wallet as verified.
   * @param wallet The account to verify
   * @param proofId The unique ID associated with the user's ZK proof
   */
  public registerVerification(wallet: Account, proofId: string): void {
    assert(proofId !== '', 'Proof ID cannot be empty')
    
    // Store the verification record
    this.verifiedWallets(wallet).value = proofId
  }

  /**
   * Checks if a wallet is verified.
   * @param wallet The account to check
   * @returns True if the wallet is in the registry
   */
  public isVerified(wallet: Account): boolean {
    return this.verifiedWallets(wallet).exists
  }

  /**
   * Retrieves the proof ID for a verified wallet.
   * @param wallet The account to query
   * @returns The associated proof ID
   */
  public getProofId(wallet: Account): string {
    assert(this.verifiedWallets(wallet).exists, 'Wallet not found in verified registry')
    return this.verifiedWallets(wallet).value
  }
}
