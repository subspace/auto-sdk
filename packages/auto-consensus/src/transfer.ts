// file: src/transfer.ts

import type { ApiPromise } from '@autonomys/auto-utils'

export type Amount = BigInt | number | string

export const transfer = async (
  api: ApiPromise,
  receiver: string,
  amount: Amount,
  allowDeath?: boolean,
) => {
  // Transfer the tokens
  return !allowDeath
    ? api.tx.balances.transferKeepAlive(receiver, amount)
    : api.tx.balances.transferAllowDeath(receiver, amount)
}

export const transferAll = async (
  api: ApiPromise,
  receiver: string,
  keepAlive: boolean = false,
) => {
  // Transfer all the tokens
  return api.tx.balances.transferAll(receiver, keepAlive)
}
