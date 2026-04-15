import { resolveRequiredAudioAsset } from '../../../../../audio/viteManifest'

const audioAssets = import.meta.glob('../../assets/audio/bgm/*', {
  eager: true,
  import: 'default',
}) as Record<string, string>

export const bgmManifest = {
  title: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'title'),
  stageScene1: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'stage1'),
  stageScene2RouteA: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'stage2a'),
  stageScene2RouteB: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'stage2b'),
  stageScene3RouteA: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'stage3a'),
  stageScene3RouteB: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'stage3b'),
  stageScene4RouteA: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'stage4a'),
  stageScene4RouteB: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'stage4b'),
  bossScene1: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'boss1'),
  bossScene2RouteA: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'boss2a'),
  bossScene2RouteB: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'boss2b'),
  bossScene3RouteA: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'boss3a'),
  bossScene3RouteB: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'boss3b'),
  bossScene4RouteA: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'boss4a'),
  bossScene4RouteB: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'boss4b'),
  ending: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'ending'),
  gameover: resolveRequiredAudioAsset(audioAssets, '../../assets/audio/bgm', 'gameover'),
} as const

export type BgmTrackId = keyof typeof bgmManifest
