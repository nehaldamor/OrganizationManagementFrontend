import { useState } from 'react'
import axios from 'axios'
import { Link, useSearchParams } from 'react-router-dom'

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(
    token ? '' : 'This invitation link is missing its token.',
  )
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!token) {
      setError('This invitation link is missing its token.')
      return
    }
    if (password.length < 6) {
      setError('Your password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await axios.post('http://localhost:3000/invitations/accept', {
        token,
        name: name.trim(),
        password,
      })
      setAccepted(true)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Could not accept this invitation. It may have expired or already been used.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
        <h1 className="text-2xl font-bold text-slate-900">
          {accepted ? 'Invitation accepted' : 'Accept your invitation'}
        </h1>
        {accepted ? (
          <div className="mt-4 space-y-5">
            <p className="text-sm leading-6 text-slate-600">
              Your account is ready. Sign in with your email and new password.
            </p>
            <Link
              to="/"
              className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create your account password to join FlowTenant.
            </p>
            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Full name
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                New password
                <input
                  required
                  minLength={6}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Confirm password
                <input
                  required
                  minLength={6}
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <button
                type="submit"
                disabled={submitting || !token}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Creating account…' : 'Set password and accept'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

export default AcceptInvitation
