import { address, balance, totalIssuance } from '@autonomys/auto-consensus'
import { ActivateWalletInput, activateWallet, getMockWallet } from '@autonomys/auto-utils'
import { setup } from './helpers'

describe('Verify balances functions', () => {
  const { isLocalhost, TEST_NETWORK, TEST_MNEMONIC, TEST_ADDRESS, wallets } = setup()

  const alice = getMockWallet('Alice', wallets)

  describe('Test totalIssuance()', () => {
    test('Check totalIssuance return a number greater than zero', async () => {
      // totalIssuance is an async function that returns a hex number as a string
      const rawIssuance = await totalIssuance()
      // Convert the hex number to a BigInt
      const issuance = BigInt(rawIssuance.toString())
      // Check if the issuance is greater than zero
      expect(issuance).toBeGreaterThan(BigInt(0))
    })
  })

  describe('Test balance()', () => {
    test('Check balance of Test wallet is 0', async () => {
      const { api, accounts } = await activateWallet({
        ...TEST_NETWORK,
        mnemonic: TEST_MNEMONIC,
      } as ActivateWalletInput)
      expect(accounts.length).toBeGreaterThan(0)
      expect(accounts[0].address).toEqual(TEST_ADDRESS)

      const _balance = await balance(api, address(accounts[0].address))
      expect(_balance.free).toEqual(BigInt(0))
    })

    if (isLocalhost) {
      test('Check balance of Alice wallet is greater than 0', async () => {
        const _balance = await balance(alice.api, address(alice.accounts[0].address))
        expect(_balance.free).toBeGreaterThan(BigInt(0))
      })
    }
  })
})
