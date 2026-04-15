import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  initialHudSnapshot,
  type GameHudSnapshot,
  type GameOverlaySnapshot,
  type GameStatus,
} from '../../game/ui/GameHudSnapshot'

interface GameSessionState extends GameHudSnapshot {
  sessionKey: string | null
  resetSession: (sessionKey?: string | null) => void
  syncSnapshot: (snapshot: GameHudSnapshot, sessionKey: string) => void
  setStatus: (status: GameStatus, message?: string) => void
  getRestorableSnapshot: (sessionKey: string) => GameHudSnapshot | null
}

const STORAGE_KEY = 'amesato-game-session'

function isRestorableSnapshot(snapshot: GameHudSnapshot) {
  return (
    snapshot.status !== initialHudSnapshot.status ||
    snapshot.message !== initialHudSnapshot.message ||
    snapshot.arenaKind !== initialHudSnapshot.arenaKind ||
    snapshot.currentRoute !== initialHudSnapshot.currentRoute ||
    snapshot.score !== initialHudSnapshot.score ||
    snapshot.lives !== initialHudSnapshot.lives ||
    snapshot.bombs !== initialHudSnapshot.bombs ||
    snapshot.campaignStageNumber !== initialHudSnapshot.campaignStageNumber ||
    snapshot.enemyHealth !== initialHudSnapshot.enemyHealth ||
    snapshot.enemyMaxHealth !== initialHudSnapshot.enemyMaxHealth ||
    snapshot.elapsedSeconds !== initialHudSnapshot.elapsedSeconds ||
    snapshot.shotsFired !== initialHudSnapshot.shotsFired ||
    snapshot.cardCombo !== initialHudSnapshot.cardCombo ||
    snapshot.phaseLabel !== initialHudSnapshot.phaseLabel ||
    snapshot.basicProgress !== initialHudSnapshot.basicProgress ||
    snapshot.awaitingStageStart !== initialHudSnapshot.awaitingStageStart ||
    snapshot.rewardFlipCycle !== initialHudSnapshot.rewardFlipCycle ||
    snapshot.pointValue !== initialHudSnapshot.pointValue ||
    snapshot.pelletSpeedBonus !== initialHudSnapshot.pelletSpeedBonus ||
    snapshot.sceneStartScore !== initialHudSnapshot.sceneStartScore ||
    snapshot.sceneStartElapsedSeconds !== initialHudSnapshot.sceneStartElapsedSeconds ||
    snapshot.sceneMaxCombo !== initialHudSnapshot.sceneMaxCombo ||
    snapshot.stageStartElapsedSeconds !== initialHudSnapshot.stageStartElapsedSeconds ||
    snapshot.stageMaxCombo !== initialHudSnapshot.stageMaxCombo ||
    JSON.stringify(snapshot.sceneContinueCounts) !== JSON.stringify(initialHudSnapshot.sceneContinueCounts) ||
    snapshot.totalContinues !== initialHudSnapshot.totalContinues ||
    !overlayEquals(snapshot.overlay, initialHudSnapshot.overlay)
  )
}

function toSnapshot(state: GameSessionState): GameHudSnapshot {
  return {
    status: state.status,
    message: state.message,
    arenaKind: state.arenaKind,
    currentRoute: state.currentRoute,
    score: state.score,
    lives: state.lives,
    bombs: state.bombs,
    campaignStageNumber: state.campaignStageNumber,
    enemyHealth: state.enemyHealth,
    enemyMaxHealth: state.enemyMaxHealth,
    elapsedSeconds: state.elapsedSeconds,
    shotsFired: state.shotsFired,
    cardCombo: state.cardCombo,
    phaseLabel: state.phaseLabel,
    basicProgress: state.basicProgress,
    awaitingStageStart: state.awaitingStageStart,
    rewardFlipCycle: state.rewardFlipCycle,
    pointValue: state.pointValue,
    pelletSpeedBonus: state.pelletSpeedBonus,
    sceneStartScore: state.sceneStartScore,
    sceneStartElapsedSeconds: state.sceneStartElapsedSeconds,
    sceneMaxCombo: state.sceneMaxCombo,
    stageStartElapsedSeconds: state.stageStartElapsedSeconds,
    stageMaxCombo: state.stageMaxCombo,
    sceneContinueCounts: state.sceneContinueCounts,
    totalContinues: state.totalContinues,
    overlay: state.overlay,
  }
}

export const useGameSessionStore = create<GameSessionState>()(
  persist(
    (set, get) => ({
      sessionKey: null,
      ...initialHudSnapshot,
      resetSession: (sessionKey = null) =>
        set({
          sessionKey,
          ...initialHudSnapshot,
        }),
      syncSnapshot: (snapshot, sessionKey) =>
        set((state) => {
          const unchanged =
            state.sessionKey === sessionKey &&
            state.status === snapshot.status &&
            state.message === snapshot.message &&
            state.arenaKind === snapshot.arenaKind &&
            state.currentRoute === snapshot.currentRoute &&
            state.score === snapshot.score &&
            state.lives === snapshot.lives &&
            state.bombs === snapshot.bombs &&
            state.campaignStageNumber === snapshot.campaignStageNumber &&
            state.enemyHealth === snapshot.enemyHealth &&
            state.enemyMaxHealth === snapshot.enemyMaxHealth &&
            state.elapsedSeconds === snapshot.elapsedSeconds &&
            state.shotsFired === snapshot.shotsFired &&
            state.cardCombo === snapshot.cardCombo &&
            state.phaseLabel === snapshot.phaseLabel &&
            state.basicProgress === snapshot.basicProgress &&
            state.awaitingStageStart === snapshot.awaitingStageStart &&
            state.rewardFlipCycle === snapshot.rewardFlipCycle &&
            state.pointValue === snapshot.pointValue &&
            state.pelletSpeedBonus === snapshot.pelletSpeedBonus &&
            state.sceneStartScore === snapshot.sceneStartScore &&
            state.sceneStartElapsedSeconds === snapshot.sceneStartElapsedSeconds &&
            state.sceneMaxCombo === snapshot.sceneMaxCombo &&
            state.stageStartElapsedSeconds === snapshot.stageStartElapsedSeconds &&
            state.stageMaxCombo === snapshot.stageMaxCombo &&
            JSON.stringify(state.sceneContinueCounts) === JSON.stringify(snapshot.sceneContinueCounts) &&
            state.totalContinues === snapshot.totalContinues &&
            overlayEquals(state.overlay, snapshot.overlay)

          return unchanged ? state : { ...state, sessionKey, ...snapshot }
        }),
      setStatus: (status, message) =>
        set((state) => ({
          ...state,
          status,
          message: message ?? state.message,
        })),
      getRestorableSnapshot: (sessionKey) => {
        const snapshot = toSnapshot(get())
        return get().sessionKey === sessionKey && isRestorableSnapshot(snapshot) ? snapshot : null
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessionKey: state.sessionKey,
        ...toSnapshot(state),
      }),
    },
  ),
)

function overlayEquals(left: GameOverlaySnapshot, right: GameOverlaySnapshot) {
  return (
    left.kind === right.kind &&
    left.stateKey === right.stateKey &&
    left.title === right.title &&
    left.subtitle === right.subtitle &&
    left.body === right.body &&
    left.prompt === right.prompt &&
    left.speaker === right.speaker &&
    JSON.stringify(left.choices) === JSON.stringify(right.choices) &&
    JSON.stringify(left.stats) === JSON.stringify(right.stats)
  )
}
