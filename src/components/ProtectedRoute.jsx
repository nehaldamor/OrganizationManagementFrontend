import { Navigate, useLocation } from 'react-router-dom'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation()

  let user = {}

  try {
    user = JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    user = null
  }

  const token = localStorage.getItem('accessToken')

  if (!token || !user) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
