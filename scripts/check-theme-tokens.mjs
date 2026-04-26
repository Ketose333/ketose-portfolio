import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(process.cwd())
const allowed = new Set([
  resolve(root, 'themes/theme.css'),
  resolve(root, 'themes/theme.oklch.css'),
  resolve(root, 'apps/nulsight/public/theme.css'),
])
const ignored = new Set(['node_modules', 'dist', 'dist-check', '.git'])

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(full))
      continue
    }
    if (entry.isFile() && /\.(css|tsx?|jsx?)$/.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

const offenders = []
for (const file of walk(root)) {
  if (allowed.has(resolve(file))) continue
  const source = readFileSync(file, 'utf8')
  const lines = source.split(/\r?\n/)
  lines.forEach((line, index) => {
    if (/^\s*--theme-[A-Za-z0-9-]+\s*:/.test(line)) {
      offenders.push(`${relative(root, file)}:${index + 1}`)
    }
  })
}

if (offenders.length > 0) {
  console.error('Theme token definitions must stay in themes/theme.oklch.css or its generated output:')
  offenders.forEach((entry) => console.error(`- ${entry}`))
  process.exit(1)
}

console.log('Theme token check passed.')
