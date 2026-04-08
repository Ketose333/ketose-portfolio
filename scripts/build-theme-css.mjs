import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

const OKLCH_RE = /oklch\(([^()]+)\)/g

function clamp01(value) {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function srgbEncode(linear) {
  const v = clamp01(linear)
  if (v <= 0.0031308) return 12.92 * v
  return 1.055 * (v ** (1 / 2.4)) - 0.055
}

function convert(inner) {
  let part = inner.trim()
  let alpha = null
  if (part.includes('/')) {
    const [left, right] = part.split('/', 2)
    part = left.trim()
    alpha = right.trim()
  }

  const tokens = part.split(/\s+/).filter(Boolean)
  if (tokens.length !== 3) return `oklch(${inner})`

  const [lTok, cTok, hTok] = tokens

  let L
  let C
  let h

  try {
    L = lTok.endsWith('%') ? Number.parseFloat(lTok.slice(0, -1)) / 100 : Number.parseFloat(lTok)
    C = Number.parseFloat(cTok)
    h = Number.parseFloat(hTok)
  } catch {
    return `oklch(${inner})`
  }

  if ([L, C, h].some((value) => Number.isNaN(value))) return `oklch(${inner})`

  const hr = (h * Math.PI) / 180
  const a = C * Math.cos(hr)
  const b = C * Math.sin(hr)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  const r = Math.round(srgbEncode(rLin) * 255)
  const g = Math.round(srgbEncode(gLin) * 255)
  const bOut = Math.round(srgbEncode(bLin) * 255)

  if (alpha !== null) return `rgb(${r} ${g} ${bOut} / ${alpha})`
  return `rgb(${r} ${g} ${bOut})`
}

const [inputArg = 'themes/theme.oklch.css', outputArg = 'themes/theme.css'] = process.argv.slice(2)
const inputPath = resolve(process.cwd(), inputArg)
const outputPath = resolve(process.cwd(), outputArg)
const inputLabel = relative(process.cwd(), inputPath).replace(/\\/g, '/')
const HEADER = `/* AUTO-GENERATED from ${inputLabel.split('/').at(-1)} by scripts/build-theme-css.mjs */\n/* Single source of truth: ${inputLabel} */\n\n`

const source = readFileSync(inputPath, 'utf8')
const converted = source.replace(OKLCH_RE, (_, inner) => convert(inner))
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, HEADER + converted, 'utf8')
console.log(`Built: ${outputPath}`)
