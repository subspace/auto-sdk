import { createPublicKey } from 'crypto'
import * as forge from 'node-forge'
import CertificateManager from '../src/certificateManager'
import {
  doPublicKeysMatch,
  generateEd25519KeyPair,
  generateRsaKeyPair,
  pemToPrivateKey,
  pemToPublicKey,
} from '../src/keyManagement'

describe('CertificateManager', () => {
  it('create and sign CSR', () => {
    // Generate a key pair
    const [privateKey, _] = generateRsaKeyPair()
    // TODO: Enable when Ed25519 key pair is supported by CertificateManager
    // const [privateKey, _] = generateEd25519KeyPair() // Fails ❌ with error: "Cannot read public key. Unknown OID."

    // Instantiate CertificateManager with the generated private key
    const certificateManager = new CertificateManager(null, pemToPrivateKey(privateKey))

    // Create and sign a CSR
    const subjectName = 'Test'
    const csr = certificateManager.createAndSignCSR(subjectName)

    expect(csr).not.toBeNull()

    // NOTE: static type-checking is already done in TypeScript at compile time unlike Python. So, ignored this assertion.
    // Assert that the CSR is of type  x509.CertificateSigningRequest
    // assert isinstance(csr, x509.CertificateSigningRequest)

    // Assert that the CSR subject name matches the provided subject name
    const commonNameField = csr.subject.attributes.find((attr) => attr.name === 'commonName')
    expect(commonNameField?.value).toEqual(subjectName)

    // Get the derived public key (in forge) from original private key.
    // private key (PEM) -> private key(KeyObject) -> public key(PEM)
    const derivedPublicKeyObj = pemToPublicKey(
      CertificateManager.pemPublicFromPrivateKey(pemToPrivateKey(privateKey)),
    )

    // Assert that the CSR public key matches the public key from the key pair
    if (csr.publicKey) {
      // Convert forge.PublicKey format to crypto.KeyObject
      const csrPublicKeyObj = createPublicKey(forge.pki.publicKeyToPem(csr.publicKey))

      expect(doPublicKeysMatch(csrPublicKeyObj, derivedPublicKeyObj)).toBe(true)
    } else {
      throw new Error('CSR does not have a public key.')
    }
  })

  it('issue certificate', () => {
    const [subjectPrivateKey, subjectPublicKey] = generateRsaKeyPair()
    const [issuerPrivateKey, issuerPublicKey] = generateRsaKeyPair()

    // TODO: Enable when Ed25519 key pair is supported by CertificateManager
    // const [subjectPrivateKey, subjectPublicKey] = generateRsaKeyPair()
    // const [issuerPrivateKey, issuerPublicKey] = generateRsaKeyPair()

    const issuer = new CertificateManager(null, pemToPrivateKey(issuerPrivateKey))
    const _issuerCertificate = issuer.selfIssueCertificate('issuer')

    // Define the subject name for the certificate
    const subjectName = 'Test'

    const csrCreator = new CertificateManager(null, pemToPrivateKey(subjectPrivateKey))
    // Call the createCSR function to generate a CSR
    const csr = csrCreator.createAndSignCSR(subjectName)

    // Issue a certificate using the CSR
    const certificate = issuer.issueCertificate(csr)

    // Assert that the certificate is not null
    expect(certificate).not.toBeNull()

    // NOTE: static type-checking is already done in TypeScript at compile time unlike Python. So, ignored this assertion.
    // Assert that the certificate is of type x509.Certificate
    // assert isinstance(certificate, x509.Certificate)

    // Assert that the certificate subject name matches the provided subject name
    const commonNameField = csr.subject.attributes.find((attr) => attr.name === 'commonName')
    expect(commonNameField?.value).toEqual(subjectName)

    // Assert that the certificate public key matches the private key's public key
    if (certificate.publicKey) {
      const certificatePublicKeyObj = createPublicKey(
        forge.pki.publicKeyToPem(certificate.publicKey),
      )
      const subjectPublicKeyObj = createPublicKey(subjectPublicKey)

      expect(doPublicKeysMatch(certificatePublicKeyObj, subjectPublicKeyObj)).toBe(true)
    } else {
      throw new Error('Certificate does not have a public key.')
    }

    const certBytes = certificate.tbsCertificate
    const signature = certificate.signature
    // FIXME: Verify the certificate signature
    // issuer_public_key.verify(signature, cert_bytes)

    // Convert the issuer's public key from PEM to a forge public key object
    const issuerPublicKeyObj = forge.pki.publicKeyFromPem(issuerPublicKey)

    const tbsDer = forge.asn1.toDer(certBytes).getBytes()
    const isValidSignature = issuerPublicKeyObj.verify(tbsDer, signature)

    expect(isValidSignature).toBe(true)
  })
})
