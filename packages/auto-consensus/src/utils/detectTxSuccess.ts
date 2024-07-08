// file: src/utils/detectTxSuccess.ts

import type { EventRecord } from '@autonomys/auto-utils'
import { expectSuccessfulTxEvent } from './events'

export const detectTxSuccess = (events: EventRecord[]): boolean => {
  events.forEach(({ event: { method, section } }) => {
    if (expectSuccessfulTxEvent.indexOf(`${section}.${method}`) > -1) return true
  })

  return false
}
