import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { ConsentManagerFactory } from '../artifacts/consent_manager/ConsentManagerClient'

export async function deploy() {
  console.log('=== Deploying ConsentManager ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  const factory = algorand.client.getTypedAppFactory(ConsentManagerFactory, {
    defaultSender: deployer.addr,
  })

  const { appClient } = await factory.deploy({
    onUpdate: 'append',
    onSchemaBreak: 'append',
  })

  console.log(`ConsentManager deployed at App ID: ${appClient.appId}`)
  
  // Update .env.local with the new App ID for the frontend/backend to use
  // Note: In a real CI/CD, this would be automated differently.
  return appClient.appId
}
