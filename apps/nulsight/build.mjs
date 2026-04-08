import { build } from 'esbuild'
import { mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const browserTargets = [
  {
    entry: 'src/client/globals/rules-const.ts',
    outfile: 'public/js/rules-const.js',
  },
  {
    entry: 'src/client/globals/deck-codec.ts',
    outfile: 'public/js/deck-codec.js',
  },
  {
    entry: 'src/client/game/session.ts',
    outfile: 'public/js/game-session.js',
  },
  {
    entry: 'src/client/game/format.ts',
    outfile: 'public/js/game-format.js',
  },
  {
    entry: 'src/client/audio/runtime.ts',
    outfile: 'public/js/audio-runtime.js',
  },
]

const serverTargets = [
  {
    entry: 'src/server/generated/rules-const.ts',
    outfile: 'lib/generated/rules-const.cjs',
  },
  {
    entry: 'src/server/generated/deck-codec.ts',
    outfile: 'lib/generated/deck-codec.cjs',
  },
]

async function buildBrowser() {
  await Promise.all(
    browserTargets.map(({ entry, outfile }) =>
      build({
        entryPoints: [path.join(__dirname, entry)],
        outfile: path.join(__dirname, outfile),
        bundle: true,
        format: 'iife',
        platform: 'browser',
        target: 'es2020',
        logLevel: 'silent',
      }),
    ),
  )
}

async function buildServer() {
  await mkdir(path.join(__dirname, 'lib', 'generated'), { recursive: true })
  await Promise.all(
    serverTargets.map(({ entry, outfile }) =>
      build({
        entryPoints: [path.join(__dirname, entry)],
        outfile: path.join(__dirname, outfile),
        bundle: true,
        format: 'cjs',
        platform: 'node',
        target: 'node18',
        logLevel: 'silent',
      }),
    ),
  )
}

async function syncSharedCards() {
  await mkdir(path.join(__dirname, 'lib', 'generated'), { recursive: true })
  await copyFile(
    path.join(__dirname, 'src', 'shared', 'shared-cards.js'),
    path.join(__dirname, 'public', 'js', 'shared-cards.js'),
  )
  await copyFile(
    path.join(__dirname, 'src', 'shared', 'shared-cards.js'),
    path.join(__dirname, 'lib', 'generated', 'shared-cards.cjs'),
  )
}

async function syncSharedTheme() {
  await copyFile(
    path.join(__dirname, '..', '..', 'themes', 'theme.css'),
    path.join(__dirname, 'public', 'theme.css'),
  )
  await copyFile(
    path.join(__dirname, '..', '..', 'themes', 'fonts.css'),
    path.join(__dirname, 'public', 'fonts.css'),
  )
}

await buildBrowser()
await buildServer()
await syncSharedCards()
await syncSharedTheme()
