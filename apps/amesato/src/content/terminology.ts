import { routeKeys, type GameRoute } from '../game/core/types'

interface RouteTerminology {
  label: string
  menuLabel: string
  branchLabel: string
}

export const gameplayTerminology = {
  playerLabel: '플레이어',
  orbLabel: '음양옥',
  sourceGameLabel: 'TH01',
  dataFileLabel: 'STAGE?.DAT',
  controls: {
    shotKeyLabel: 'Z 또는 Space',
    bombKeyLabel: 'Z/X 연속 입력',
    focusKeyLabel: 'X',
    pauseKeyLabel: 'Esc',
    restartKeyLabel: 'R',
  },
  menuLabels: {
    continueGame: '이어가기',
    startGame: '게임 시작',
    option: '설정',
    musicTest: '음악 감상',
    highScore: '최고 점수',
    guide: '가이드',
    rank: '난이도',
    route: '방향',
    bgm: '배경음',
    startLives: '시작 잔기',
    backToTitle: '타이틀로 돌아가기',
  },
  guideLabels: {
    eyebrow: '가이드',
    playTitle: '조작과 규칙',
  },
  platformLabels: {
    mobileBlockedTitle: '모바일에서는 플레이할 수 없습니다',
    mobileBlockedBody:
      '천리운해록은 키보드 조작과 넓은 플레이필드를 기준으로 설계되어 모바일 플레이를 지원하지 않습니다. 데스크톱이나 노트북에서 접속해 주세요.',
    mobileBlockedShort: '모바일에서는 플레이를 지원하지 않습니다.',
  },
  routeLabels: {
    'route-a': {
      label: '복원',
      menuLabel: '복원',
      branchLabel: '복원 루트',
    },
    'route-b': {
      label: '개방',
      menuLabel: '개방',
      branchLabel: '개방 루트',
    },
  } satisfies Record<GameRoute, RouteTerminology>,
}

export const routeCycleOrder = [...routeKeys]

export function getRouteLabel(route: GameRoute) {
  return gameplayTerminology.routeLabels[route].label
}

export function getRouteMenuLabel(route: GameRoute) {
  return gameplayTerminology.routeLabels[route].menuLabel
}

export function getRouteBranchLabel(route: GameRoute) {
  return gameplayTerminology.routeLabels[route].branchLabel
}
