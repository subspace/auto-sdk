// fundWallets.ts

import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { EventRecord } from '@polkadot/types/interfaces'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { config } from 'dotenv'
import fs from 'fs/promises'

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

function tokensToBaseUnits(tokens: number): bigint {
  const baseUnits = Math.round(tokens * 10 ** 18)
  return BigInt(baseUnits.toString())
}

async function distributeFunds(
  api: ApiPromise,
  from: KeyringPair,
  to: KeyringPair[],
  tokens: number,
): Promise<void> {
  const amountInBaseUnits = tokensToBaseUnits(tokens)

  if (api.tx.utility && api.tx.utility.batchAll) {
    const transfers = to.map((recipient) =>
      api.tx.balances.transferKeepAlive(recipient.address, amountInBaseUnits.toString()),
    )
    const batchTx = api.tx.utility.batchAll(transfers)

    await new Promise<void>((resolve, reject) => {
      batchTx
        .signAndSend(from, { nonce: -1 }, ({ status, events }) => {
          if (status.isInBlock || status.isFinalized) {
            console.log(`Batch transaction included in block ${status.asInBlock}`)
            resolve()
          } else if (status.isDropped || status.isInvalid) {
            reject(new Error(`Transaction dropped or invalid`))
          }
        })
        .catch(reject)
    })
  } else {
    let nonce = (await api.rpc.system.accountNextIndex(from.address)).toBigInt()

    await Promise.all(
      to.map(async (recipient) => {
        const transfer = api.tx.balances.transferKeepAlive(
          recipient.address,
          amountInBaseUnits.toString(),
        )

        await new Promise<void>((resolve, reject) => {
          transfer
            .signAndSend(from, { nonce: nonce++ }, ({ status, events }) => {
              if (status.isInBlock || status.isFinalized) {
                console.log(`Transaction included in block ${status.asInBlock}`)
                events.forEach(({ event: { method, section } }: EventRecord) => {
                  if (section === 'system' && method === 'ExtrinsicSuccess') {
                    console.log(
                      `Distributed ${tokens} tokens (${amountInBaseUnits} base units) to ${recipient.address}`,
                    )
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
      }),
    )
  }

  console.log(`Completed distribution to ${to.length} wallets`)
}

async function main() {
  if (process.argv.length !== 4) {
    console.error('Usage: yarn ts-node fundWallets.ts <wallet_uris_file> <tokens_to_distribute>')
    process.exit(1)
  }

  const walletUrisFile = process.argv[2]
  const tokensToDistribute = parseFloat(process.argv[3])

  if (isNaN(tokensToDistribute) || tokensToDistribute <= 0) {
    console.error('Please provide a valid positive number for tokens to distribute.')
    process.exit(1)
  }

  await cryptoWaitReady()

  const { RPC_URL, KEYPAIR_URI } = loadEnv()

  const keyring = new Keyring({ type: 'sr25519' })
  const issuer = keyring.addFromUri(KEYPAIR_URI)

  const provider = new WsProvider(RPC_URL)
  const api = await ApiPromise.create({ provider })

  const walletUris = (await fs.readFile(walletUrisFile, 'utf-8'))
    .split('\n')
    .filter((uri) => uri.trim() !== '')
  const wallets = walletUris.map((uri) => keyring.addFromUri(uri))

  await distributeFunds(api, issuer, wallets, tokensToDistribute)

  await api.disconnect()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
