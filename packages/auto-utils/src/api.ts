import { ApiPromise, WsProvider } from '@polkadot/api'
import { getNetworkDomainRpcUrls, getNetworkRpcUrls } from './network'
import type { ActivateParams, ApiOptions, DomainParams, NetworkParams } from './types/network'

export const createConnection = async (
  endpoint: string,
  options?: ApiOptions,
): Promise<ApiPromise> => {
  // Create the provider
  const provider = new WsProvider(endpoint)
  // Create the API instance
  const api = await ApiPromise.create({
    ...options,
    noInitWarn: options?.noInitWarn ?? true,
    provider,
  })
  await api.isReady

  return api
}

export const activate = async (params?: ActivateParams<NetworkParams>): Promise<ApiPromise> => {
  // Get the first rpc urls for the network
  const endpoint = getNetworkRpcUrls(params)
  // Remove the networkId from the input
  if (params) delete params.networkId

  return await createConnection(endpoint[0], params)
}

export const activateDomain = async (params: ActivateParams<DomainParams>): Promise<ApiPromise> => {
  // Get the first rpc urls for the network
  const endpoint = getNetworkDomainRpcUrls(params)
  // Remove the domainId from the input
  const { domainId, ...rest } = params

  return await createConnection(endpoint[0], rest)
}

export const disconnect = async (api: ApiPromise): Promise<void> => {
  // Disconnect the API instance and the provider
  await api.disconnect()
}
