import {
  Account,
  assert,
  BoxMap,
  Contract,
  Global,
  Txn,
  uint64,
} from '@algorandfoundation/algorand-typescript'

/**
 * ConsentManager Contract
 * Manages user-granted consent for identity verification.
 * Uses Algorand Boxes for scalable per-user storage.
 */
export class ConsentManager extends Contract {
  /**
   * BoxMap to store permissions requested (e.g., "age,city")
   */
  permissions = BoxMap<Account, string>({ keyPrefix: 'p' })

  /**
   * BoxMap to store expiry timestamps
   */
  expiries = BoxMap<Account, uint64>({ keyPrefix: 'e' })

  /**
   * Grant consent for specific properties until an expiry time.
   * @param permissions Comma-separated permissions requested (e.g., "age,city")
   * @param expiry Unix timestamp (seconds) when consent expires
   */
  public grantConsent(permissions: string, expiry: uint64): void {
    assert(expiry > Global.latestTimestamp, 'Expiry must be in the future')
    
    // Store data in boxes
    this.permissions(Txn.sender).value = permissions
    this.expiries(Txn.sender).value = expiry
  }

  /**
   * Revoke existing consent for the sender.
   */
  public revokeConsent(): void {
    const sender = Txn.sender
    if (this.permissions(sender).exists) {
      this.permissions(sender).delete()
    }
    if (this.expiries(sender).exists) {
      this.expiries(sender).delete()
    }
  }

  /**
   * Check if a user has valid (not expired) consent.
   * @param user The account to check
   * @returns true if valid consent exists
   */
  public isConsentValid(user: Account): boolean {
    if (!this.expiries(user).exists) {
      return false
    }
    return this.expiries(user).value > Global.latestTimestamp
  }

  /**
   * Get the permissions granted by a user.
   * Fails if consent is invalid or expired.
   * @param user The account to check
   * @returns The permissions string
   */
  public getPermissions(user: Account): string {
    assert(this.isConsentValid(user), 'No valid consent found or consent expired')
    return this.permissions(user).value
  }
}
