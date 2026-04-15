import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { NulsightAppShell } from '../components/NulsightAppShell'
import { DeckPage } from '../../pages/DeckPage'
import { DeckHubPage } from '../../pages/DeckHubPage'
import { GamePage } from '../../pages/GamePage'
import { GuidePage } from '../../pages/GuidePage'
import { LobbyPage } from '../../pages/LobbyPage'
import { LoginPage } from '../../pages/LoginPage'
import { RegisterPage } from '../../pages/RegisterPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<NulsightAppShell />}>
          <Route path="/" element={<Navigate replace to="/lobby" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/deck" element={<DeckPage />} />
          <Route path="/deck-hub" element={<DeckHubPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
