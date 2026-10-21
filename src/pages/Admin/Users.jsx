import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { RefreshCw, Search, UserPlus, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Admin_sideBar";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const roles = ["ORGANIZATION_ADMIN", "MANAGER", "EMPLOYEE"];
const statuses = ["ACTIVE", "SUSPENDED", "INACTIVE"];

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatLabel = (value = "") =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getInitials = (name = "User") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getMessage = (error, fallback) => {
  const message = error.response?.data?.message || error.message || fallback;
  return Array.isArray(message) ? message.join(", ") : message;
};

const getSpecialityNames = (user) => {
  const specialities = user.userspeciality || user.userSpeciality || [];
  return specialities
    .map((item) => item.speciality?.name || item.name)
    .filter(Boolean)
    .join(", ");
};

const statusStyles = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-slate-200 text-slate-700",
};

const Users = () => {
  const navigate = useNavigate();
  const [storedUser] = useState(getStoredUser);
  const organizationId = storedUser.organizationId;
  const [users, setUsers] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [specialityUpdatingId, setSpecialityUpdatingId] = useState(null);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }, [navigate]);

  const fetchUsers = useCallback(async () => {
    if (!organizationId) {
      setError("Organization ID was not found in localStorage.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [usersResponse, specialitiesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/users/`, {
          params: { organizationId },
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/speciality`, {
          headers: getAuthHeaders(),
        }),
      ]);

      const usersData = usersResponse.data;
      const specialitiesData = specialitiesResponse.data;
      setUsers(Array.isArray(usersData) ? usersData : usersData.users || usersData.data || []);
      setSpecialities(
        Array.isArray(specialitiesData)
          ? specialitiesData
          : specialitiesData.specialities || specialitiesData.data || []
      );
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setUsers([]);
      setError(getMessage(err, "Unable to load organization users."));
    } finally {
      setLoading(false);
    }
  }, [organizationId, handleUnauthorized]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = async (user, changes) => {
    try {
      setUpdatingId(user.id);
      setError("");

      const response = await axios.patch(
        `${API_BASE_URL}/users/${user.id}`,
        changes,
        { headers: getAuthHeaders() }
      );

      setUsers((previous) =>
        previous.map((item) =>
          item.id === user.id ? { ...item, ...response.data, ...changes } : item
        )
      );
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(getMessage(err, "Unable to update user."));
    } finally {
      setUpdatingId(null);
    }
  };

  const updateUserSpeciality = async (user, specialityId) => {
    try {
      setSpecialityUpdatingId(user.id);
      setError("");

      const response = await axios.patch(
        `${API_BASE_URL}/users/${user.id}/speciality`,
        { specialityId: specialityId || null },
        { headers: getAuthHeaders() }
      );

      setUsers((previous) =>
        previous.map((item) =>
          item.id === user.id ? { ...item, ...response.data } : item
        )
      );
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(getMessage(err, "Unable to update user speciality."));
    } finally {
      setSpecialityUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const search = searchText.toLowerCase();
    return [
      user.name,
      user.email,
      user.role,
      getSpecialityNames(user),
    ].some((value) => (value || "").toLowerCase().includes(search));
  });

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar user={storedUser} activeNav="Users" />

        <main className="min-w-0 flex-1 bg-slate-50 px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
          <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Team management
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[#10213e]">
                Users
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage your organization members, roles, statuses, and specialities.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => navigate("/home/users/invite")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <UserPlus size={17} />
                Invite user
              </button>
              <button
                type="button"
                onClick={fetchUsers}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>
              <button type="button" onClick={fetchUsers} className="font-semibold hover:underline">
                Try again
              </button>
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_25px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UsersRound size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#10213e]">Organization members</h2>
                  <p className="text-sm text-slate-500">{users.length} total users</p>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search users..."
                  className="w-64 rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center">
                <RefreshCw className="mx-auto animate-spin text-blue-600" size={28} />
                <p className="mt-3 text-sm text-slate-500">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-16 text-center text-sm text-slate-500">
                {users.length === 0 ? "No users found in this organization." : "No users match your search."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-4 sm:px-7">User</th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4">Speciality</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right sm:px-7">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => {
                      const isCurrentUser = user.id === storedUser.id;
                      const isUpdating = updatingId === user.id;
                      const specialityName = getSpecialityNames(user);
                      const specialityId =
                        user.userspeciality?.[0]?.speciality?.id ||
                        user.userSpeciality?.[0]?.speciality?.id ||
                        "";

                      return (
                        <tr key={user.id} className="transition hover:bg-slate-50/70">
                          <td className="px-5 py-4 sm:px-7">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                {getInitials(user.name || user.email)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-[#10213e]">{user.name}</p>
                                <p className="truncate text-sm text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <select
                              value={user.role}
                              disabled={isCurrentUser || isUpdating}
                              onChange={(event) => updateUser(user, { role: event.target.value })}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                              title={isCurrentUser ? "You cannot change your own role" : "Change role"}
                            >
                              {roles.map((role) => (
                                <option key={role} value={role}>{formatLabel(role)}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            <select
                              value={specialityId}
                              disabled={isCurrentUser || specialityUpdatingId === user.id}
                              onChange={(event) => updateUserSpeciality(user, event.target.value)}
                              className="max-w-[210px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                              title={isCurrentUser ? "You cannot change your own speciality" : "Change speciality"}
                            >
                              <option value="">Not assigned</option>
                              {specialities.map((speciality) => (
                                <option key={speciality.id} value={speciality.id}>
                                  {speciality.name}
                                </option>
                              ))}
                            </select>
                            {!specialities.length && !specialityName && (
                              <span className="ml-2 text-xs text-slate-400">No options</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[user.status] || "bg-slate-100 text-slate-600"}`}>
                              {formatLabel(user.status || "UNKNOWN")}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right sm:px-7">
                            <select
                              value={user.status || "INACTIVE"}
                              disabled={isCurrentUser || isUpdating}
                              onChange={(event) => updateUser(user, { status: event.target.value })}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                              title={isCurrentUser ? "You cannot change your own status" : "Change status"}
                            >
                              {statuses.map((status) => (
                                <option key={status} value={status}>{formatLabel(status)}</option>
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
    </div>
  );
};

export default Users;
