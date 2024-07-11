import { CertificateManager, Registry, generateEd25519KeyPair2 } from '@autonomys/auto-id'
import * as x509 from '@peculiar/x509'
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { EventRecord } from '@polkadot/types/interfaces'
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

async function register(
  certificate: x509.X509Certificate,
  registry: Registry,
  issuerId?: string | null | undefined,
) {
  const { receipt, identifier } = await registry.registerAutoId(certificate, issuerId)
  if (receipt && receipt.isInBlock) {
    console.log(
      `Registration successful with Auto ID identifier: ${identifier} in block #${receipt.blockNumber?.toString()}`,
    )
    return identifier
  } else {
    console.log('Registration failed.')
    return null
  }
}

function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

async function createWallets(n: number, keyring: Keyring): Promise<KeyringPair[]> {
  const wallets: KeyringPair[] = []
  for (let i = 0; i < n; i++) {
    const wallet = keyring.addFromUri(`//${generateRandomString(12)}`)
    wallets.push(wallet)
  }
  return wallets
}

async function distributeFunds(
  api: ApiPromise,
  from: KeyringPair,
  to: KeyringPair[],
  amount: BigInt,
) {
  if (api.tx.utility && api.tx.utility.batchAll) {
    // If batchAll is supported, use it
    const transfers = to.map((recipient) =>
      api.tx.balances.transferKeepAlive(recipient.address, amount.toString()),
    )
    const batchTx = api.tx.utility.batchAll(transfers)
    await batchTx.signAndSend(from)
    console.log(`Distributed ${amount} to ${to.length} wallets using batchAll`)
  } else {
    for (const recipient of to) {
      const transfer = api.tx.balances.transferKeepAlive(recipient.address, amount.toString())

      await new Promise<void>((resolve, reject) => {
        transfer
          .signAndSend(from, ({ status, events }) => {
            if (status.isInBlock || status.isFinalized) {
              console.log(`Transaction included in block ${status.asInBlock}`)
              events.forEach(({ event: { method, section } }: EventRecord) => {
                if (section === 'system' && method === 'ExtrinsicSuccess') {
                  console.log(`Completed distribution to ${recipient.address}`)
                  resolve()
                } else if (section === 'system' && method === 'ExtrinsicFailed') {
                  reject(new Error(`Transaction failed for ${recipient.address}`))
                }
              })
            } else if (status.isDropped || status.isInvalid) {
              reject(new Error(`Transaction dropped or invalid for ${recipient.address}`))
            }
          })
          .catch(reject)
      })
    }
  }
}

async function registerAutoIdsForWallet(
  wallet: KeyringPair,
  registry: Registry,
  numAutoIds: number,
) {
  for (let i = 0; i < numAutoIds; i++) {
    const keys = await generateEd25519KeyPair2()
    const cm = new CertificateManager(null, keys[0], keys[1])
    const randomValue = generateRandomString(10)
    const cert = await cm.selfIssueCertificate(randomValue)

    console.log(`Registering Auto ID ${i + 1}/${numAutoIds} for wallet ${wallet.address}`)
    const autoId = await register(cert, registry)

    if (autoId) {
      console.log(`Auto ID from cert: ${CertificateManager.getCertificateAutoId(cert)}`)
    }

    console.log('---')
  }
}

async function main() {
  if (process.argv.length !== 5) {
    console.error(
      'Usage: yarn ts-node src/loadTestAutoId.ts <number_of_wallets> <amount_to_distribute> <auto_ids_per_wallet>',
    )
    process.exit(1)
  }

  const numWallets = parseInt(process.argv[2])
  const tokensToDistribute = parseFloat(process.argv[3])
  const autoIdsPerWallet = parseInt(process.argv[4])

  if (
    isNaN(numWallets) ||
    isNaN(tokensToDistribute) ||
    isNaN(autoIdsPerWallet) ||
    numWallets <= 0 ||
    tokensToDistribute <= 0 ||
    autoIdsPerWallet <= 0
  ) {
    console.error('Please provide valid positive numbers for all arguments.')
    process.exit(1)
  }

  await cryptoWaitReady()

  const { RPC_URL, KEYPAIR_URI } = loadEnv()

  const keyring = new Keyring({ type: 'sr25519' })
  const issuer = keyring.addFromUri(KEYPAIR_URI)

  const provider = new WsProvider(RPC_URL)
  const api = await ApiPromise.create({ provider })

  const wallets = await createWallets(numWallets, keyring)
  const amountToDistribute = BigInt(Math.round(tokensToDistribute * 10 ** 18))
  await distributeFunds(api, issuer, wallets, amountToDistribute)

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
