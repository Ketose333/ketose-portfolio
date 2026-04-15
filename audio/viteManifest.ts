export function resolveRequiredAudioAsset(
  assets: Record<string, string>,
  directoryPrefix: string,
  baseName: string,
) {
  const normalizedPrefix = `${directoryPrefix}/${baseName}.`
  const match = Object.entries(assets).find(([path]) => path.startsWith(normalizedPrefix))

  if (!match) {
    throw new Error(`Audio asset not found for "${baseName}"`)
  }

  return match[1]
}

export function resolveOptionalAudioAsset(
  assets: Record<string, string>,
  directoryPrefix: string,
  baseName: string,
) {
  const normalizedPrefix = `${directoryPrefix}/${baseName}.`
  const match = Object.entries(assets).find(([path]) => path.startsWith(normalizedPrefix))
  return match?.[1] ?? null
}
