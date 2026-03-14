import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { ZkpVerifierFactory } from '../src/contracts/zkp_verifier/ZkpVerifierClient'
import { decodeBase64 } from 'tweetnacl-util'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment from projects/contracts/.env.testnet
dotenv.config({ path: path.resolve(__dirname, '../contracts/projects/contracts/.env.testnet') })

const ORACLE_PK = 'Jjh9e8UGI0DTtVf2hv/9dpN7OFLYGF2XQQniB+TXToc=';
const REGISTRY_APP_ID = BigInt(757123414);
const VERIFIER_APP_ID = BigInt(757123441);

async function configure() {
  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')
  
  const factory = new ZkpVerifierFactory({
    algorand: algorand,
    defaultSender: deployer.addr,
  })

  // Connect to existing App instance
  const client = factory.getAppClientById({
    appId: VERIFIER_APP_ID,
  })

  console.log('Configuring Testnet ZkpVerifier App ID:', VERIFIER_APP_ID);
  
  try {
    await client.send.setOraclePubKey({
      args: { pubKey: decodeBase64(ORACLE_PK) }
    });
    console.log('✅ Testnet Oracle Public Key set.');

    await client.send.setRegistryAppId({
      args: { appId: REGISTRY_APP_ID }
    });
    console.log('✅ Testnet Registry App ID set to:', REGISTRY_APP_ID);
    
    console.log('🚀 Testnet ZkpVerifier configured successfully!');
  } catch (err: any) {
    console.error('❌ Failed to configure Testnet ZkpVerifier:', err);
    if (err.message) console.error('Message:', err.message);
  }
}

configure();
