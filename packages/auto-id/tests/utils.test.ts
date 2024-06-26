import { AsnParser } from '@peculiar/asn1-schema' // A library to parse ASN.1
// TODO: See why X509Certificate (from crypto) is not compatible argument.
import { Certificate } from '@peculiar/asn1-x509' // Assuming X.509 certificate handling
import fs from 'fs'
import { derEncodeSignatureAlgorithmOID } from '../src/utils'

describe('Verify crypto functions', () => {
  test('DER encode signature algorithm OID from a certificate', () => {
    // Load the certificate from a file
    const certPath = 'tests/issuer.cert.der'
    const certData = fs.readFileSync(certPath)

    // Load and parse the certificate
    const cert = AsnParser.parse(certData, Certificate)

    // Extract the OID of the signature algorithm
    const signatureAlgorithmOID = cert.signatureAlgorithm.algorithm

    // DER encode the OID
    const derEncodedOID = derEncodeSignatureAlgorithmOID(signatureAlgorithmOID)
    // <Buffer 30 0d 06 09 2a 86 48 86 f7 0d 01 01 0b 05 00>
    // console.log(Buffer.from(derEncodedOID))

    // Convert derEncodedOID to hex string for comparison
    const derEncodedOIDHex = Buffer.from(derEncodedOID).toString('hex')

    // Expected DER encoded OID from the result of tests in https://github.com/subspace/subspace/blob/d875a5aac35c1732eec61ce4359782eff58ff6fc/domains/pallets/auto-id/src/tests.rs#L127
    expect(derEncodedOIDHex).toEqual('300d06092a864886f70d01010b0500')
  })
})
