// file: src/staking.ts

import type { ApiPromise } from '@autonomys/auto-utils'
import { createAccountIdType, signingKey } from '@autonomys/auto-utils'
import type {
  NominateOperatorParams,
  RegisterOperatorParams,
  StakingParams,
  StringNumberOrBigInt,
  WithdrawStakeParams,
} from './types/staking'
import {
  parseDeposit,
  parseOperator,
  parseOperatorDetails,
  parseString,
  parseWithdrawal,
} from './utils/parse'

export const operators = async (api: ApiPromise) => {
  try {
    const _operators = await api.query.domains.operators.entries()
    return _operators.map((o) => parseOperator(o))
  } catch (error) {
    console.error('error', error)
    throw new Error('Error querying operators list.' + error)
  }
}

export const operator = async (api: ApiPromise, operatorId: StringNumberOrBigInt) => {
  try {
    const _operator = await api.query.domains.operators(parseString(operatorId))
    return parseOperatorDetails(_operator)
  } catch (error) {
    console.error('error', error)
    throw new Error(`Error querying operatorId: ${operatorId} with error: ${error}`)
  }
}

export const deposits = async (
  api: ApiPromise,
  operatorId: StringNumberOrBigInt,
  account: string | undefined = undefined,
) => {
  try {
    const _deposits = await api.query.domains.deposits.entries(parseString(operatorId), account)
    return _deposits.map((o) => parseDeposit(o))
  } catch (error) {
    console.error('error', error)
    throw new Error('Error querying deposits list.' + error)
  }
}

export const withdrawals = async (
  api: ApiPromise,
  operatorId: StringNumberOrBigInt,
  account: string | undefined = undefined,
) => {
  try {
    const _withdrawals = await api.query.domains.withdrawals.entries(
      parseString(operatorId),
      account,
    )
    return _withdrawals.map((o) => parseWithdrawal(o))
  } catch (error) {
    console.error('error', error)
    throw new Error('Error querying withdrawals list.' + error)
  }
}

export const registerOperator = (params: RegisterOperatorParams) => {
  try {
    const {
      api,
      senderAddress,
      Operator,
      domainId,
      amountToStake,
      minimumNominatorStake,
      nominationTax,
    } = params

    const message = createAccountIdType(api, senderAddress)
    const signature = Operator.sign(message)

    return api.tx.domains.registerOperator(
      parseString(domainId),
      parseString(amountToStake),
      {
        signingKey: signingKey(Operator.publicKey),
        minimumNominatorStake: parseString(minimumNominatorStake),
        nominationTax: parseString(nominationTax),
      },
      signature,
    )
  } catch (error) {
    console.error('error', error)
    throw new Error('Error creating register operator tx.' + error)
  }
}

export const nominateOperator = (params: NominateOperatorParams) => {
  try {
    const { api, operatorId, amountToStake } = params

    return api.tx.domains.nominateOperator(parseString(operatorId), parseString(amountToStake))
  } catch (error) {
    console.error('error', error)
    throw new Error('Error creating nominate operator tx.' + error)
  }
}

export const withdrawStake = (params: WithdrawStakeParams) => {
  try {
    const { api, operatorId, shares } = params

    return api.tx.domains.withdrawStake(parseString(operatorId), parseString(shares))
  } catch (error) {
    console.error('error', error)
    throw new Error('Error creating withdraw stake tx.' + error)
  }
}

export const deregisterOperator = (params: StakingParams) => {
  try {
    const { api, operatorId } = params

    return api.tx.domains.deregisterOperator(parseString(operatorId))
  } catch (error) {
    console.error('error', error)
    throw new Error('Error creating de-register operator tx.' + error)
  }
}

export const unlockFunds = (params: StakingParams) => {
  try {
    const { api, operatorId } = params

    return api.tx.domains.unlockFunds(parseString(operatorId))
  } catch (error) {
    console.error('error', error)
    throw new Error('Error creating unlock funds tx.' + error)
  }
}

export const unlockNominator = (params: StakingParams) => {
  try {
    const { api, operatorId } = params

    return api.tx.domains.unlockNominator(parseString(operatorId))
  } catch (error) {
    console.error('error', error)
    throw new Error('Error creating unlock nominator tx.' + error)
  }
}
