import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { ZkpVerifierFactory } from '../src/contracts/zkp_verifier/ZkpVerifierClient'
import { decodeBase64 } from 'tweetnacl-util'

const ORACLE_PK = 'Jjh9e8UGI0DTtVf2hv/9dpN7OFLYGF2XQQniB+TXToc=';
const REGISTRY_APP_ID = BigInt(1005);
const VERIFIER_APP_ID = BigInt(1007);

async function configure() {
  const algorand = AlgorandClient.defaultLocalNet()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')
  
  const factory = new ZkpVerifierFactory({
    algorand: algorand,
    defaultSender: deployer.addr,
  })

  // Connect to existing App instance
  const client = factory.getAppClientById({
    appId: VERIFIER_APP_ID,
  })

  console.log('Configuring ZkpVerifier App ID:', VERIFIER_APP_ID);
  
  try {
    await client.send.setOraclePubKey({
      args: { pubKey: decodeBase64(ORACLE_PK) }
    });
    console.log('✅ Oracle Public Key set.');

    await client.send.setRegistryAppId({
      args: { appId: REGISTRY_APP_ID }
    });
    console.log('✅ Registry App ID set to:', REGISTRY_APP_ID);
    
    console.log('🚀 ZkpVerifier configured successfully!');
  } catch (err: any) {
    console.error('❌ Failed to configure ZkpVerifier:', err);
    if (err.message) console.error('Message:', err.message);
  }
}

configure();
