import {
  ActivateWalletParams,
  ApiPromise,
  NetworkParams,
  WalletActivated,
  activate,
  activateWallet,
  address,
  mockWallets,
  networks,
  setupWallet,
} from '@autonomys/auto-utils'

describe('Verify wallet functions', () => {
  const isLocalhost = process.env.LOCALHOST === 'true'

  // Define the test network and its details
  const TEST_NETWORK: NetworkParams = !isLocalhost
    ? { networkId: networks[0].id }
    : { networkId: 'localhost' }
  const TEST_NETWORK_DETAIL = networks.find((network) => network.id === TEST_NETWORK.networkId)
  if (!TEST_NETWORK_DETAIL) throw new Error(`Network with id ${TEST_NETWORK.networkId} not found`)

  const TEST_MNEMONIC = 'test test test test test test test test test test test junk'
  const TEST_ADDRESS = '5GmS1wtCfR4tK5SSgnZbVT4kYw5W8NmxmijcsxCQE6oLW6A8'
  const ALICE_URI = '//Alice'
  const BOB_URI = '//Bob'
  let api: ApiPromise
  let wallets: WalletActivated[] = []
  let aliceWallet: WalletActivated['accounts'][0]
  let bobWallet: WalletActivated['accounts'][0]

  beforeAll(async () => {
    api = await activate(TEST_NETWORK)
    wallets = await mockWallets(TEST_NETWORK, api)
    aliceWallet = wallets[0].accounts[0]
    bobWallet = wallets[1].accounts[0]
  }, 30000)

  describe('Test setupWallet()', () => {
    test('Check setupWallet return a pair with matching address and public key when provided with a mnemonic', async () => {
      const wallet = setupWallet({ mnemonic: TEST_MNEMONIC })
      expect(wallet.commonAddress).toEqual(TEST_ADDRESS)
      expect(wallet.address).toEqual(address(TEST_ADDRESS))
    })

    test('Check setupWallet return a pair with matching private key when provided with Alice seed', async () => {
      const wallet = setupWallet({ uri: ALICE_URI })
      expect(wallet.commonAddress).toEqual(aliceWallet.address)
      expect(wallet.address).toEqual(address(aliceWallet.address))
    })

    test('Check setupWallet return a pair with matching private key when provided with Bob seed', async () => {
      const wallet = setupWallet({ uri: BOB_URI })
      expect(wallet.commonAddress).toEqual(bobWallet.address)
      expect(wallet.address).toEqual(address(bobWallet.address))
    })
  })

  describe('Test activateWallet()', () => {
    test('Check activateWallet return an api instance and an account when provided with a test mnemonic', async () => {
      const { api, accounts } = await activateWallet({
        ...TEST_NETWORK,
        mnemonic: TEST_MNEMONIC,
      } as ActivateWalletParams)
      expect(api).toBeDefined()
      expect(accounts.length).toBeGreaterThan(0)
      expect(accounts[0].address).toEqual(TEST_ADDRESS)
    }, 15000)

    test('Check activateWallet return an api instance and an account when provided with Alice uri', async () => {
      const { api, accounts } = await activateWallet({
        ...TEST_NETWORK,
        uri: ALICE_URI,
      } as ActivateWalletParams)
      expect(api).toBeDefined()
      expect(accounts.length).toBeGreaterThan(0)
      expect(accounts[0].address).toEqual(aliceWallet.address)
    }, 15000)

    test('Check activateWallet return an api instance and an account when provided with Bob uri', async () => {
      const { api, accounts } = await activateWallet({
        ...TEST_NETWORK,
        uri: BOB_URI,
      } as ActivateWalletParams)
      expect(api).toBeDefined()
      expect(accounts.length).toBeGreaterThan(0)
      expect(accounts[0].address).toEqual(bobWallet.address)
    }, 15000)
  })
})
