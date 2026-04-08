import react from '@vitejs/plugin-react'
import { defineConfig, type PluginOption, type UserConfig } from 'vite'

type ReactAppConfig = Omit<UserConfig, 'plugins'> & {
  plugins?: PluginOption[]
}

export function createReactAppConfig(config: ReactAppConfig = {}) {
  const { plugins = [], ...rest } = config

  return defineConfig({
    ...rest,
    plugins: [react(), ...plugins],
  })
}
