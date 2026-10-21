import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  AtSign,
  CalendarDays,
  CheckCircle2,
  Mail,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Platform_Admin_Sidebar";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL || "http://localhost:3000";

const INVITABLE_ROLES = [
  { value: "ORGANIZATION_ADMIN", label: "Organization Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "EMPLOYEE", label: "Employee" },
];

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getMessage = (error, fallback) => {
  const message =
    error.response?.data?.message || error.response?.data?.error || fallback;
  return Array.isArray(message) ? message.join(", ") : message;
};

const formatDate = (date) => {
  if (!date) return "Not available";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Not available";

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getInitials = (name = "Organization") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const View_organization = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("ORGANIZATION_ADMIN");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviting, setInviting] = useState(false);

  const fetchOrganization = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const [organizationResponse, usersResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/platform/organizations/${encodeURIComponent(id)}`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/users/`, {
          params: { organizationId: id },
          headers: getAuthHeaders(),
        }),
      ]);

      const organizationData = organizationResponse.data;
      const usersData = usersResponse.data;
      const users = Array.isArray(usersData)
        ? usersData
        : usersData.users || usersData.data || [];

      setOrganization(organizationData.organization || organizationData.data || organizationData);
      setAdmins(users.filter((user) => user.role === "ORGANIZATION_ADMIN"));
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      setOrganization(null);
      setAdmins([]);
      setError(getMessage(err, "Unable to load organization details."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const handleInvite = async (event) => {
    event.preventDefault();
    const email = inviteEmail.trim();

    if (!email) {
      setInviteError("Admin email is required.");
      return;
    }

    try {
      setInviting(true);
      setInviteError("");
      setInviteSuccess("");

      await axios.post(
        `${API_BASE_URL}/invitations`,
        { email, role: inviteRole, organizationId: id },
        { headers: getAuthHeaders() }
      );

      setInviteEmail("");
      setInviteSuccess(
        `Invitation sent to ${email} as ${
          INVITABLE_ROLES.find((role) => role.value === inviteRole)?.label
        }.`
      );
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      setInviteError(getMessage(err, "Unable to send the invitation."));
    } finally {
      setInviting(false);
    }
  };

  const organizationName = organization?.name || "Organization";
  const userCount = organization?._count?.users ?? organization?.userCount ?? 0;
  const status = organization?.status || "UNKNOWN";

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <Sidebar activeItem="Organizations" />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <button
          type="button"
          onClick={() => navigate("/platform/organizations")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to organizations
        </button>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="text-center">
              <RefreshCw className="mx-auto animate-spin text-blue-600" size={30} />
              <p className="mt-3 text-sm text-slate-500">Loading organization...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <p className="font-semibold">Unable to load organization</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={fetchOrganization}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-sm">
                  {getInitials(organizationName)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {organizationName}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Organization details and administration
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex self-start rounded-full px-3 py-1.5 text-xs font-semibold sm:self-auto ${
                  status.toUpperCase() === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
              </span>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Total users</p>
                  <Users className="text-blue-600" size={21} />
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900">{userCount}</p>
                <p className="mt-1 text-xs text-slate-500">Members in this organization</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Organization slug</p>
                  <AtSign className="text-blue-600" size={21} />
                </div>
                <p className="mt-3 truncate text-2xl font-bold text-slate-900">{organization.slug || "—"}</p>
                <p className="mt-1 text-xs text-slate-500">Unique organization identifier</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Created</p>
                  <CalendarDays className="text-blue-600" size={21} />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{formatDate(organization.createdAt)}</p>
                <p className="mt-1 text-xs text-slate-500">Organization creation date</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Organization admin</h2>
                    <p className="mt-1 text-sm text-slate-500">People responsible for managing this organization.</p>
                  </div>
                  <Users size={21} className="text-blue-600" />
                </div>

                {admins.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="font-semibold text-slate-700">No admin assigned</p>
                    <p className="mt-1 text-sm text-slate-500">Invite an administrator using the form.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {admins.map((admin) => (
                      <div key={admin.id} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {getInitials(admin.name || admin.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{admin.name || "Unnamed admin"}</p>
                          <p className="truncate text-sm text-slate-500">{admin.email}</p>
                        </div>
                        <span className="ml-auto hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:inline-flex">
                          Admin
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-slate-900">Invite a user</h2>
                  <p className="mt-1 text-sm text-slate-500">Send an invitation with the appropriate organization role.</p>
                </div>

                {inviteError && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{inviteError}</p>}
                {inviteSuccess && (
                  <p className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <CheckCircle2 size={17} />
                    {inviteSuccess}
                  </p>
                )}

                <form onSubmit={handleInvite}>
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="invite-email">
                    User email
                  </label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input
                      id="invite-email"
                      required
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => {
                        setInviteEmail(event.target.value);
                        setInviteError("");
                      }}
                      placeholder="admin@example.com"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="invite-role">
                    Role
                  </label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    {INVITABLE_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send size={17} />
                    {inviting ? "Sending invitation..." : "Send invitation"}
                  </button>
                </form>
              </section>
            </div>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-xl font-bold text-slate-900">Organization information</h2>
              <div className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-slate-500">Organization ID</p>
                  <p className="mt-1 break-all font-medium text-slate-900">{organization.id}</p>
                </div>
                <div>
                  <p className="text-slate-500">Last updated</p>
                  <p className="mt-1 font-medium text-slate-900">{formatDate(organization.updatedAt)}</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default View_organization;
