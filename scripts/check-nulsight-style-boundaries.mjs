import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(process.cwd())
const targetRoot = resolve(root, 'apps/nulsight')
const ignored = new Set(['node_modules', 'dist', 'dist-check', '.git'])

const allowedFiles = new Set([
  resolve(targetRoot, 'public/core.css'),
  resolve(targetRoot, 'public/styles.css'),
  resolve(targetRoot, 'public/header-footer.css'),
  resolve(targetRoot, 'public/index.css'),
  resolve(targetRoot, 'public/theme.css'),
  resolve(targetRoot, 'src/app.css'),
])

const forbiddenPatterns = [
  { label: 'border-radius', regex: /^\s*border-radius\s*:/ },
  { label: 'font-family', regex: /^\s*font-family\s*:/ },
  { label: 'appearance', regex: /^\s*(?:-webkit-appearance|appearance)\s*:/ },
  { label: 'outline', regex: /^\s*outline\s*:/ },
]

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
    if (entry.isFile() && /\.css$/.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

const offenders = []

for (const file of walk(targetRoot)) {
  const resolved = resolve(file)
  if (allowedFiles.has(resolved)) continue
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, index) => {
    for (const pattern of forbiddenPatterns) {
      if (pattern.regex.test(line)) {
        offenders.push(`${relative(root, file)}:${index + 1} uses ${pattern.label}`)
      }
    }
  })
}

if (offenders.length > 0) {
  console.error('Nulsight page-level CSS is overriding core style primitives.')
  console.error('Move shape/typography/focus primitives into public/core.css, public/styles.css, public/header-footer.css, src/app.css, or public/index.css.')
  offenders.forEach((entry) => console.error(`- ${entry}`))
  process.exit(1)
}

console.log('Nulsight style boundary check passed.')
