import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { RefreshCw, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Platform_Admin_Sidebar";

const API_URL =
  import.meta.env?.VITE_API_URL || "http://localhost:3000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getMessage = (error, fallback) => {
  const message = error.response?.data?.message || fallback;
  return Array.isArray(message) ? message.join(", ") : message;
};

const roleLabel = (role = "") =>
  role
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const userStatuses = ["ACTIVE", "SUSPENDED", "INACTIVE"];

const statusStyles = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-slate-200 text-slate-700",
};

const getInitials = (name = "User") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const Users = () => {
  const navigate = useNavigate();
  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}") || {};
    } catch {
      return {};
    }
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/users/organization-admins`, {
        headers: getAuthHeaders(),
      });

      const data = response.data;
      setUsers(Array.isArray(data) ? data : data.users || data.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      setError(getMessage(err, "Unable to load administrators."));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (user, nextStatus) => {
    if (user.status === nextStatus) return;

    try {
      setUpdatingId(user.id);
      setError("");

      const response = await axios.patch(
        `${API_URL}/users/${user.id}`,
        { status: nextStatus },
        { headers: getAuthHeaders() }
      );

      const updatedUser = response.data;
      setUsers((previous) =>
        previous.map((item) =>
          item.id === user.id ? { ...item, ...updatedUser, status: nextStatus } : item
        )
      );
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      setError(getMessage(err, "Unable to update user status."));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <Sidebar activeItem="Users" />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Administrators
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage organization administrators across FlowTenant.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 sm:self-auto"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Total admins</p>
              <UsersRound className="text-blue-600" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{users.length}</p>
            <p className="mt-1 text-xs text-slate-500">Organization administrators</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Active</p>
              <ShieldCheck className="text-emerald-600" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {users.filter((user) => user.status === "ACTIVE").length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Admins with active access</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Suspended</p>
              <UserRound className="text-red-600" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {users.filter((user) => user.status === "SUSPENDED").length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Temporarily blocked admins</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Inactive</p>
              <UserRound className="text-slate-500" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {users.filter((user) => user.status === "INACTIVE").length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Inactive admin accounts</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {error && (
            <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-14 text-center">
              <RefreshCw className="mx-auto animate-spin text-blue-600" size={28} />
              <p className="mt-3 text-sm text-slate-500">Loading administrators...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-14 text-center text-sm text-slate-500">No administrators found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500">
                    <th className="px-5 py-4 sm:px-6">Administrator</th>
                    <th className="px-5 py-4 sm:px-6">Role</th>
                    <th className="px-5 py-4 sm:px-6">Organization</th>
                    <th className="px-5 py-4 sm:px-6">Status</th>
                    <th className="px-5 py-4 text-right sm:px-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const isCurrentUser = user.id === currentUser.id;
                    const isUpdating = updatingId === user.id;
                    return (
                      <tr key={user.id} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {getInitials(user.name || user.email)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-800">{user.name}</p>
                              <p className="truncate text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">{roleLabel(user.role)}</td>
                        <td className="px-5 py-4 sm:px-6">
                          {user.organization ? (
                            <div>
                              <p className="font-medium text-slate-700">{user.organization.name}</p>
                              <p className="text-xs text-slate-500">{user.organization.slug}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">Platform</span>
                          )}
                        </td>
                        <td className="px-5 py-4 sm:px-6">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[user.status] || "bg-slate-100 text-slate-600"}`}>
                            {user.status ? roleLabel(user.status) : "Unknown"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right sm:px-6">
                          <select
                            value={user.status || "INACTIVE"}
                            disabled={isCurrentUser || isUpdating}
                            onChange={(event) => handleStatusChange(user, event.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title={isCurrentUser ? "You cannot change your own status" : "Change user status"}
                          >
                            {userStatuses.map((status) => (
                              <option key={status} value={status}>
                                {isUpdating && status === user.status ? "Updating..." : roleLabel(status)}
                              </option>
                            ))}
                          </select>
                        </td>
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

export default Users;
