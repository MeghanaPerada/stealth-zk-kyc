import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { ZkpVerifierFactory } from '../artifacts/zkp_verifier/ZkpVerifierClient'

export async function deploy(registryAppId?: number) {
  console.log('=== Deploying ZkpVerifier ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  const factory = algorand.client.getTypedAppFactory(ZkpVerifierFactory, {
    defaultSender: deployer.addr,
  })

  const { appClient } = await factory.deploy({
    onUpdate: 'append',
    onSchemaBreak: 'append',
  })

  console.log(`ZkpVerifier deployed at App ID: ${appClient.appId}`)

  // 1. Link to Identity Registry
  if (registryAppId) {
    console.log(`Linking ZkpVerifier to IdentityRegistry ${registryAppId}...`)
    await appClient.send.setRegistryAppId({ args: { appId: registryAppId } })
  }

  // 2. Authorize Default Oracle (from env)
  const oraclePubKey = process.env.NEXT_PUBLIC_ORACLE_PUBKEY
  if (oraclePubKey) {
    console.log(`Authorizing Oracle ${oraclePubKey}...`)
    const pubKeyBytes = Buffer.from(oraclePubKey, 'hex')
    await appClient.send.addOracle({ args: { pubKey: pubKeyBytes } })
  }

  // 3. Set Min Consensus (Default to 1 for hackathon)
  await appClient.send.setMinConsensus({ args: { m: 1 } })

  return { appClient }
}
