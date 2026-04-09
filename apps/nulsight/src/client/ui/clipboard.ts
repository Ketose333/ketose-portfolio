export async function readClipboardTextSafe() {
  try {
    return (await navigator.clipboard.readText()).trim()
  } catch {
    return ''
  }
}

export async function writeClipboardTextSafe(value: string) {
  try {
    await navigator.clipboard.writeText(String(value || ''))
    return true
  } catch {
    return false
  }
}
