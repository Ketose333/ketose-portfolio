import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { GuidePage } from '../../pages/GuidePage'
import { HomePage } from '../../pages/HomePage'
import { PlayPage } from '../../pages/PlayPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
