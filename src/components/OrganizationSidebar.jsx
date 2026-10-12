import { useNavigate } from 'react-router-dom'

const navigationItems = [
  { label: 'Dashboard', path: '/home' },
  { label: 'Users', path: '/users' },
  { label: 'Teams' },
  { label: 'Projects' },
  { label: 'Tasks' },
  { label: 'Organization', spaced: true },
]

const formatRole = (role = '') =>
  role
    .toLowerCase()
    .split('_')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'

const OrganizationSidebar = ({ user = {}, activePage }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    navigate('/', { replace: true })
  }

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-63 flex-col bg-[#0d203d] px-3 py-6 text-white md:flex">
      <a href="/home" className="mb-7 px-3 text-[22px] font-bold tracking-wide">
        FlowTenant
      </a>

      <nav className="space-y-1.5" aria-label="Main navigation">
        {navigationItems.map((item) => {
          const active = item.label.toLowerCase() === activePage
          return (
            <button
              key={item.label}
              type="button"
              disabled={!item.path}
              aria-current={active ? 'page' : undefined}
              onClick={() => item.path && navigate(item.path)}
              title={item.path ? undefined : `${item.label} is not available yet`}
              className={`flex w-full items-center rounded-lg px-3 py-3 text-left text-[15px] transition ${
                active
                  ? 'bg-blue-600 text-white'
                  : item.path
                    ? 'text-slate-300/90 hover:bg-slate-800'
                    : 'cursor-not-allowed text-slate-300/90'
              } ${item.spaced ? 'mt-2' : ''}`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 border-t border-slate-700/70 px-3 pt-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-[#20365c]">
          {getInitials(user.name || 'User')}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.name || 'Your account'}</p>
          <p className="truncate text-xs text-slate-400">{formatRole(user.role) || 'Member'}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-3 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
      >
        Log out
      </button>
    </aside>
  )
}

export default OrganizationSidebar
