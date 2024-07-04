import { balance, events, transfer } from '@autonomys/auto-consensus'
import { address, getMockWallet } from '@autonomys/auto-utils'
import { setup, signAndSendTx } from './helpers'

describe('Verify transfer functions', () => {
  const { isLocalhost, wallets } = setup()

  const alice = getMockWallet('Alice', wallets)
  const bob = getMockWallet('Bob', wallets)

  if (isLocalhost) {
    describe('Test transfer()', () => {
      test('Check transfer 1 ATC between Alice and Bob and check the balance before and after', async () => {
        const sender = alice.accounts[0]

        const _balanceSenderStart = await balance(alice.api, address(sender.address))
        const _balanceReceiverStart = await balance(alice.api, address(bob.accounts[0].address))
        expect(_balanceSenderStart.free).toBeGreaterThan(BigInt(0))

        await signAndSendTx(sender, await transfer(alice.api, bob.accounts[0].address, 1), [
          events.transfer,
        ])

        const _balanceSenderEnd = await balance(alice.api, address(sender.address))
        const _balanceReceiverEnd = await balance(alice.api, address(bob.accounts[0].address))
        expect(_balanceSenderEnd.free).toBeLessThan(_balanceSenderStart.free)
        expect(_balanceReceiverEnd.free).toBeGreaterThan(_balanceReceiverStart.free)
      }, 60000)
    })
  } else {
    test('Transfer test only run on localhost', async () => {
      expect(true).toBeTruthy()
    })
  }
})
