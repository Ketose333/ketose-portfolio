export type GameViewGlobal = {
  displayName: (agentId: string, agentNames?: Record<string, string>) => string
  winnerLabel: (winnerId: string, agentNames?: Record<string, string>) => string
  phaseAdvanceLabel: (phase: string) => string
  buildActiveActionState: (input: {
    usageKey: string
    cardKey: string
    cardName: string
    labels: string[]
    actionName: string
    actionArg: unknown
  }) => {
    key: string
    label: string
    detail: string
    action: { name: string; arg: unknown }
  }
  buildHudState: (input: {
    game: {
      turn?: number
      phase?: string
      activeAgentId?: string
      winnerId?: string
      stack?: unknown[]
    }
    myTurn: boolean
    myPriority: boolean
    isSpectator: boolean
    selectionText: string
    agentNames?: Record<string, string>
    priorityHolderId?: string
  }) => {
    turnText: string
    turnTone: 'me' | 'opp'
    phaseText: string
    focusText: string
    noticeText: string
    badges: string[]
  }
  buildSurfaceMeta: (input: {
    game: {
      phase?: string
      pendingAdvance?: boolean
      stack?: unknown[]
    }
    meAgent?: { hp?: number; mana?: number; manaMax?: number }
    oppAgent?: { hp?: number; mana?: number; manaMax?: number }
    myHandCount: number | string
    oppHandCount: number | string
    myTurn: boolean
    myPriority: boolean
    isSpectator: boolean
    selectedAttacker: unknown
    stackCount: number
  }) => {
    mySummary: { hp: string; mana: string; hand: string }
    oppSummary: { hp: string; mana: string; hand: string }
    endButtonLabel: string
    endButtonDisabled: boolean
    passButtonLabel: string
    passButtonDisabled: boolean
    concedeDisabled: boolean
    attackDisabled: boolean
    stackActive: boolean
  }
  buildStackEntryState: (input: {
    id?: string
    key: string
    index?: number
    title: string
    actorName: string
    action?: { kind?: string; value?: number } | null
  }) => {
    key: string
    actorText: string
    summaryText: string
    cardKey: string
  }
}

function phaseLabel(phase: string) {
  const labels: Record<string, string> = {
    draw: '드로우',
    main: '메인',
    battle: '배틀',
    end: '엔드',
  }
  return labels[phase] || phase
}

export function displayName(agentId: string, agentNames: Record<string, string> = {}) {
  const id = String(agentId || '').trim()
  if (!id) return '플레이어'
  return String(agentNames[id] || id)
}

export function winnerLabel(winnerId: string, agentNames: Record<string, string> = {}) {
  if (!winnerId) return '-'
  return displayName(winnerId, agentNames)
}

export function phaseAdvanceLabel(phase: string) {
  const map: Record<string, string> = {
    draw: '메인으로',
    main: '배틀로',
    battle: '엔드로',
    end: '턴 종료',
  }
  return map[String(phase || '')] || '페이즈 진행'
}

export function buildActiveActionState(input: {
  usageKey: string
  cardKey: string
  cardName: string
  labels: string[]
  actionName: string
  actionArg: unknown
}) {
  const { usageKey, cardKey, cardName, labels, actionName, actionArg } = input
  return {
    key: `${usageKey}:${cardKey}`,
    label: `${cardName} 사용`,
    detail: labels.join(' · '),
    action: { name: actionName, arg: actionArg },
  }
}

export function buildHudState(input: {
  game: {
    turn?: number
    phase?: string
    activeAgentId?: string
    winnerId?: string
    stack?: unknown[]
  }
  myTurn: boolean
  myPriority: boolean
  isSpectator: boolean
  selectionText: string
  agentNames?: Record<string, string>
  priorityHolderId?: string
}) {
  const { game, myTurn, myPriority, isSpectator, selectionText, agentNames = {}, priorityHolderId } = input
  const activeName = displayName(String(game?.activeAgentId || ''), agentNames)
  const priorityName = displayName(String(priorityHolderId || game?.activeAgentId || ''), agentNames)
  const turnTone: 'me' | 'opp' = myTurn ? 'me' : 'opp'
  const hudNotice = isSpectator
    ? '관전 모드: 행동할 수 없습니다.'
    : (myPriority
      ? '우선권 보유 중. 패스하거나 대응할 수 있습니다.'
      : (myTurn ? '행동할 수 있습니다.' : `${activeName} 턴을 기다리는 중입니다.`))

  return {
    turnText: `${activeName} 턴 · ${game?.turn ?? '-'}턴`,
    turnTone,
    phaseText: phaseLabel(String(game?.phase || '')),
    focusText: selectionText,
    noticeText: hudNotice,
    badges: [
      `스택 ${game?.stack?.length || 0}`,
      `우선권 ${priorityName}`,
      ...(game?.winnerId ? [`승자 ${winnerLabel(String(game.winnerId), agentNames)}`] : []),
    ],
  }
}

export function buildSurfaceMeta(input: {
  game: {
    phase?: string
    pendingAdvance?: boolean
    stack?: unknown[]
  }
  meAgent?: { hp?: number; mana?: number; manaMax?: number }
  oppAgent?: { hp?: number; mana?: number; manaMax?: number }
  myHandCount: number | string
  oppHandCount: number | string
  myTurn: boolean
  myPriority: boolean
  isSpectator: boolean
  selectedAttacker: unknown
  stackCount: number
}) {
  const {
    game,
    meAgent,
    oppAgent,
    myHandCount,
    oppHandCount,
    myTurn,
    myPriority,
    isSpectator,
    selectedAttacker,
    stackCount,
  } = input

  return {
    mySummary: {
      hp: String(meAgent?.hp ?? '-'),
      mana: `${meAgent?.mana ?? '-'}/${meAgent?.manaMax ?? '-'}`,
      hand: String(myHandCount),
    },
    oppSummary: {
      hp: String(oppAgent?.hp ?? '-'),
      mana: `${oppAgent?.mana ?? '-'}/${oppAgent?.manaMax ?? '-'}`,
      hand: String(oppHandCount),
    },
    endButtonLabel: phaseAdvanceLabel(String(game?.phase || '')),
    endButtonDisabled: isSpectator || !myTurn || !myPriority,
    passButtonLabel: '우선권 패스',
    passButtonDisabled: isSpectator || !myPriority || (!(stackCount > 0) && !game?.pendingAdvance),
    concedeDisabled: isSpectator,
    attackDisabled: isSpectator || !myTurn || !myPriority || game?.phase !== 'battle' || !selectedAttacker,
    stackActive: stackCount > 0,
  }
}

function describeStackAction(action: { kind?: string; value?: number } | null = null) {
  const kind = String(action?.kind || '').trim()
  const value = Number(action?.value || 0)
  switch (kind) {
    case 'deal_damage_to_agent':
      return `상대 본체에 ${value || 0} 피해`
    case 'deal_damage_to_unit':
      return `대상 유닛에 ${value || 0} 피해`
    case 'heal_unit':
      return '대상 유닛 회복'
    case 'attach_equipment':
      return '장착 효과 적용'
    case 'banish_unit':
      return '대상 유닛 제외'
    case 'deploy_from_deck':
      return '징집 대기 중'
    case 'search_deck_to_hand':
      return '탐색 대기 중'
    default:
      return kind ? `${kind} 해결 대기` : '연쇄 대기 중'
  }
}

export function buildStackEntryState(input: {
  id?: string
  key: string
  index?: number
  title: string
  actorName: string
  action?: { kind?: string; value?: number } | null
}) {
  const { id, key, index = 0, title, actorName, action } = input
  return {
    key: `${id || key}-${index}`,
    actorText: `${actorName} · ${title}`,
    summaryText: describeStackAction(action),
    cardKey: key,
  }
}
