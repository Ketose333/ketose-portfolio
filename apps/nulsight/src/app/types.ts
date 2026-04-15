export type { AuthResponse, AuthUser } from '@portfolio/account-client'

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
