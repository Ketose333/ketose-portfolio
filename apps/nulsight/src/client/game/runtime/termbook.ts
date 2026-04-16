export type TermbookGlobal = {
  phase: Record<string, string>
  status: Record<string, string>
  errors: Record<string, string>
  phaseLabel: (phase: string) => string
  mapApiError: (raw?: string) => string
}

export const TERMBOOK: Omit<TermbookGlobal, 'phaseLabel' | 'mapApiError'> = {
  phase: {
    draw: '드로우',
    main: '메인',
    battle: '배틀',
    end: '엔드',
  },
  status: {
    lobbyCreating: '방 생성 중',
    lobbyChecking: '방 상태 확인 중',
    lobbyJoining: '입장 중',
    lobbyReady: '방 생성 완료',
    lobbyChecked: '방 상태 확인됨',
    lobbyJoinedWait: '입장 완료 · 상대 대기 중',
    roomSpectator: '방이 가득 차 관전 모드로 입장',
  },
  errors: {
    invalidRoomId: '방 코드 형식이 올바르지 않아요. 6자리 코드를 다시 확인해 주세요.',
    roomNotFound: '방을 찾을 수 없어요. 코드와 대소문자를 다시 확인해 주세요.',
    roomFull: '방이 가득 찼어요. 잠시 후 다시 시도해 주세요.',
    roomBusy: '같은 방 요청이 겹쳤어요. 잠시 후 다시 시도해 주세요.',
    needDistinctAgents: '서로 다른 2명의 에이전트가 필요해요.',
    unauthorized: '로그인이 만료됐어요. 다시 로그인해 주세요.',
    generic: '요청 처리에 실패했어요. 잠시 후 다시 시도해 주세요.',
  },
}

export function phaseLabel(phase: string) {
  return TERMBOOK.phase[phase] || phase
}

export function mapApiError(raw = '') {
  const normalized = String(raw || '').toLowerCase()
  if (normalized.includes('invalid roomid')) return TERMBOOK.errors.invalidRoomId
  if (normalized.includes('room not found')) return TERMBOOK.errors.roomNotFound
  if (normalized.includes('room full')) return TERMBOOK.errors.roomFull
  if (normalized.includes('room busy')) return TERMBOOK.errors.roomBusy
  if (normalized.includes('two distinct agents required')) return TERMBOOK.errors.needDistinctAgents
  if (normalized.includes('unauthorized') || normalized.includes('auth')) return TERMBOOK.errors.unauthorized
  return raw || TERMBOOK.errors.generic
}
