import { resolveOptionalStaticAsset, resolveStaticAsset } from '../../../../../audio/staticManifest'

export const nulsightBgmManifest = {
  title: resolveStaticAsset('/audio/bgm/title.ogg'),
  lobby: resolveStaticAsset('/audio/bgm/lobby.ogg'),
  game: resolveStaticAsset('/audio/bgm/game.ogg'),
  guide: resolveStaticAsset('/audio/bgm/guide.ogg'),
  deck: resolveStaticAsset('/audio/bgm/deck.ogg'),
  deckHub: resolveStaticAsset('/audio/bgm/deck-hub.ogg'),
} as const

export const nulsightSfxManifest = {
  click: resolveOptionalStaticAsset('/audio/sfx/click.ogg'),
  confirm: resolveOptionalStaticAsset('/audio/sfx/confirm.ogg'),
  draw: resolveOptionalStaticAsset('/audio/sfx/draw.ogg'),
  summon: resolveOptionalStaticAsset('/audio/sfx/summon.ogg'),
  attack: resolveOptionalStaticAsset('/audio/sfx/attack.ogg'),
  damage: resolveOptionalStaticAsset('/audio/sfx/damage.ogg'),
} as const

export type NulsightBgmId = keyof typeof nulsightBgmManifest
export type NulsightSfxId = keyof typeof nulsightSfxManifest
