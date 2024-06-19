import { address, balance, transfer } from '@autonomys/auto-consensus'
import { setup } from './utils/setup'

const main = async () => {
  const { api, alice, bob } = await setup()

  // Alice's Addresses
  const aliceAddress = address(alice[0].address)
  console.log('\x1b[32m%s\x1b[0m', 'Alice Clean Address:', aliceAddress)

  // Bob's Addresses
  const bobAddress = address(bob[0].address)
  console.log('\x1b[32m%s\x1b[0m', 'Bob Clean Address:', bobAddress, '\n')

  // Initial Balances
  const initialAliceBalance = await balance(api, aliceAddress)
  console.log(
    '\x1b[36m%s\x1b[0m',
    'Alice Initial Balance:',
    initialAliceBalance.free.toString(),
    '\x1b[36m',
    'ATC',
    '\x1b[0m',
  )
  const initialBobBalance = await balance(api, bobAddress)
  console.log(
    '\x1b[36m%s\x1b[0m',
    'Bob Initial Balance:',
    initialBobBalance.free.toString(),
    '\x1b[36m',
    'ATC',
    '\x1b[0m\n',
  )

  // Transfer 2x10^18 ATC tokens from Alice to Bob
  const transferAmount = BigInt(2 * 10 ** 18)
  const tx = await transfer(api, bob[0].address, transferAmount)

  console.log('\x1b[32m%s\x1b[0m', 'Transaction Prepared! (with hash:', tx.hash.toHex(), ')')
  console.log('\x1b[33m%s\x1b[0m', 'Now broadcasting transaction!\n')

  let txHashHex: string | undefined = undefined
  let blockHash: string | undefined = undefined
  await new Promise<void>((resolve, reject) => {
    tx.signAndSend(alice[0], ({ events, status, txHash }) => {
      if (status.isInBlock) {
        txHashHex = txHash.toHex()
        blockHash = status.asInBlock.toHex()
        console.log('\x1b[32m%s\x1b[0m', 'Successful tx', txHashHex)
        console.log('\x1b[32m%s\x1b[0m', 'In block', blockHash)
        resolve()
      } else if (
        status.isRetracted ||
        status.isFinalityTimeout ||
        status.isDropped ||
        status.isInvalid
      ) {
        console.error('Transaction failed')
        reject(new Error('Transaction failed'))
      }
    })
  })

  // Final Balances
  const finalAliceBalance = await balance(api, aliceAddress)
  console.log(
    '\n\x1b[36m%s\x1b[0m',
    'Alice Final Balance:',
    finalAliceBalance.free.toString(),
    '\x1b[36m',
    'ATC',
    '\x1b[0m',
  )
  const finalBobBalance = await balance(api, bobAddress)
  console.log(
    '\x1b[36m%s\x1b[0m',
    'Bob Final Balance:',
    finalBobBalance.free.toString(),
    '\x1b[36m',
    'ATC',
    '\x1b[0m\n',
  )
}

main()
  .then(() => {
    console.log('\x1b[34m%s\x1b[0m', 'Script executed successfully')
    process.exit(0)
  })
  .catch((e) => {
    console.error('\x1b[31m%s\x1b[0m', 'Error with script:', e)
    process.exit(1)
  })
