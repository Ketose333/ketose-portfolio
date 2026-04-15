export function sanitizeRoomId(value = '') {
  return String(value).toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, 6)
}

export function buildGameUrl(roomId: string, agentId: string) {
  return `/game?roomId=${encodeURIComponent(roomId)}&agentId=${encodeURIComponent(agentId)}`
}
