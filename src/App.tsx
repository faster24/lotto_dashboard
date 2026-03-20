import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx'
import { AppLayout } from './components/layout/AppLayout.tsx'
import { BetCreatePage } from './pages/BetCreatePage.tsx'
import { BetDetailPage } from './pages/BetDetailPage.tsx'
import { BetsPage } from './pages/BetsPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { PayoutQueuePage } from './pages/PayoutQueuePage.tsx'
import { StatsPage } from './pages/StatsPage.tsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate replace to="/bets" />} />
          <Route path="/bets" element={<BetsPage />} />
          <Route path="/bets/new" element={<BetCreatePage />} />
          <Route path="/bets/payout-queue" element={<PayoutQueuePage />} />
          <Route path="/bets/:betId" element={<BetDetailPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
