import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import OrganizationSidebar from '../components/OrganizationSidebar.jsx'

const API_URL = 'http://localhost:3000'
const ROLES = ['ORGANIZATION_ADMIN', 'MANAGER', 'EMPLOYEE']
const STATUSES = ['ACTIVE', 'SUSPENDED', 'INACTIVE']

const formatLabel = (value = '') =>
  value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?'

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
  'bg-green-100 text-green-800',
  'bg-amber-100 text-amber-800',
]

const avatarColor = (name = '') => {
  let hash = 0
  for (const char of name) hash = (hash + char.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
}

const Avatar = ({ name, size = 36, className = '' }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
      className || avatarColor(name)
    }`}
    style={{ width: size, height: size }}
  >
    {getInitials(name)}
  </span>
)

const UsersPage = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [user, setUser] = useState({})
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('EMPLOYEE')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [sending, setSending] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [viewUser, setViewUser] = useState(null)

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'))
    } catch {
      setUser({})
    }

    if (!localStorage.getItem('accessToken')) {
      navigate('/', { replace: true })
      return
    }

    const controller = new AbortController()

    const loadUsers = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const { data } = await axios.get(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        setUsers(data)
      } catch (requestError) {
        if (axios.isCancel(requestError)) return
        if (requestError.response?.status === 401) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          navigate('/', { replace: true })
          return
        }
        setError(requestError.response?.data?.message || 'Could not load users.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadUsers()
    return () => controller.abort()
  }, [navigate])

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((item) => {
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query)
      return matchesSearch && (!role || item.role === role) && (!status || item.status === status)
    })
  }, [users, search, role, status])

  const canInvite = ['ORGANIZATION_ADMIN', 'MANAGER'].includes(user.role)
  const inviteRoles = user.role === 'MANAGER' ? ['EMPLOYEE'] : ROLES
  const canManageUsers = user.role === 'ORGANIZATION_ADMIN'

  const updateUserStatus = async (selectedUser, nextStatus) => {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      navigate('/', { replace: true })
      return
    }

    setOpenMenuId(null)
    setMessage({ type: '', text: '' })

    try {
      const { data } = await axios.patch(
        `${API_URL}/users/${selectedUser.id}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setUsers((current) =>
        current.map((item) => item.id === selectedUser.id ? data : item)
      )
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        navigate('/', { replace: true })
        return
      }
      setMessage({
        type: 'error',
        text: requestError.response?.data?.message || 'Could not update user status.',
      })
    }
  }

  const toggleInvite = () => {
    setInviteOpen((open) => !open)
    setMessage({ type: '', text: '' })
  }

  const sendInvite = async (event) => {
    event.preventDefault()
    setMessage({ type: '', text: '' })
    setSending(true)

    try {
      await axios.post(
        `${API_URL}/invitations`,
        { email, role: inviteRole, organizationId: user.organizationId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
      )
      setMessage({ type: 'success', text: `Invitation sent to ${email}.` })
      setEmail('')
      setInviteOpen(false)
    } catch (requestError) {
      setMessage({
        type: 'error',
        text: requestError.response?.data?.message || 'Could not send invitation.',
      })

      navigate('/', { replace: true })
    } finally {
      setSending(false)
    }
  }

  const fieldClass =
    'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-[0_5px_20px_rgba(15,23,42,0.04)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  return (
    <div className="min-h-screen bg-white text-[#13213f] md:flex">
      <OrganizationSidebar user={user} activePage="users" />

      {/* Main */}
      <main className="min-w-0 flex-1 px-5 pb-8 pt-5 md:ml-63 md:px-7 md:pt-8">
        <div className="mb-5 flex items-center justify-between md:hidden">
          <a href="/home" className="text-xl font-bold text-[#13213f]">FlowTenant</a>
          <span className="text-sm text-slate-500">{user.name || 'Your account'}</span>
        </div>

        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[25px] font-bold leading-tight tracking-tight sm:text-[27px]">
              Organization Users
            </h1>
            <p className="mt-1 text-[15px] text-slate-500 sm:text-base">
              Manage members of your organization.
            </p>
          </div>
          {canInvite && (
            <button
              type="button"
              onClick={toggleInvite}
              aria-expanded={inviteOpen}
              className="cursor-pointer rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_5px_15px_rgba(37,99,235,0.22)] transition-colors hover:bg-blue-700"
            >
              Invite User
            </button>
          )}
        </header>

        {message.text && (
          <p
            role="status"
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              message.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-800'
            }`}
          >
            {message.text}
          </p>
        )}

        {inviteOpen && (
          <form
            onSubmit={sendInvite}
            className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,0.04)]"
          >
            <label className="flex-1 text-sm font-medium" style={{ minWidth: 200 }}>
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="mt-1 block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm font-medium">
              Role
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="mt-1 block h-11 rounded-lg border border-slate-200 bg-white px-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {inviteRoles.map((item) => (
                  <option key={item} value={item}>
                    {formatLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={sending}
              className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Send invitation'}
            </button>
          </form>
        )}

        {/* Filters */}
        <section
          className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(220px,1fr)_164px_164px]"
          aria-label="Filter users"
        >
          <input
            type="search"
            placeholder="Search users..."
            aria-label="Search users"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={fieldClass}
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            aria-label="Filter by role"
            className={fieldClass}
          >
            <option value="">All Roles</option>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
            className={fieldClass}
          >
            <option value="">All Status</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}
          </select>
        </section>

        {/* Table */}
        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_5px_20px_rgba(15,23,42,0.05)]">
          {error ? (
            <p role="alert" className="p-6 text-sm text-red-700">
              {error}
            </p>
          ) : (
            <table className="w-full text-left text-sm" style={{ minWidth: 650 }}>
              <thead className="border-b border-slate-200">
                <tr className="text-xs font-semibold text-slate-900">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-500">
                      Loading users…
                    </td>
                  </tr>
                ) : visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3 font-semibold">
                          <Avatar name={item.name} />
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">{item.email}</td>
                      <td className="px-6 py-3.5">
                        <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {formatLabel(item.role)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                            STATUS_STYLES[item.status] || STATUS_STYLES.INACTIVE
                          }`}
                        >
                          {formatLabel(item.status)}
                        </span>
                      </td>
                      <td className="relative px-6 py-3.5 text-center">
                        <button
                          type="button"
                          aria-label={`Actions for ${item.name}`}
                          aria-expanded={openMenuId === item.id}
                          onClick={() =>
                            setOpenMenuId(openMenuId === item.id ? null : item.id)
                          }
                          className="cursor-pointer rounded-lg px-3 py-1 text-lg font-bold text-slate-500 hover:bg-slate-100"
                        >
                          ···
                        </button>
                        {openMenuId === item.id && (
                          <div className="absolute right-4 top-full z-10 w-44 rounded-xl border border-slate-200 bg-white p-1 text-left shadow-xl">
                            {canManageUsers && item.id !== user.id && (
                              <>
                                {item.status !== 'INACTIVE' && (
                                  <button
                                    type="button"
                                    onClick={() => updateUserStatus(item, 'INACTIVE')}
                                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    Set inactive
                                  </button>
                                )}
                                {item.status !== 'SUSPENDED' && (
                                  <button
                                    type="button"
                                    onClick={() => updateUserStatus(item, 'SUSPENDED')}
                                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-700 hover:bg-slate-50"
                                  >
                                    Suspend
                                  </button>
                                )}
                                {item.status !== 'ACTIVE' && (
                                  <button
                                    type="button"
                                    onClick={() => updateUserStatus(item, 'ACTIVE')}
                                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-green-700 hover:bg-slate-50"
                                  >
                                    Activate
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setViewUser(item)
                                setOpenMenuId(null)
                              }}
                              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {viewUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-heading"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="user-details-heading" className="text-lg font-bold">User details</h2>
              <button
                type="button"
                onClick={() => setViewUser(null)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="mt-1 font-semibold">{viewUser.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="mt-1 font-semibold">{viewUser.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Role</dt>
                <dd className="mt-1 font-semibold">{formatLabel(viewUser.role)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1 font-semibold">{formatLabel(viewUser.status)}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  )
}

export default UsersPage