// file: src/types/network.ts
import type { ApiOptions } from '@polkadot/api/types'
import type { NetworkDomains } from './domain'
import { Token } from './token'

export type Explorer = {
  name: string
  url: string
}

export type Network = {
  id: string
  name: string
  rpcUrls: string[]
  explorer: Explorer[]
  domains: NetworkDomains[]
  token: Token
  isTestnet?: boolean
  isLocalhost?: boolean
}

export type NetworkParams = { networkId?: string } | undefined

export type DomainParams = {
  networkId?: string
  domainId: string
}

export type ActivateParams<T> = T & ApiOptions

export type { ApiOptions }
