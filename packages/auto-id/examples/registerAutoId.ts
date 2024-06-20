/**
 * Example of how to register an auto-id
 */

import * as x509 from '@peculiar/x509'
import { Keyring } from '@polkadot/api'
import { config } from 'dotenv'
import { CertificateManager, Registry, generateEd25519KeyPair2 } from '../src/index'

function loadEnv(): { RPC_URL: string; KEYPAIR_URI: string } {
  const myEnv = config()
  if (myEnv.error) {
    throw new Error('Failed to load the .env file.')
  }

  const RPC_URL = process.env.RPC_URL
  if (!RPC_URL) {
    throw new Error('Please set your rpc url in a .env file')
  }

  const KEYPAIR_URI = process.env.KEYPAIR_URI
  if (!KEYPAIR_URI) {
    throw new Error('Please set your keypair uri in a .env file')
  }

  return { RPC_URL, KEYPAIR_URI }
}

async function register(certificate: x509.X509Certificate, registry: Registry, issuerId?: number) {
  // Attempt to register the certificate
  const { receipt, identifier } = await registry.registerAutoId(certificate, issuerId)
  if (receipt && receipt.isInBlock) {
    console.log(`Registration successful. ${identifier}`)
    return identifier
  } else {
    console.log('Registration failed.')
  }
}

async function main() {
  const { RPC_URL, KEYPAIR_URI } = loadEnv()

  // Initialize the signer keypair
  const keyring = new Keyring({ type: 'ed25519' })
  const substrateKeypair = keyring.addFromUri(KEYPAIR_URI, { name: 'sr25519' }, 'ed25519')

  // Initialize the Registry instance
  const registry = new Registry(RPC_URL!, substrateKeypair)

  const keys = await generateEd25519KeyPair2()
  const selfIssuedCm = new CertificateManager(null, keys[0], keys[1])
  const selfIssuedCert = await selfIssuedCm.selfIssueCertificate('test')
  const issuerId = await register(selfIssuedCert, registry)

  const userKeys = await generateEd25519KeyPair2()
  const userCm = new CertificateManager(null, userKeys[0], userKeys[1])
  const userCsr = await userCm.createAndSignCSR('user')
  const userCert = await selfIssuedCm.issueCertificate(userCsr)
  CertificateManager.prettyPrintCertificate(userCert)
  const registerUser = await register(userCert, registry, issuerId!)

  console.log(`auto id from cert: ${CertificateManager.getCertificateAutoId(userCert)}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
