/**
 * Example of using auto-id registry:
 * - Register auto id for issuer and user
 * - Revoke certificate of issuer or user
 *
 */

import {
  CertificateManager,
  Registry,
  cryptoKeyToPem,
  extractSignatureAlgorithmOID,
  generateEd25519KeyPair2,
  generateRsaKeyPair2,
  pemToHex,
  pemToPrivateKey,
  saveKey,
} from '@autonomys/auto-id'
import { Keyring } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { config } from 'dotenv'

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

async function main(taskName: string, identifier: string) {
  await cryptoWaitReady()

  const { RPC_URL, KEYPAIR_URI } = loadEnv()

  // Initialize the signer keypair
  const keyring = new Keyring({ type: 'sr25519' })
  const issuer = keyring.addFromUri(KEYPAIR_URI)

  // Initialize the Registry instance
  const registry = new Registry(RPC_URL!, issuer)

  if (taskName === 'register') {
    /* Register Auto ID for issuer */
    console.log('\n===================== ISSUER =====================')
    // const issuerKeys = await generateRsaKeyPair2() // TODO: RSA
    const issuerKeys = await generateEd25519KeyPair2() // Ed25519
    // console.debug("user's private key algorithm: ", issuerKeys[0].algorithm.name)
    // const issuerPublicKeyInfo = pemToHex(await cryptoKeyToPem(issuerKeys[1]))
    // console.debug('Issuer public key info:', issuerPublicKeyInfo)
    // console.debug('PKI Algorithm OID:', extractSignatureAlgorithmOID(issuerPublicKeyInfo))

    // Convert the CryptoKey to a PEM string
    const issuerPemString = await cryptoKeyToPem(issuerKeys[0])
    saveKey(pemToPrivateKey(issuerPemString), './res/private.issuer.pem')
    // console.debug("issuer's private key algorithm: ", issuerKeys[0].algorithm.name)

    const selfIssuedCm = new CertificateManager(null, issuerKeys[0], issuerKeys[1])
    const selfIssuedCert = await selfIssuedCm.selfIssueCertificate('test8')
    const registerIssuer = await registry.registerAutoId(selfIssuedCert)
    CertificateManager.prettyPrintCertificate(selfIssuedCert)
    const issuerAutoIdIdentifier = registerIssuer.identifier!
    console.log(
      `===\nRegistered auto id from issuer cert: ${CertificateManager.getCertificateAutoId(selfIssuedCert)} with identifier: ${issuerAutoIdIdentifier} in block #${registerIssuer.receipt?.blockNumber?.toString()}`,
    )

    console.log('\n\n===================== USER =====================')
    /* Register Auto ID for user */
    // const userKeys = await generateRsaKeyPair2() // TODO: RSA
    const userKeys = await generateEd25519KeyPair2() // Ed25519
    // console.debug("user's private key algorithm: ", userKeys[0].algorithm.name)
    // const userPublicKeyInfo = pemToHex(await cryptoKeyToPem(issuerKeys[1]))
    // console.debug('User public key info:', userPublicKeyInfo)
    // console.debug('PKI Algorithm OID:', extractSignatureAlgorithmOID(userPublicKeyInfo))

    // Convert the CryptoKey to a PEM string
    const userPemString = await cryptoKeyToPem(userKeys[0])
    saveKey(pemToPrivateKey(userPemString), './res/private.leaf.pem')

    const userCm = new CertificateManager(null, userKeys[0], userKeys[1])
    const userCsr = await userCm.createAndSignCSR('user8')
    // TODO: I think here 🤔, `selfIssuedCm` should be replaced with `userCm`. Then, the publicKeyInfo in the user's onchain certificate would be of user's public key than issuer's public key.
    const userCert = await selfIssuedCm.issueCertificate(userCsr)
    CertificateManager.prettyPrintCertificate(userCert)
    // NOTE: Ideally, this could be registered by anyone (user/registrar), not just the issuer. Notes in Notion. Here, it's the issuer (Alice) sending the tx.
    const registerUser = await registry.registerAutoId(userCert, issuerAutoIdIdentifier)
    console.log(
      `Registered auto id from user cert: ${CertificateManager.getCertificateAutoId(userCert)} with identifier: ${registerUser.identifier} in block #${registerUser.receipt?.blockNumber?.toString()}`,
    )
  } else if (taskName === 'revoke') {
    /* Revoke self Certificate */
    const revoked = await registry.revokeCertificate(identifier)
    if (revoked) {
      console.log(
        `Revoked registered user certificate with identifier: ${identifier} in block #${revoked.blockNumber?.toString()}`,
      )
    }
  } else if (taskName === 'deactivate') {
    /* Deactivate Auto ID */
    const deactivated = await registry.deactivateAutoId(identifier)
    if (deactivated) {
      console.log(
        `Deactivated auto id with identifier: ${identifier} in block #${deactivated.blockNumber?.toString()}`,
      )
    }
  }
  // FIXME: Not working yet
  // else if (taskName === 'view-cert') {
  //   const cert = await registry.getCertificate(identifier)
  //   console.log(cert)
  // } else if (taskName === 'view-revoked-list') {
  //   const revokedList = await registry.getCertificateRevocationList(identifier)
  //   console.log(revokedList)
  // }
  else {
    throw new Error('Task not recognized')
  }
}

const taskName = process.argv[2]
const identifier = process.argv[3]
main(taskName, identifier)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

/* Deactivate Certificate */
// const deactivated = await registry.deactivateAutoId(registerUser.identifier!, userCert)
// console.log(
//   `Deactivated registered user certificate with identifier: ${registerUser.identifier!} in block #${deactivated.blockNumber?.toString()}`,
// )