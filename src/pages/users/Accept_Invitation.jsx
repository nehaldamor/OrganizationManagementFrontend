import React, { useMemo, useState } from "react";
import axios from "axios";
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, UserRound } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_URL =
  import.meta.env?.VITE_API_URL || "http://localhost:3000";

const getMessage = (error, fallback) => {
  const message =
    error.response?.data?.message || error.response?.data?.error || fallback;
  return Array.isArray(message) ? message.join(", ") : message;
};

const Accept_Invitation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("This invitation link is missing its invitation token.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await axios.post(`${API_URL}/invitations/accept`, {
        token,
        name: formData.name.trim(),
        password: formData.password,
      });

      setSuccess(true);
      window.setTimeout(() => navigate("/", { replace: true }), 1200);
    } catch (err) {
      setError(getMessage(err, "Unable to accept this invitation."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/50 to-blue-50 px-4 py-8">
      <main className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
            <KeyRound size={25} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Organiq</h1>
          <p className="mt-1 text-sm text-slate-500">Organization Management</p>
        </div>

        <section className="rounded-2xl border border-white/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-9">
          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Accept invitation
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Create your account password to join the organization.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success ? (
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 size={18} />
                Invitation accepted successfully.
              </div>
              <p className="mt-2">Redirecting you to the login page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                  <input
                    required
                    name="name"
                    type="text"
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
                <div className="relative">
                  <input
                    required
                    name="password"
                    type={showPassword ? "text" : "password"}
                    minLength={6}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-indigo-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</span>
                <div className="relative">
                  <input
                    required
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={6}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((previous) => !previous)}
                    aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-indigo-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && <LoaderCircle size={19} className="animate-spin" />}
                {loading ? "Creating account..." : "Create password"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
};

export default Accept_Invitation;
