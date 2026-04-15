import type { BgmTrackId } from '../app/audio/audioManifest'
import { getRouteBranchLabel } from './terminology'

export type TitlePanel = 'main' | 'options' | 'music' | 'scoreEntry'

export type TitleMenuAction =
  | 'start-game'
  | 'continue-game'
  | 'open-options'
  | 'open-guide'
  | 'cycle-rank'
  | 'toggle-bgm'
  | 'cycle-start-lives'
  | 'open-music'
  | 'options-back'
  | 'music-back'
  | 'score-entry-back'

export interface TitleMenuEntry {
  id: TitleMenuAction
  label: string
}

export const titleUiText = {
  title: '천리운해록',
  infoLabels: {
    rank: '난이도',
    route: '방향',
    bgm: '배경음',
    startLives: '시작 잔기',
    campaign: '캠페인',
    highScore: '최고 점수',
    continueState: '이어하기',
    activeTrack: '현재 곡',
    scoreName: '등록 이름',
  },
  ranges: {
    campaign: '1 - 20',
  },
  scoreRankLabels: {
    easy: 'easy',
    normal: 'normal',
    hard: 'hard',
    lunatic: 'lunatic',
  },
  continueUnavailable: '이어갈 세션이 없습니다',
  continueReady: '직전 진행을 이어서 시작할 수 있습니다',
  musicTestHint: '곡을 고르면 바로 그 트랙이 재생됩니다.',
  scoreEntryHint: '현재 최고 점수 이름을 12자 이내로 수정할 수 있습니다.',
  scoreEntryPlaceholder: 'PLAYER',
  bgmModeLabels: {
    on: 'ON',
    off: 'OFF',
  },
} as const

export const titlePanelLabels: Record<TitlePanel, string> = {
  main: '메인 메뉴',
  options: '설정',
  music: '음악 감상',
  scoreEntry: '이름 등록',
}

export const titleMenuEntries: Record<TitlePanel, TitleMenuEntry[]> = {
  main: [
    { id: 'start-game', label: '게임 시작' },
    { id: 'continue-game', label: '이어가기' },
    { id: 'open-options', label: '설정' },
    { id: 'open-guide', label: '가이드' },
  ],
  options: [
    { id: 'cycle-rank', label: '난이도' },
    { id: 'toggle-bgm', label: '배경음' },
    { id: 'cycle-start-lives', label: '시작 잔기' },
    { id: 'open-music', label: '음악 감상' },
    { id: 'options-back', label: '뒤로' },
  ],
  music: [{ id: 'music-back', label: '뒤로' }],
  scoreEntry: [{ id: 'score-entry-back', label: '뒤로' }],
}

export const musicTrackLabels: Record<BgmTrackId, string> = {
  title: '타이틀',
  stageScene1: '1막 일반면',
  stageScene2RouteA: `${getRouteBranchLabel('route-a')} 2막 일반면`,
  stageScene2RouteB: `${getRouteBranchLabel('route-b')} 2막 일반면`,
  stageScene3RouteA: `${getRouteBranchLabel('route-a')} 3막 일반면`,
  stageScene3RouteB: `${getRouteBranchLabel('route-b')} 3막 일반면`,
  stageScene4RouteA: `${getRouteBranchLabel('route-a')} 4막 일반면`,
  stageScene4RouteB: `${getRouteBranchLabel('route-b')} 4막 일반면`,
  bossScene1: '1막 보스',
  bossScene2RouteA: `${getRouteBranchLabel('route-a')} 2막 보스`,
  bossScene2RouteB: `${getRouteBranchLabel('route-b')} 2막 보스`,
  bossScene3RouteA: `${getRouteBranchLabel('route-a')} 3막 보스`,
  bossScene3RouteB: `${getRouteBranchLabel('route-b')} 3막 보스`,
  bossScene4RouteA: `${getRouteBranchLabel('route-a')} 4막 보스`,
  bossScene4RouteB: `${getRouteBranchLabel('route-b')} 4막 보스`,
  ending: '엔딩',
  gameover: '게임 오버',
}
