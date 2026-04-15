import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { routeKeys, type GameRank, type GameRoute, type StageMode } from '../../game/core/types'
import { routeCycleOrder } from '../../content/terminology'

interface HighScoreEntry {
  name: string
  score: number
  updatedAt: string
}

interface BootConfigState {
  rank: GameRank
  route: GameRoute
  stageMode: StageMode
  bgmEnabled: boolean
  startLives: number
  highScores: Record<GameRank, HighScoreEntry>
  pendingScoreRank: GameRank | null
  setRank: (rank: GameRank) => void
  cycleRank: (direction: 1 | -1) => void
  setRoute: (route: GameRoute) => void
  cycleRoute: () => void
  setStageMode: (stageMode: StageMode) => void
  toggleBgmEnabled: () => void
  cycleStartLives: (direction: 1 | -1) => void
  recordScore: (rank: GameRank, score: number) => void
  updateScoreName: (rank: GameRank, name: string) => void
  clearPendingScoreRank: () => void
}

interface PersistedBootConfigState {
  rank?: GameRank
  route?: GameRoute
  stageMode?: StageMode
  bgmEnabled?: boolean
  startLives?: number
  highScores?: Partial<Record<GameRank, Partial<HighScoreEntry>>>
  pendingScoreRank?: GameRank | null
}

const ranks: GameRank[] = ['easy', 'normal', 'hard', 'lunatic']
const DEFAULT_SCORE_NAME = 'PLAYER'
const START_LIVES_MIN = 3
const START_LIVES_MAX = 7

const seededScores: Record<GameRank, HighScoreEntry> = {
  easy: { name: DEFAULT_SCORE_NAME, score: 1000, updatedAt: 'TH01' },
  normal: { name: DEFAULT_SCORE_NAME, score: 2000, updatedAt: 'TH01' },
  hard: { name: DEFAULT_SCORE_NAME, score: 3000, updatedAt: 'TH01' },
  lunatic: { name: DEFAULT_SCORE_NAME, score: 4000, updatedAt: 'TH01' },
}

export const useBootConfigStore = create<BootConfigState>()(
  persist(
    (set) => ({
      rank: 'normal',
      route: routeCycleOrder[0],
      stageMode: 'arcade',
      bgmEnabled: true,
      startLives: 3,
      highScores: seededScores,
      pendingScoreRank: null,
      setRank: (rank) => set({ rank }),
      cycleRank: (direction) =>
        set((state) => {
          const currentIndex = ranks.indexOf(state.rank)
          const nextIndex = (currentIndex + direction + ranks.length) % ranks.length
          return { rank: ranks[nextIndex] }
        }),
      setRoute: (route) => set({ route }),
      cycleRoute: () =>
        set((state) => {
          const currentIndex = routeCycleOrder.indexOf(state.route)
          const nextIndex = (currentIndex + 1) % routeCycleOrder.length
          return { route: routeCycleOrder[nextIndex] }
        }),
      setStageMode: (stageMode) => set({ stageMode }),
      toggleBgmEnabled: () =>
        set((state) => ({
          bgmEnabled: !state.bgmEnabled,
        })),
      cycleStartLives: (direction) =>
        set((state) => ({
          startLives: clamp(state.startLives + direction, START_LIVES_MIN, START_LIVES_MAX),
        })),
      recordScore: (rank, score) =>
        set((state) => {
          if (score <= state.highScores[rank].score) {
            return state
          }

          return {
            highScores: {
              ...state.highScores,
              [rank]: {
                name: state.highScores[rank].name || DEFAULT_SCORE_NAME,
                score,
                updatedAt: new Date().toISOString(),
              },
            },
            pendingScoreRank: rank,
          }
        }),
      updateScoreName: (rank, name) =>
        set((state) => ({
          highScores: {
            ...state.highScores,
            [rank]: {
              ...state.highScores[rank],
              name: normalizeScoreName(name),
            },
          },
        })),
      clearPendingScoreRank: () => set({ pendingScoreRank: null }),
    }),
    {
      name: 'amesato-boot-config',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        rank: state.rank,
        route: state.route,
        stageMode: state.stageMode,
        bgmEnabled: state.bgmEnabled,
        startLives: state.startLives,
        highScores: state.highScores,
        pendingScoreRank: state.pendingScoreRank,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as PersistedBootConfigState
        return {
          ...currentState,
          rank: isRank(persisted.rank) ? persisted.rank : currentState.rank,
          route: isRoute(persisted.route) ? persisted.route : currentState.route,
          stageMode: isStageMode(persisted.stageMode) ? persisted.stageMode : currentState.stageMode,
          bgmEnabled:
            typeof persisted.bgmEnabled === 'boolean'
              ? persisted.bgmEnabled
              : currentState.bgmEnabled,
          startLives: normalizeStartLives(persisted.startLives),
          highScores: normalizeHighScores(persisted.highScores),
          pendingScoreRank: isRank(persisted.pendingScoreRank) ? persisted.pendingScoreRank : null,
        }
      },
    },
  ),
)

function normalizeHighScores(
  partial: Partial<Record<GameRank, Partial<HighScoreEntry>>> | undefined,
): Record<GameRank, HighScoreEntry> {
  return Object.fromEntries(
    ranks.map((rank) => {
      const persisted = partial?.[rank]
      return [
        rank,
        {
          name: normalizeScoreName(persisted?.name ?? seededScores[rank].name),
          score: typeof persisted?.score === 'number' ? persisted.score : seededScores[rank].score,
          updatedAt:
            typeof persisted?.updatedAt === 'string'
              ? persisted.updatedAt
              : seededScores[rank].updatedAt,
        },
      ]
    }),
  ) as Record<GameRank, HighScoreEntry>
}

function normalizeScoreName(value: string) {
  const trimmed = value.trim().slice(0, 12)
  return trimmed.length > 0 ? trimmed.toUpperCase() : DEFAULT_SCORE_NAME
}

function isRank(value: string | null | undefined): value is GameRank {
  return value === 'easy' || value === 'normal' || value === 'hard' || value === 'lunatic'
}

function isRoute(value: string | null | undefined): value is GameRoute {
  return value !== null && value !== undefined && routeKeys.includes(value as GameRoute)
}

function normalizeStartLives(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return START_LIVES_MIN
  }

  return clamp(Math.round(value), START_LIVES_MIN, START_LIVES_MAX)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function isStageMode(value: string | null | undefined): value is StageMode {
  return value === 'arcade' || value === 'basic' || value === 'boss'
}
