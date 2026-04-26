export interface AuthUser {
  username: string
  displayName?: string
}

export interface AuthResponse {
  ok: boolean
  error?: string
  user?: AuthUser
}

export type AccountClientOptions = {
  baseUrl?: string
  fetcher?: typeof fetch
  credentials?: RequestCredentials
}

type AuthAction = 'me' | 'login' | 'register' | 'logout'

type LoginPayload = {
  username: string
  password: string
}

type RegisterPayload = {
  username: string
  password: string
  displayName?: string
}

function trimTrailingSlash(value = '') {
  return value.replace(/\/+$/, '')
}

function authEndpoint(action: AuthAction, baseUrl = '') {
  const root = trimTrailingSlash(baseUrl)
  return `${root}/api/auth?action=${action}`
}

async function authRequest<T>(action: AuthAction, init?: RequestInit, options: AccountClientOptions = {}) {
  const fetcher = options.fetcher || fetch
  const response = await fetcher(authEndpoint(action, options.baseUrl), {
    credentials: options.credentials || 'same-origin',
    ...init,
  })
  return (await response.json()) as T
}

export function buildAuthPageHref(page: 'login' | 'register', next = '', baseUrl = '') {
  const root = trimTrailingSlash(baseUrl)
  const suffix = next ? `?next=${encodeURIComponent(next)}` : ''
  return `${root}/${page}${suffix}`
}

export function getAccountDisplayName(user: AuthUser | null | undefined) {
  return user?.displayName || user?.username || ''
}

export async function readAuthSession(options: AccountClientOptions = {}) {
  return authRequest<AuthResponse>('me', undefined, options)
}

export async function loginAccount(payload: LoginPayload, options: AccountClientOptions = {}) {
  return authRequest<AuthResponse>(
    'login',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    },
    options,
  )
}

export async function registerAccount(payload: RegisterPayload, options: AccountClientOptions = {}) {
  return authRequest<AuthResponse>(
    'register',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    },
    options,
  )
}

export async function logoutAccount(options: AccountClientOptions = {}) {
  return authRequest<AuthResponse>(
    'logout',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    },
    options,
  )
}
