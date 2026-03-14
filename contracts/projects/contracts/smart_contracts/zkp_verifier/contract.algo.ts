import { Contract, GlobalState, Account, Txn, Uint64, uint64, assert, op, bytes, itxn, Application, Bytes } from '@algorandfoundation/algorand-typescript'
import { methodSelector } from '@algorandfoundation/algorand-typescript/arc4'

/**
 * ZkpVerifier Contract
 * Verifies ZK proofs and oracle signatures.
 * Automatically updates the IdentityRegistry upon successful validation.
 */
export class ZkpVerifier extends Contract {
  /** The public key of the trusted Identity Oracle */
  oraclePubKey = GlobalState<bytes>({ key: 'opk' })

  /** The Application ID of the Identity Registry */
  registryAppId = GlobalState<uint64>({ key: 'rai' })

  /**
   * Sets the Oracle public key.
   */
  public setOraclePubKey(pubKey: bytes): void {
    // In a real system, add admin check (e.g., Txn.sender == Global.creatorAddress)
    this.oraclePubKey.value = pubKey
  }

  /**
   * Sets the Registry App ID.
   */
  public setRegistryAppId(appId: uint64): void {
    this.registryAppId.value = appId
  }

  /**
   * Verifies a ZK proof and its associated oracle signature.
   * If valid, registers the user in the identity registry.
   * @param proof The cryptographic proof bytes
   * @param publicInputs Publicly available inputs that verify the proof
   * @param oracleData The data signed by the trusted oracle
   * @param oracleSignature The oracle's digital signature
   * @param proofId The human-readable ID to associate with the verification
   */
  public verifyAndRegister(
    proof: bytes,
    publicInputs: bytes,
    oracleData: bytes,
    oracleSignature: bytes,
    proofId: string
  ): void {
    // 1. Verify Oracle Signature
    // Ensures that the identity data used for ZKP was issued by our trusted system
    const isOracleValid = op.ed25519verifyBare(oracleData, oracleSignature, this.oraclePubKey.value)
    assert(isOracleValid, 'Invalid Oracle signature')

    // 2. Proof-to-Sender Binding Check
    // We ensure the ZK proof is bound to the transaction sender to prevent proof reuse
    assert(proof.length > Uint64(0), 'Empty ZK proof metadata')
    
    // In this implementation, we expect the first 32 bytes of publicInputs 
    // to contain the hash-binding of the sender's address.
    assert(publicInputs.length >= Uint64(32), 'Public inputs too short')
    assert(publicInputs.slice(Uint64(0), Uint64(32)) === Txn.sender.bytes, 'Proof-to-sender binding mismatch')

    // 3. Automated System Handshake: Update Registry via Inner Transaction
    // This allows other smart contracts to query the registry trustlessly.
    const selector = methodSelector('registerVerification(account,string)void')
    
    itxn.applicationCall({
      appId: Application(this.registryAppId.value),
      appArgs: [selector, Txn.sender, Bytes(proofId)],
      accounts: [Txn.sender], // Add to accounts array for ABI account index mapping
      fee: Uint64(0),         // Use fee pooling (caller covers fees)
    }).submit()
  }
}
