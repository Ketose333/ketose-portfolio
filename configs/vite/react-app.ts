import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type PluginOption, type UserConfig } from 'vite'

type ReactAppConfig = Omit<UserConfig, 'plugins'> & {
  plugins?: PluginOption[]
  ensureSharedTheme?: boolean
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function ensureSharedTheme() {
  const rootDir = path.resolve(__dirname, '..', '..')
  const scriptPath = path.join(rootDir, 'scripts', 'build-theme-css.mjs')
  execFileSync(
    process.execPath,
    [scriptPath, 'themes/theme.oklch.css', 'themes/theme.css'],
    {
      cwd: rootDir,
      stdio: 'inherit',
    },
  )
}

export function createReactAppConfig(config: ReactAppConfig = {}) {
  const { plugins = [], ensureSharedTheme: shouldEnsureSharedTheme = true, ...rest } = config
  if (shouldEnsureSharedTheme) {
    ensureSharedTheme()
  }

  return defineConfig({
    ...rest,
    plugins: [react(), ...plugins],
  })
}
