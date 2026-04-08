import { BrowserRouter } from 'react-router-dom'
import { NulsightChrome } from './app/components/NulsightChrome'
import { AppProviders } from './app/providers/AppProviders'
import { RouteAudioSync } from './app/providers/RouteAudioSync'
import { AppRouter } from './app/router/AppRouter'

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <RouteAudioSync />
        <NulsightChrome>
          <AppRouter />
        </NulsightChrome>
      </AppProviders>
    </BrowserRouter>
  )
}
