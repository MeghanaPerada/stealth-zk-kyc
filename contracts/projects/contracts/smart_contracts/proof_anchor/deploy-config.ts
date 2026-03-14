import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { ProofAnchorFactory } from '../artifacts/proof_anchor/ProofAnchorClient'

export async function deploy() {
  console.log('=== Deploying ProofAnchor ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  const factory = algorand.client.getTypedAppFactory(ProofAnchorFactory, {
    defaultSender: deployer.addr,
  })

  const { appClient } = await factory.deploy({
    onUpdate: 'append',
    onSchemaBreak: 'append',
  })

  console.log(`ProofAnchor deployed at App ID: ${appClient.appId}`)
}
