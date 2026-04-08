export async function readJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, init)
  return (await response.json()) as T
}

export async function postJson<T>(path: string, body?: unknown) {
  return readJson<T>(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}
