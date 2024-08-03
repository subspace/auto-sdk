// file: src/constants/network.ts

import type { Network } from '../types/network'
import { domains } from './domain'
import { TESTNET_TOKEN } from './token'

export enum NetworkId {
  GEMINI_3H = 'gemini-3h',
  DEVNET = 'devnet',
  LOCALHOST = 'localhost',
}

export const ASTRAL_EXPLORER = 'https://explorer.autonomys.xyz/'

export const networks: Network[] = [
  {
    id: NetworkId.GEMINI_3H,
    name: 'Testnet - Gemini 3H',
    rpcUrls: [
      'wss://rpc-0.gemini-3h.subspace.network/ws',
      'wss://rpc-1.gemini-3h.subspace.network/ws',
    ],
    explorer: [
      {
        name: 'Astral',
        url: ASTRAL_EXPLORER + 'gemini-3h/consensus/',
      },
      {
        name: 'Subscan',
        url: 'https://subspace.subscan.io/',
      },
    ],
    domains: [
      {
        ...domains.autoId,
        rpcUrls: ['https://autoid-0.gemini-3h.subspace.network/ws'],
      },
      {
        ...domains.nova,
        rpcUrls: ['https://nova-0.gemini-3h.subspace.network/ws'],
      },
    ],
    token: TESTNET_TOKEN,
    isTestnet: true,
  },
  {
    id: NetworkId.DEVNET,
    name: 'Devnet',
    rpcUrls: ['ws://rpc.devnet.subspace.network/ws'],
    explorer: [
      {
        name: 'Astral',
        url: ASTRAL_EXPLORER + '/devnet/consensus/',
      },
    ],
    domains: [
      {
        ...domains.autoId,
        rpcUrls: ['https://autoid.devnet.subspace.network/ws'],
      },
      {
        ...domains.nova,
        rpcUrls: ['https:///nova.devnet.subspace.network/ws'],
      },
    ],
    token: TESTNET_TOKEN,
    isTestnet: true,
    isLocalhost: false,
  },
  {
    id: NetworkId.LOCALHOST,
    name: 'Localhost',
    rpcUrls: ['ws://127.0.0.1:9944/ws'],
    explorer: [
      {
        name: 'Astral',
        url: ASTRAL_EXPLORER + 'localhost/consensus/',
      },
    ],
    domains: [
      {
        ...domains.autoId,
        rpcUrls: ['ws://127.0.0.1:9945/ws'],
      },
      {
        ...domains.nova,
        rpcUrls: ['https:///127.0.0.1:9946/ws'],
      },
    ],
    token: TESTNET_TOKEN,
    isTestnet: true,
    isLocalhost: true,
  },
]

export const defaultNetwork = networks[0]
