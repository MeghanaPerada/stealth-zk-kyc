import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { ZkpVerifierFactory } from '../artifacts/zkp_verifier/ZkpVerifierClient'

export async function deploy() {
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
}
