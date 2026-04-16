function normalize(raw = '') {
  return String(raw || '').trim().toLowerCase()
}

function pick(raw: string, fallback: string) {
  return raw || fallback
}

export function mapRoomError(raw = '') {
  const value = normalize(raw)
  if (value.includes('invalid roomid')) return '방 코드 형식이 올바르지 않아요. 6자리 영문/숫자 코드를 확인해 주세요.'
  if (value.includes('room allocation failed')) return '방 생성이 잠시 몰리고 있어요. 잠시 후 다시 시도해 주세요.'
  if (value.includes('room busy')) return '같은 방 요청이 겹쳤어요. 잠시 후 다시 시도해 주세요.'
  if (value.includes('room not found')) return '방을 찾을 수 없어요. 코드와 대소문자를 다시 확인해 주세요.'
  if (value.includes('room full')) return '방이 가득 찼어요. 잠시 후 다시 시도해 주세요.'
  if (value.includes('two distinct agents required')) return '서로 다른 두 플레이어가 필요해요.'
  if (value.includes('unauthorized') || value.includes('auth')) return '로그인이 만료됐어요. 다시 로그인해 주세요.'
  if (value.includes('rooms_server_error')) return '방 서버에서 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
  return pick(raw, '방 요청 처리에 실패했어요. 잠시 후 다시 시도해 주세요.')
}

export function mapDeckError(raw = '') {
  const value = normalize(raw)
  if (value.includes('deck busy')) return '덱 저장 요청이 겹쳤어요. 잠시 후 다시 시도해 주세요.'
  if (value.includes('invalid slot')) return '덱 슬롯 정보를 다시 확인해 주세요.'
  if (value.includes('slot limit reached')) return '덱 슬롯은 더 이상 추가할 수 없어요.'
  if (value.includes('cannot delete slot')) return '이 슬롯은 삭제할 수 없어요.'
  if (value.includes('slot name must be <=')) return '슬롯 이름은 너무 길어요. 더 짧게 적어 주세요.'
  if (value.includes('deck must have at least 30 cards')) return '덱은 최소 30장 이상이어야 해요.'
  if (value.includes('card copy limit exceeded')) return '같은 카드는 3장까지만 넣을 수 있어요.'
  if (value.includes('unauthorized') || value.includes('auth')) return '로그인이 만료됐어요. 다시 로그인해 주세요.'
  if (value.includes('deck_server_error')) return '덱 서버에서 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
  return pick(raw, '덱 요청 처리에 실패했어요. 잠시 후 다시 시도해 주세요.')
}

export function mapDeckHubError(raw = '') {
  const value = normalize(raw)
  if (value.includes('invalid id')) return '덱 게시글 식별자가 올바르지 않아요.'
  if (value.includes('not found')) return '해당 덱 게시글을 찾을 수 없어요.'
  if (value.includes('forbidden')) return '이 덱 게시글을 수정하거나 삭제할 권한이 없어요.'
  if (value.includes('title must be')) return '덱 이름 길이를 다시 확인해 주세요.'
  if (value.includes('description too long')) return '덱 설명이 너무 길어요.'
  if (value.includes('invalid code length')) return '덱 코드 길이가 올바르지 않아요.'
  if (value.includes('deck_min')) return '덱 코드는 최소 장수 조건을 만족해야 해요.'
  if (value.includes('invalid_format') || value.includes('invalid_cards') || value.includes('unknown_card') || value.includes('invalid_count')) {
    return '덱 코드를 해석하지 못했어요. 코드 형식을 다시 확인해 주세요.'
  }
  if (value.includes('deck_hub_server_error')) return '덱 허브 서버에서 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
  if (value.includes('unauthorized') || value.includes('auth')) return '로그인이 만료됐어요. 다시 로그인해 주세요.'
  return pick(raw, '덱 허브 요청 처리에 실패했어요. 잠시 후 다시 시도해 주세요.')
}

export function mapAuthError(raw = '') {
  const value = normalize(raw)
  if (value.includes('invalid credentials')) return '아이디나 비밀번호가 맞지 않아요.'
  if (value.includes('username already exists')) return '이미 사용 중인 아이디예요.'
  if (value.includes('username too short')) return '아이디는 너무 짧아요.'
  if (value.includes('username format invalid')) return '아이디는 영문 소문자, 숫자, 밑줄만 사용할 수 있어요.'
  if (value.includes('password too short')) return '비밀번호는 8자 이상이어야 해요.'
  if (value.includes('password must include letters and numbers')) return '비밀번호는 영문과 숫자를 모두 포함해야 해요.'
  if (value.includes('unauthorized')) return '로그인이 필요하거나 세션이 만료됐어요.'
  if (value.includes('auth_server_error')) return '인증 서버에서 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
  return pick(raw, '인증 요청 처리에 실패했어요. 잠시 후 다시 시도해 주세요.')
}
