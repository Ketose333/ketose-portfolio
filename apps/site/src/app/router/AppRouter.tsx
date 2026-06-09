import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SiteChrome } from '../../components/SiteChrome'
import { ContactPage } from '../../pages/ContactPage'
import { HomePage } from '../../pages/HomePage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <SiteChrome>
              <HomePage />
            </SiteChrome>
          }
        />
        <Route
          path="/contact"
          element={
            <SiteChrome>
              <ContactPage />
            </SiteChrome>
          }
        />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
