import { resolveOptionalAudioAsset } from '../../../../../audio/viteManifest'

const sfxAssets = import.meta.glob('../../assets/audio/sfx/*', {
  eager: true,
  import: 'default',
}) as Record<string, string>

export const sfxManifest = {
  shot: resolveOptionalAudioAsset(sfxAssets, '../../assets/audio/sfx', 'shot'),
  flip: resolveOptionalAudioAsset(sfxAssets, '../../assets/audio/sfx', 'flip'),
  item: resolveOptionalAudioAsset(sfxAssets, '../../assets/audio/sfx', 'item'),
  bossHit: resolveOptionalAudioAsset(sfxAssets, '../../assets/audio/sfx', 'boss-hit'),
  bombStart: resolveOptionalAudioAsset(sfxAssets, '../../assets/audio/sfx', 'bomb-start'),
  bombPulse: resolveOptionalAudioAsset(sfxAssets, '../../assets/audio/sfx', 'bomb-pulse'),
  extend: resolveOptionalAudioAsset(sfxAssets, '../../assets/audio/sfx', 'extend'),
} as const

export type SfxId = keyof typeof sfxManifest
