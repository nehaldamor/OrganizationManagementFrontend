import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginPage from './pages/Login.jsx'
import PlatformAdmin from './pages/Platform_admin_homePage.jsx'
import UserHomePage from './pages/UserHomePage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import AcceptInvitation from './pages/AcceptInvitation.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route
        path="/platform-admin"
        element={
          <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
            <PlatformAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute
            allowedRoles={['ORGANIZATION_ADMIN', 'MANAGER', 'EMPLOYEE']}
          >
            <UserHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute
            allowedRoles={['ORGANIZATION_ADMIN', 'MANAGER', 'EMPLOYEE']}
          >
            <UsersPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
