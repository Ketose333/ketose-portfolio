export const ROOM_KEY = 'bp_last_room_id'
export const AGENT_KEY = 'bp_last_agent_id'

export function loadSavedRoom() {
  try {
    return (sessionStorage.getItem(ROOM_KEY) || '').trim()
  } catch {
    return ''
  }
}

export function saveRoom(roomId: string) {
  const value = String(roomId || '').trim()
  if (!value) return
  try {
    sessionStorage.setItem(ROOM_KEY, value)
  } catch {}
}

export function loadSavedAgent() {
  try {
    return (sessionStorage.getItem(AGENT_KEY) || '').trim()
  } catch {
    return ''
  }
}

export function saveAgent(agentId: string) {
  const value = String(agentId || '').trim()
  if (!value) return
  try {
    sessionStorage.setItem(AGENT_KEY, value)
  } catch {}
}
