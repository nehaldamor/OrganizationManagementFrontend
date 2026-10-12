
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'

const API_URL = 'http://localhost:3000/platform/organizations'
const PAGE_SIZE = 5

const PlatformOrganizations = () => {
  const navigate = useNavigate()

  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [openMenu, setOpenMenu] = useState(null)
  const [updatingOrganizationId, setUpdatingOrganizationId] = useState(null)

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true)
      setError('')

      try {
        const token = localStorage.getItem('accessToken')

        if (!token) {
          navigate('/', { replace: true })
          return
        }

        const { data } = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page,
            limit: PAGE_SIZE,
          },
        })

        setOrganizations(data.organizations)
        setPagination(data.meta)
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          navigate('/', { replace: true })
          return
        }

        setError(
          err.response?.data?.message ||
            'Failed to load organizations.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [page, navigate])

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getInitial = (name) =>
    name?.charAt(0)?.toUpperCase() || '?'

  const toggleOrganizationMenu = (event, organizationId) => {
    if (openMenu?.id === organizationId) {
      setOpenMenu(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 176
    const menuHeight = 88
    const left = Math.max(
      8,
      Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)
    )
    const top =
      rect.bottom + menuHeight > window.innerHeight - 8
        ? Math.max(8, rect.top - menuHeight - 4)
        : rect.bottom + 4

    setOpenMenu({ id: organizationId, top, left })
  }

  useEffect(() => {
    if (!openMenu) return

    const closeMenu = () => setOpenMenu(null)
    window.addEventListener('scroll', closeMenu, true)
    window.addEventListener('resize', closeMenu)

    return () => {
      window.removeEventListener('scroll', closeMenu, true)
      window.removeEventListener('resize', closeMenu)
    }
  }, [openMenu])

  const updateOrganizationStatus = async (organization) => {
    const nextStatus =
      organization.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    const token = localStorage.getItem('accessToken')

    if (!token) {
      navigate('/', { replace: true })
      return
    }

    setUpdatingOrganizationId(organization.id)
    setError('')

    try {
      await axios.patch(
        `${API_URL}/${organization.id}/status`,
        { status: nextStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setOrganizations((current) =>
        current.map((item) =>
          item.id === organization.id
            ? { ...item, status: nextStatus }
            : item
        )
      )
      setOpenMenu(null)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        navigate('/', { replace: true })
        return
      }

      setError(
        err.response?.data?.message ||
          `Failed to ${nextStatus === 'ACTIVE' ? 'activate' : 'suspend'} organization.`
      )
    } finally {
      setUpdatingOrganizationId(null)
    }
  }

  let user = {}

  try {
    user = JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    user = {}
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col bg-slate-900 px-4 py-6 text-white sm:w-[250px]">
        <h1 className="mb-8 px-3 text-xl font-bold tracking-tight">
          FlowTenant
        </h1>

        <nav className="space-y-2">
          <button
            onClick={() => navigate('/platform-admin')}
            className="w-full cursor-pointer rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Dashboard
          </button>

          <button
            onClick={() => navigate('/platform/organizations')}
            className="w-full cursor-pointer rounded-xl bg-blue-600 px-3 py-3 text-left text-sm font-medium text-white"
          >
            Organizations
          </button>
        </nav>

        {/* Logged-in user */}
        <div className="mt-auto flex items-center gap-3 px-3 pt-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-semibold">
            {getInitial(user.name || 'Admin')}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {user.name || 'Admin'}
            </p>
            <p className="text-xs text-slate-400">
              Platform Admin
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Organizations
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Manage all organizations on the platform.
            </p>
          </div>

          <button
            onClick={() =>
              navigate('/platform/organizations/create')
            }
            className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Create Organization
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{error}</span>

            <button
              onClick={() => setPage((current) => current)}
              className="cursor-pointer font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Organizations table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-sm text-slate-500"
                    >
                      Loading organizations...
                    </td>
                  </tr>
                ) : error && organizations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-sm text-slate-500"
                    >
                      Organizations could not be loaded.
                    </td>
                  </tr>
                ) : organizations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-sm text-slate-500"
                    >
                      No organizations found.
                    </td>
                  </tr>
                ) : (
                  organizations.map((organization) => (
                    <tr
                      key={organization.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            {getInitial(organization.name)}
                          </div>

                          <span className="text-sm font-medium text-slate-700">
                            {organization.name}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {organization.slug}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            organization.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : organization.status === 'SUSPENDED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {organization.status === 'ACTIVE'
                            ? 'Active'
                            : organization.status === 'SUSPENDED'
                              ? 'Suspended'
                              : organization.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {formatDate(organization.createdAt)}
                      </td>

                      <td className="relative px-6 py-4 text-center">
                        <button
                          type="button"
                          aria-label={`Actions for ${organization.name}`}
                          aria-expanded={openMenu?.id === organization.id}
                          onClick={(event) =>
                            toggleOrganizationMenu(event, organization.id)
                          }
                          className="cursor-pointer rounded-lg px-3 py-1 text-lg font-bold text-slate-600 hover:bg-slate-100"
                        >
                          ···
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {openMenu &&
          createPortal(
            <>
              <button
                type="button"
                aria-label="Close organization actions"
                className="fixed inset-0 z-40 cursor-pointer"
                onClick={() => setOpenMenu(null)}
              />
              {organizations
                .filter((organization) => organization.id === openMenu.id)
                .map((organization) => (
                  <div
                    key={organization.id}
                    role="menu"
                    className="fixed z-50 w-44 rounded-xl border border-slate-200 bg-white p-1 text-left shadow-xl ring-1 ring-black/5"
                    style={{ top: openMenu.top, left: openMenu.left }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      disabled={updatingOrganizationId === organization.id}
                      onClick={() => updateOrganizationStatus(organization)}
                      className={`w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${
                        organization.status === 'ACTIVE'
                          ? 'text-red-700'
                          : 'text-green-700'
                      }`}
                    >
                      {updatingOrganizationId === organization.id
                        ? 'Updating...'
                        : organization.status === 'ACTIVE'
                          ? 'Suspend'
                          : 'Activate'}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenu(null)
                        navigate(
                          `/platform/organizations/${organization.id}`
                        )
                      }}
                      className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </button>
                  </div>
                ))}
            </>,
            document.body
          )}

        {/* Server-side pagination */}
        {!loading && !error && pagination.totalItems > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(
                (page - 1) * PAGE_SIZE + organizations.length,
                pagination.totalItems
              )}{' '}
              of {pagination.totalItems} organizations
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.hasPreviousPage || loading}
                onClick={() => setPage((current) => current - 1)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                ‹
              </button>

              {Array.from(
                { length: pagination.totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  disabled={loading}
                  onClick={() => setPage(pageNumber)}
                  className={`h-10 min-w-10 cursor-pointer rounded-lg border px-3 text-sm font-medium transition disabled:cursor-not-allowed ${
                    page === pageNumber
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                disabled={!pagination.hasNextPage || loading}
                onClick={() => setPage((current) => current + 1)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default PlatformOrganizations
