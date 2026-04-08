import { decodeDeckCode, encodeV2FromCounts } from '../../shared/deck-codec'

declare global {
  interface Window {
    BP_DECK_CODEC?: {
      encodeV2FromCounts: typeof encodeV2FromCounts
      decodeDeckCode: typeof decodeDeckCode
    }
  }
}

globalThis.BP_DECK_CODEC = {
  encodeV2FromCounts,
  decodeDeckCode,
}
