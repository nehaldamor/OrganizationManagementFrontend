import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import OrganizationSidebar from '../components/OrganizationSidebar.jsx'

const USERS_URL = 'http://localhost:3000/users'
const GET_ORGANIZATION_URL = 'http://localhost:3000/platform/organizations'
const sampleMetrics = [
  { label: 'Total Teams', value: '3', change: '1 this week' },
  { label: 'Total Projects', value: '5', change: '1 this week' },
  { label: 'Total Tasks', value: '14', change: '4 this week' },
]

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'

const formatRole = (role = '') =>
  role
    .toLowerCase()
    .split('_')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')

const UserHomePage = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [currentUser, setCurrentUser] = useState({})
  const [organizationName, setOrganizationName] = useState('')
  const [organizationLoading, setOrganizationLoading] = useState(true)
  const [organizationError, setOrganizationError] = useState('')

  const AVATAR_TONES = [
  'bg-blue-100 text-blue-800',
  'bg-emerald-100 text-emerald-800',
  'bg-violet-100 text-violet-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-cyan-100 text-cyan-800',
];

const getAvatarTone = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
};

const CARD = 'rounded-xl border border-slate-200 bg-white shadow-sm';
const BADGE = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium';

  const fetchUsers = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/', { replace: true })
      return
    }

    try {
      const { data } = await axios.get(USERS_URL, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
  
      if (!Array.isArray(data)) {
        throw new Error('The users API returned an unexpected response.')
      }

      setUsers(data)
    } catch (requestError) {
      if (axios.isCancel(requestError)) return

      if (requestError.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        navigate('/', { replace: true })
        return
      }

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Could not load users. Please try again.'
      )
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    const controller = new AbortController()
    let user = {}

    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      if (storedUser && typeof storedUser === 'object' && !Array.isArray(storedUser)) {
        user = storedUser
      }
    } catch {
      setOrganizationError('Could not read your account information.')
    }
    setCurrentUser(user)

    const token = localStorage.getItem('accessToken')
    if (!user.organizationId) {
      setOrganizationName('')
      setOrganizationLoading(false)
      setOrganizationError('Your account is not associated with an organization.')
    } else if (token) {
      setOrganizationLoading(true)
      setOrganizationError('')
      axios.get(
        `${GET_ORGANIZATION_URL}/${encodeURIComponent(user.organizationId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      )
        .then(({ data }) => {
          if (typeof data?.name !== 'string' || !data.name.trim()) {
            throw new Error('The organization API returned an unexpected response.')
          }
          setOrganizationName(data.name)
        })
        .catch((requestError) => {
          if (axios.isCancel(requestError)) return

          if (requestError.response?.status === 401) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('user')
            navigate('/', { replace: true })
            return
          }

          setOrganizationName('')
          setOrganizationError(
            requestError.response?.data?.message ||
              requestError.message ||
              'Could not load your organization.'
          )
        })
        .finally(() => {
          if (!controller.signal.aborted) setOrganizationLoading(false)
        })
    } else {
      setOrganizationLoading(false)
    }

    fetchUsers(controller.signal)

    return () => controller.abort()
  }, [fetchUsers, navigate, refreshIndex])

  const recentUsers = users.slice(0, 4)

return (
  <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
    <OrganizationSidebar user={currentUser} activePage="dashboard" />

    <main className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-6 md:ml-63 md:px-8">
      {/* Mobile top bar */}
      <div className="mb-6 flex items-center justify-between md:hidden">
        <a href="/home" className="text-lg font-semibold">
          FlowTenant
        </a>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
          {getInitials(currentUser.name || 'User')} · {formatRole(currentUser.role) || 'Member'}
        </span>
      </div>

      {/* Page header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your organization and its members.
          </p>
        </div>

        <div className={`${CARD} min-w-0 px-4 py-2.5 sm:min-w-56 sm:max-w-xs`}>
          <p className="text-xs text-slate-500">Organization</p>
          <p className="truncate text-sm font-semibold text-slate-900">
            {organizationLoading
              ? 'Loading organization…'
              : organizationError
                ? 'Organization unavailable'
                : organizationName}
          </p>
          {organizationError && (
            <span className="mt-1 block text-xs text-red-600" role="alert">
              {organizationError}
            </span>
          )}
        </div>
      </header>

      {/* Metrics */}
      <section
        aria-label="Organization overview"
        className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className={`${CARD} flex flex-col p-5`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-500">Total users</p>
            <span className={`${BADGE} bg-emerald-50 text-emerald-700`}>Live</span>
          </div>
          <p className="mt-3 text-3xl font-semibold leading-none tabular-nums">
            {loading ? '—' : users.length}
          </p>
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            Members in your organization
          </p>
        </div>

        {sampleMetrics.map((metric) => (
          <div key={metric.label} className={`${CARD} flex flex-col p-5`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
              <span className={`${BADGE} bg-amber-50 text-amber-700`}>Sample</span>
            </div>
            <p className="mt-3 text-3xl font-semibold leading-none tabular-nums">
              {metric.value}
            </p>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              {metric.change} · demo data
            </p>
          </div>
        ))}
      </section>

      {/* Recent users */}
      <section className={`${CARD} overflow-hidden`} aria-labelledby="recent-users-heading">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 id="recent-users-heading" className="text-base font-semibold">
            Recent users
          </h2>
          <span className="text-sm text-slate-500">Latest members</span>
        </div>

        {error ? (
          <div className="flex flex-col items-start gap-3 px-6 py-8" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => setRefreshIndex((current) => current + 1)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      Loading users…
                    </td>
                  </tr>
                ) : recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      No users found in your organization.
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarTone(
                              user.name
                            )}`}
                          >
                            {getInitials(user.name)}
                          </span>
                          <span className="font-medium text-slate-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">{user.email}</td>
                      <td className="px-6 py-3.5">
                        <span className={`${BADGE} bg-slate-100 text-slate-700`}>
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {user.status === 'ACTIVE' ? (
                          <span className={`${BADGE} gap-1.5 bg-green-50 text-green-700`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Active
                          </span>
                        ) : (
                          <span className={`${BADGE} gap-1.5 bg-slate-100 text-slate-600`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            {formatRole(user.status)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  </div>
);
  
}

export default UserHomePage
