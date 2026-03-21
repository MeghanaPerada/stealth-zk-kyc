import { Contract, BoxMap, Account, assert, Global, op, bytes, Txn, GlobalState } from '@algorandfoundation/algorand-typescript'

/**
 * IdentityRegistry Contract
 * Maintains a public registry of verified wallets and their associated proof IDs.
 * Allows organizations to query if a user has completed ZK-KYC.
 */
export class IdentityRegistry extends Contract {
  /** Contract secret used to hash wallet addresses into stealth keys */
  appSecret = GlobalState<bytes>({ key: 'sec' })

  /** Mapping of Stealth Key (SHA256(Wallet + Secret)) -> Proof ID */
  verifiedWallets = BoxMap<bytes, string>({ keyPrefix: 'v' })

  /**
   * Derives a stealth key for a given wallet address using the app's secret.
   * This prevents on-chain observers from linking wallets to KYC status.
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
   * Registers a wallet as verified.
   * @param wallet The account to verify
   * @param proofId The unique ID associated with the user's ZK proof
   */
  public registerVerification(wallet: Account, proofId: string): void {
    assert(proofId !== '', 'Proof ID cannot be empty')
    
    // Store the verification record using the stealth key
    this.verifiedWallets(this.getStealthKey(wallet)).value = proofId
  }

  /**
   * Checks if a wallet is verified.
   * @param wallet The account to check
   * @returns True if the wallet is in the registry
   */
  public isVerified(wallet: Account): boolean {
    return this.verifiedWallets(this.getStealthKey(wallet)).exists
  }

  /**
   * Retrieves the proof ID for a verified wallet.
   * @param wallet The account to query
   * @returns The associated proof ID
   */
  public getProofId(wallet: Account): string {
    assert(this.verifiedWallets(this.getStealthKey(wallet)).exists, 'Wallet not found in verified registry')
    return this.verifiedWallets(this.getStealthKey(wallet)).value
  }
}
