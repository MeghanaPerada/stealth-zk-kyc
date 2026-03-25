import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { IdentityRegistryFactory } from '../artifacts/identity_registry/IdentityRegistryClient'

export async function deploy() {
  console.log('=== Deploying IdentityRegistry ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  const factory = algorand.client.getTypedAppFactory(IdentityRegistryFactory, {
    defaultSender: deployer.addr,
  })

  const { appClient } = await factory.deploy({
    onUpdate: 'append',
    onSchemaBreak: 'append',
  })

  console.log(`IdentityRegistry deployed at App ID: ${appClient.appId}`)
  return { appClient }
}
