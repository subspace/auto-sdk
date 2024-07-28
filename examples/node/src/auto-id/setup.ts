import { createConnection, cryptoWaitReady, Keyring } from '@autonomys/auto-utils'
import { pemToKeyPair } from './crypto-utils'
import { loadEnv } from './utils'

export const setup = async () => {
  await cryptoWaitReady()

  const { RPC_URL, KEYPAIR_URI } = loadEnv()

  // Initialize the signer keypair
  const keyring = new Keyring({ type: 'sr25519' })
  const signer = keyring.addFromUri(KEYPAIR_URI)

  // Initialize the API
  const api = await createConnection(RPC_URL!)

  //Load keys
  const issuerPrivateFilePath = './res/issuer.rsa.private.pem'
  const issuerPublicFilePath = './res/issuer.rsa.private.pem'
  const issuerKeys = await pemToKeyPair(
    issuerPrivateFilePath,
    issuerPublicFilePath,
    'RSASSA-PKCS1-v1_5',
  )

  const leafPrivateFilePath = './res/leaf.rsa.private.pem'
  const leafPublicFilePath = './res/leaf.rsa.private.pem'
  const leafKeys = await pemToKeyPair(leafPrivateFilePath, leafPublicFilePath, 'RSASSA-PKCS1-v1_5')

  return { api, signer, issuerKeys, leafKeys }
}
