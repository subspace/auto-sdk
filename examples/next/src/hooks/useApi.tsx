import { activate } from '@autonomys/auto-utils'
import type { ApiPromise } from '@polkadot/api'
import { useCallback, useEffect, useState } from 'react'
import { useNetwork } from './useNetwork'

export const useApi = () => {
  const { config } = useNetwork()
  const [api, setApi] = useState<ApiPromise | null>(null)

  const handleLoadApi = useCallback(async () => setApi(await activate(config)), [])

  const handleQuery = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (query: any, setValue: (value: any) => void, setErrorForm?: (error: string) => void) => {
      setErrorForm && setErrorForm('')
      try {
        if (!api) {
          setErrorForm && setErrorForm('API not loaded')
          await handleLoadApi()
          return
        }

        if (!query) {
          setErrorForm && setErrorForm('Error no query')
          return
        }

        setValue(query)

        return query
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setErrorForm && setErrorForm((error as any).message)
      }
    },
    [api],
  )

  const handleRefreshNetwork = useCallback(async () => {
    if (api) {
      await api.disconnect()
      await handleLoadApi()
    }
  }, [config, api, handleLoadApi])

  useEffect(() => {
    if (api === null) handleLoadApi()
  }, [handleLoadApi, api])

  useEffect(() => {
    handleRefreshNetwork()
  }, [config])

  return { handleLoadApi, handleQuery, api }
}
