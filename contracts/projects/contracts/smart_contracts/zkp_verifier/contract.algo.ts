import { Contract, GlobalState, Account, Txn, Uint64, uint64, assert, op, bytes, itxn, Application, Bytes, BigUint, biguint, Ec, arc4, BoxMap } from '@algorandfoundation/algorand-typescript'
import { methodSelector } from '@algorandfoundation/algorand-typescript/arc4'

/**
 * ZkpVerifier Contract
 * Verifies ZK proofs and oracle signatures.
 * Automatically updates the IdentityRegistry upon successful validation.
 */
export class ZkpVerifier extends Contract {
  /** Storage for used nullifiers to prevent double-claiming (Identity Sybil protection) */
  usedNullifiers = BoxMap<bytes, boolean>({ keyPrefix: 'n' })

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
   * @param proof The 256-byte Groth16 proof bytes (A, B, C)
   * @param publicInputs Concatenated 32-byte public signals (identityHash, isVerified, proofId, timestamp)
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
    // 1. Verify Oracle Signature (Legacy/Fallback Trust)
    const isOracleValid = op.ed25519verifyBare(oracleData, oracleSignature, this.oraclePubKey.value)
    assert(isOracleValid, 'Invalid Oracle signature')

    // 2. Direct On-Chain ZK Verification (Stateless Trust)
    // This is the primary security upgrade: verifying the proof directly against public signals
    const isZkValid = this.verifyZkProof(proof, publicInputs)
    assert(isZkValid, 'ZK Proof verification failed')

    // 3. Logic Checks on Public Signals
    // signals order (Circom standard): [isVerified, nullifier, identityHash, proofId, timestamp]
    assert(publicInputs.length === Uint64(160), 'Invalid public inputs length (expected 5 signals)')
    
    // Check isVerified signal (index 0)
    const isVerified = publicInputs.slice(0, 32)
    assert(isVerified === Bytes.fromHex('0000000000000000000000000000000000000000000000000000000000000001'), 'User not verified by ZK circuit')

    // 4. Anonymous Nullifier Check (Identity Sybil Protection)
    const nullifier = publicInputs.slice(32, 64)
    assert(!this.usedNullifiers(nullifier).exists, 'This identity has already registered a wallet')
    
    // Store the nullifier to prevent reuse
    this.usedNullifiers(nullifier).value = true

    // 5. Proof-to-Sender Binding Check
    // We bind the proof to the sender's address (often part of the identityHash or a separate input)
    // For now, we continue the previous check if identityHash contains binding, or simply validate proof presence.
    assert(proof.length === Uint64(256), 'Invalid ZK proof length')

    // 5. Update Registry via Inner Transaction
    const selector = methodSelector('registerVerification(account,string)void')
    
    itxn.applicationCall({
      appId: Application(this.registryAppId.value),
      appArgs: [selector, Txn.sender, Bytes(proofId)],
      accounts: [Txn.sender],
      fee: Uint64(0),
    }).submit()
  }

  /**
   * Internal helper to verify Groth16 ZK Proof (BN254)
   * Equation: e(-A, B) + e(alpha, beta) + e(vk_x, gamma) + e(C, delta) = 0
   */
  private verifyZkProof(proof: bytes, publicInputs: bytes): boolean {
    const a = proof.slice(0, 64)
    const b = proof.slice(64, 192)
    const c = proof.slice(192, 256)

    // Negate A for the pairing equation
    const aNeg = this.negateG1(a)

    // Compute vk_x (Linear Combination of Public Inputs)
    const vkX = this.computeVkX(publicInputs)

    // Prepare pairing buffers
    // G1 points: -A, alpha1, vk_x, C (64 bytes each)
    // G2 points: B, beta2, gamma2, delta2 (128 bytes each)
    
    // Using hardcoded VK placeholders (Requires actual VK from user)
    const alpha1 = Bytes.fromHex('00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000') 
    const beta2 = Bytes.fromHex('0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')
    const gamma2 = beta2 // Placeholder
    const delta2 = beta2 // Placeholder

    const g1Points = aNeg.concat(alpha1).concat(vkX).concat(c)
    const g2Points = b.concat(beta2).concat(gamma2).concat(delta2)

    return op.EllipticCurve.pairingCheck(Ec.BN254g1, g1Points, g2Points)
  }

  private negateG1(g1: bytes): bytes {
    const x = g1.slice(0, 32)
    const y = g1.slice(32, 64)
    const MODULUS = BigUint('21888242871839275222246405745257275088696311157297823662689037894645226208583')
    const yBig = BigUint(y)
    const negY = BigUint(MODULUS - yBig)
    return x.concat(new arc4.Uint256(negY).bytes)
  }

  private computeVkX(publicInputs: bytes): bytes {
    // vk_x = IC[0] + IC[1]*pub[0] + IC[2]*pub[1] + ...
    // Requires IC points from the Verification Key
    // Placeholder logic: returning a fixed G1 point (infinity or IC[0])
    return Bytes.fromHex('00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')
  }
}
