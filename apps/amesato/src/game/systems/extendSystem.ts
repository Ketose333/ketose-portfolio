export const SCORE_PER_EXTEND = 400000
export const MAX_LIVES = 6

export interface ExtendState {
  score: number
  lives: number
  nextExtend: number
}

export function createExtendState(score: number, lives: number): ExtendState {
  return {
    score: Math.max(0, score),
    lives: clampLifeCount(lives),
    nextExtend: resolveNextExtendIndex(score),
  }
}

export function applyScore(extend: ExtendState, amount: number) {
  if (amount <= 0) {
    return false
  }

  extend.score += amount
  let gainedLife = false

  while (extend.score >= extend.nextExtend * SCORE_PER_EXTEND) {
    if (extend.lives < MAX_LIVES) {
      extend.lives += 1
      gainedLife = true
    }
    extend.nextExtend += 1
  }

  return gainedLife
}

export function syncExtendState(extend: ExtendState, score: number, lives: number) {
  extend.score = Math.max(0, score)
  extend.lives = clampLifeCount(lives)
  extend.nextExtend = resolveNextExtendIndex(score)
}

function resolveNextExtendIndex(score: number) {
  return Math.floor(Math.max(0, score) / SCORE_PER_EXTEND) + 1
}

function clampLifeCount(lives: number) {
  return Math.min(MAX_LIVES, Math.max(0, lives))
}
