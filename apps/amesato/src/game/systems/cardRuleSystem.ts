import type { CampaignStageNumber, GameRank } from '../core/types'

export const CARD_SCORE_CAP = 25600

export function resolveCardFlipScore(
  stageNumber: CampaignStageNumber,
  rank: GameRank,
  nextCombo: number,
) {
  const sceneIndex = Math.floor((stageNumber - 1) / 5)
  const baseScore = sceneIndex * 100 + 100
  const comboWeight = rank === 'lunatic' ? 35 : 20
  const score = baseScore + nextCombo * nextCombo * comboWeight
  return Math.min(CARD_SCORE_CAP, score)
}
