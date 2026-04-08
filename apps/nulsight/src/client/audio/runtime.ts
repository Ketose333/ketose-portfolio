import { AudioManager } from '../../../../../audio/AudioManager'
import {
  nulsightBgmManifest,
  nulsightSfxManifest,
  type NulsightBgmId,
  type NulsightSfxId,
} from './manifest'

export function createNulsightAudio() {
  return new AudioManager<NulsightBgmId, NulsightSfxId>(nulsightBgmManifest, nulsightSfxManifest)
}

declare global {
  interface Window {
    createNulsightAudio?: typeof createNulsightAudio
  }
}

if (typeof window !== 'undefined') {
  window.createNulsightAudio = createNulsightAudio
}
