export interface AuthUser {
  username: string
  displayName?: string
}

export interface AuthResponse {
  ok: boolean
  error?: string
  user?: AuthUser
}

export interface RoomStateResponse {
  ok: boolean
  error?: string
  roomId?: string
  ownerId?: string
  agents?: string[]
  agentNames?: Record<string, string>
  agentsCount?: number
  joinable?: boolean
  started?: boolean
  game?: unknown
}
