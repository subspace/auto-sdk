// registerAutoIds.ts

import { CertificateManager, Registry, generateEd25519KeyPair2 } from '@autonomys/auto-id'
import * as x509 from '@peculiar/x509'
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { config } from 'dotenv'
import fs from 'fs/promises'
import { setMaxIdleHTTPParsers } from 'http'

function loadEnv(): { RPC_URL: string } {
  const myEnv = config()
  if (myEnv.error) {
    throw new Error('Failed to load the .env file.')
  }

  const RPC_URL = process.env.RPC_URL
  if (!RPC_URL) {
    throw new Error('Please set your rpc url in a .env file')
  }

  return { RPC_URL }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

async function register(
  certificate: x509.X509Certificate,
  registry: Registry,
  issuerId?: string | null | undefined,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    registry
      .registerAutoId(certificate, issuerId)
      .then(({ receipt, identifier }) => {
        if (receipt && receipt.isInBlock) {
          console.log(
            `Registration successful with Auto ID identifier: ${identifier} in block #${receipt.blockNumber?.toString()}`,
          )
          resolve(identifier)
        } else {
          console.log('Registration failed.')
          resolve(null)
        }
      })
      .catch(reject)
  })
}

async function registerAutoId(wallet: KeyringPair, registry: Registry): Promise<string | null> {
  const keys = await generateEd25519KeyPair2()
  const cm = new CertificateManager(null, keys[0], keys[1])
  const randomValue = generateRandomString(10)
  const cert = await cm.selfIssueCertificate(randomValue)

  console.log(`Registering Auto ID for wallet ${wallet.address}`)
  await sleep(2000)
  const autoId = await register(cert, registry)

  if (autoId) {
    console.log(`Auto ID from cert: ${CertificateManager.getCertificateAutoId(cert)}`)
  }

  return autoId
}

async function registerAutoIdsForWallet(
  wallet: KeyringPair,
  registry: Registry,
  numAutoIds: number,
): Promise<(string | null)[]> {
  const results: (string | null)[] = []
  for (let i = 0; i < numAutoIds; i++) {
    const result = await registerAutoId(wallet, registry)

    results.push(result)
    if (result === null) {
      console.log(
        `Failed to register Auto ID ${i + 1} for wallet ${wallet.address}. Stopping further registrations for this wallet.`,
      )
      break
    }
    console.log(`Auto ID ${i + 1} registration for wallet ${wallet.address} successful`)
  }
  return results
}

async function main() {
  if (process.argv.length !== 4) {
    console.error('Usage: yarn ts-node registerAutoIds.ts <wallet_uris_file> <auto_ids_per_wallet>')
    process.exit(1)
  }

  const walletUrisFile = process.argv[2]
  const autoIdsPerWallet = parseInt(process.argv[3])

  if (isNaN(autoIdsPerWallet) || autoIdsPerWallet <= 0) {
    console.error('Please provide a valid positive number for auto IDs per wallet.')
    process.exit(1)
  }

  await cryptoWaitReady()

  const { RPC_URL } = loadEnv()

  const keyring = new Keyring({ type: 'sr25519' })

  const provider = new WsProvider(RPC_URL)
  const api = await ApiPromise.create({ provider })

  const walletUris = (await fs.readFile(walletUrisFile, 'utf-8'))
    .split('\n')
    .filter((uri) => uri.trim() !== '')
  const wallets = walletUris.map((uri) => keyring.addFromUri(uri))

  const results = await Promise.all(
    wallets.map((wallet) => {
      const registry = new Registry(RPC_URL!, wallet)
      return registerAutoIdsForWallet(wallet, registry, autoIdsPerWallet)
    }),
  )

  console.log('All Auto IDs registered:', results.flat().filter(Boolean).length)

  await api.disconnect()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
