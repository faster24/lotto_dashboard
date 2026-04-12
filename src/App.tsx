import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx'
import { AppLayout } from './components/layout/AppLayout.tsx'
import { AdminBankSettingsPage } from './pages/AdminBankSettingsPage.tsx'
import { BetDetailPage } from './pages/BetDetailPage.tsx'
import { BetsPage } from './pages/BetsPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { ManageAccountPage } from './pages/ManageAccountPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { OddsSettingsPage } from './pages/OddsSettingsPage.tsx'
import { PayoutQueuePage } from './pages/PayoutQueuePage.tsx'
import { StatsPage } from './pages/StatsPage.tsx'
import { ThreeDResultsPage } from './pages/ThreeDResultsPage.tsx'
import { TwoDResultsPage } from './pages/TwoDResultsPage.tsx'
import { UsersPage } from './pages/UsersPage.tsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate replace to="/stats" />} />
          <Route path="/bets" element={<BetsPage />} />
          <Route path="/bets/payout-queue" element={<PayoutQueuePage />} />
          <Route path="/bets/:betId" element={<BetDetailPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/results/2d" element={<TwoDResultsPage />} />
          <Route path="/results/3d" element={<ThreeDResultsPage />} />
          <Route path="/settings/odds" element={<OddsSettingsPage />} />
          <Route path="/settings/bank-info" element={<AdminBankSettingsPage />} />
          <Route path="/settings/account" element={<ManageAccountPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
