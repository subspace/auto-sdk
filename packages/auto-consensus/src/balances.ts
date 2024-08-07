// file: src/balances.ts

import type { Api, BN } from '@autonomys/auto-utils'
import { activate } from '@autonomys/auto-utils'

type RawBalanceData = {
  free: BN
  reserved: BN
  frozen: BN
  flags: BN
}
type BalanceData = {
  free: bigint
  reserved: bigint
  frozen: bigint
}

export const totalIssuance = async (networkId?: string) => {
  // Get the api instance for the network
  const api = await activate({ networkId })

  // Get the current total token issuance
  const totalIssuance = await api.query.balances.totalIssuance()

  return totalIssuance
}

export const balance = async (api: Api, address: string): Promise<BalanceData> => {
  // Query the balance of the address and parse the data
  try {
    const rawBalance = await api.query.system.account(address)

    const { data } = rawBalance as unknown as { data: RawBalanceData }

    return {
      free: BigInt(data.free.toString()),
      reserved: BigInt(data.reserved.toString()),
      frozen: BigInt(data.frozen.toString()),
    }
  } catch (error) {
    console.log('error', error)
    throw new Error('Error getting balance' + error)
  }
}
