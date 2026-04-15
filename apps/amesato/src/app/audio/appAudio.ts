import { AudioManager } from '../../../../../audio/AudioManager'
import { bgmManifest, type BgmTrackId } from './audioManifest'
import { sfxManifest, type SfxId } from './sfxManifest'

export const appAudio = new AudioManager<BgmTrackId, SfxId>(bgmManifest, sfxManifest)
