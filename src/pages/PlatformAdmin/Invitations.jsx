import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Mail, RefreshCw, Send, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Platform_Admin_Sidebar";

const API_URL =
  import.meta.env?.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/invitations`
    : "http://localhost:3000/invitations";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getMessage = (error) => {
  const message =
    error.response?.data?.message || "Unable to load invitations.";
  return Array.isArray(message) ? message.join(", ") : message;
};

const formatDate = (date) => {
  if (!date) return "—";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getInvitationStatus = (invitation) => {
  if (invitation.acceptedAt) return "Accepted";
  if (new Date(invitation.expiresAt).getTime() <= Date.now()) return "Expired";
  return "Pending";
};

const statusStyle = {
  Accepted: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Expired: "bg-red-100 text-red-700",
};

const roleLabel = (role = "") =>
  role
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const Invitations = () => {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL, { headers: getAuthHeaders() });
      const data = response.data;
      const items = Array.isArray(data) ? data : data.invitations || data.data || [];

      setInvitations(items);
      setTotal(data.total ?? items.length);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      setError(getMessage(err));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <Sidebar activeItem="Invitations" />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Invitations
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Invitations sent by you across the platform.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchInvitations}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 sm:self-auto"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Total invited users</p>
              <Send className="text-blue-600" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{total}</p>
            <p className="mt-1 text-xs text-slate-500">Invitations sent by your account</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Accepted</p>
              <Users className="text-emerald-600" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {invitations.filter((item) => getInvitationStatus(item) === "Accepted").length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Users who completed setup</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <Mail className="text-amber-600" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {invitations.filter((item) => getInvitationStatus(item) === "Pending").length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Awaiting acceptance</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {error ? (
            <div className="p-10 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={fetchInvitations}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="p-14 text-center">
              <RefreshCw className="mx-auto animate-spin text-blue-600" size={28} />
              <p className="mt-3 text-sm text-slate-500">Loading invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="p-14 text-center">
              <Mail className="mx-auto text-slate-300" size={34} />
              <h2 className="mt-3 font-semibold text-slate-900">No invitations yet</h2>
              <p className="mt-1 text-sm text-slate-500">Invitations you send will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500">
                    <th className="px-5 py-4 sm:px-6">Email</th>
                    <th className="px-5 py-4 sm:px-6">Organization</th>
                    <th className="px-5 py-4 sm:px-6">Role</th>
                    <th className="px-5 py-4 sm:px-6">Sent</th>
                    <th className="px-5 py-4 sm:px-6">Status</th>
                    <th className="px-5 py-4 sm:px-6">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invitations.map((invitation) => {
                    const status = getInvitationStatus(invitation);
                    return (
                      <tr key={invitation.id} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-4 font-medium text-slate-700 sm:px-6">{invitation.email}</td>
                        <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                          {invitation.organization?.name || "Platform"}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">{roleLabel(invitation.role)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 sm:px-6">{formatDate(invitation.createdAt)}</td>
                        <td className="px-5 py-4 sm:px-6">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[status]}`}>
                            {status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 sm:px-6">{formatDate(invitation.expiresAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Invitations;
