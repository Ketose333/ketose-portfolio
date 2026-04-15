import { createRoot } from 'react-dom/client'
import '../../../themes/fonts.css'
import '@portfolio/ui-shell/styles.css'
import './index.css'
import { AppProviders } from './app/providers/AppProviders'
import { AppRouter } from './app/router/AppRouter'

createRoot(document.getElementById('root')!).render(
  <AppProviders>
    <AppRouter />
  </AppProviders>,
)
