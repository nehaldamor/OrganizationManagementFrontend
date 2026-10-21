
import React, { useEffect, useState, useCallback } from "react";
import {
  Bell,
  CheckSquare,
  ChevronDown,
  Folder,
  MoreVertical,
  Settings,
  Users,
  UsersRound,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Sidebar from "../../components/Admin_sideBar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const avatarColors = [
  "bg-blue-100 text-blue-900",
  "bg-pink-100 text-pink-800",
  "bg-indigo-100 text-indigo-900",
  "bg-amber-100 text-amber-800",
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const formatRole = (role = "EMPLOYEE") =>
  role
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const Home = () => {
  const navigate = useNavigate();
  const [storedUser] = useState(getStoredUser);
  const organizationId = storedUser.organizationId;

  const [users, setUsers] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [showOrganizations, setShowOrganizations] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [searchText, setSearchText] = useState("");

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }, [navigate]);

  
const fetchDashboardData = useCallback(async () => {
  if (!organizationId) {
    setError("Organization ID was not found in localStorage.");
    setLoading(false);
    return;
  }

  setLoading(true);
  setError("");

  try {
    const [usersResponse, organizationResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/users/`, {
        params: { organizationId },
        headers: getAuthHeaders(),
      }),
      axios.get(
        `${API_BASE_URL}/platform/organizations/${encodeURIComponent(
          organizationId
        )}`,
        { headers: getAuthHeaders() }
      ),
    ]);

    // Axios provides response data directly in .data
    const usersData = usersResponse.data;
    const organizationData = organizationResponse.data;

    const normalizedUsers = Array.isArray(usersData)
      ? usersData
      : usersData.users || usersData.data || [];

    const normalizedOrganization =
      organizationData.organization ||
      organizationData.data ||
      organizationData;

    // Verify that users belong to the selected organization.
    const mismatchedUsers = normalizedUsers.filter(
      (user) => user.organizationId !== organizationId
    );

    if (mismatchedUsers.length > 0) {
      throw new Error(
        "The users API returned users from a different organization. Please verify backend tenant filtering."
      );
    }

    setUsers(normalizedUsers);
    setOrganization(normalizedOrganization);
  } catch (err) {
    if (err.response?.status === 401) {
      handleUnauthorized();
      return;
    }

    const message =
      err.response?.data?.message ||
      err.message ||
      "Unable to load dashboard data.";

    setError(
      Array.isArray(message) ? message.join(", ") : message
    );

    setUsers([]);
    setOrganization(null);
  } finally {
    setLoading(false);
  }
}, [organizationId, handleUnauthorized]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredUsers = users.filter((user) => {
    const search = searchText.toLowerCase();

    return (
      (user.name || "").toLowerCase().includes(search) ||
      (user.email || "").toLowerCase().includes(search) ||
      (user.role || "").toLowerCase().includes(search)
    );
  });

  const organizationName =
    organization?.name ||
    organization?.organization?.name ||
    "Organization";

  const stats = [
    {
      label: "Total Users",
      value: users.length,
      description: "Organization members",
      icon: UsersRound,
    },
    {
      label: "Total Teams",
      value: "—",
      description: "Teams in your organization",
      icon: Users,
    },
    {
      label: "Total Projects",
      value: "—",
      description: "Projects in your organization",
      icon: Folder,
    },
    {
      label: "Total Tasks",
      value: "—",
      description: "Tasks in your organization",
      icon: CheckSquare,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex min-h-screen">
        {/* Separate Sidebar Component */}
        <Sidebar
          user={storedUser}
          activeNav={activeNav}
          onNavigate={setActiveNav}
        />

        {/* Main Content */}
        <main className="min-w-0 flex-1 bg-white px-7 py-7 max-sm:px-4">
          {/* Header */}
          <header className="mb-8 flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-500">Organization workspace</p>
              <p className="mt-1 text-sm text-slate-400">Keep track of your team activity</p>
            </div>

            <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="rounded-xl p-2.5 text-blue-600 transition hover:bg-blue-50"
            >
              <Bell size={23} />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowOrganizations((previous) => !previous)
                }
                className="flex max-w-[260px] items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:bg-slate-50"
              >
                <span className="truncate">{organizationName}</span>
                <ChevronDown size={18} />
              </button>

              {showOrganizations && (
                <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                  <p className="text-sm font-semibold">
                    {organizationName}
                  </p>
                  <p className="mt-2 break-all text-xs text-slate-500">
                    Organization ID: {organizationId || "Not available"}
                  </p>
                </div>
              )}
            </div>
            </div>
          </header>

          {/* Welcome */}
          <section className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Dashboard overview
            </p>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight text-[#10213e] max-sm:text-2xl">
              Welcome back, {storedUser.name || "User"}
            </h1>
            <p className="mt-1 text-lg text-slate-500">
              Here’s what’s happening with your organization today.
            </p>
          </section>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />

              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  Unable to load dashboard data
                </p>
                <p className="mt-1 break-words">{error}</p>
              </div>

              <button
                type="button"
                onClick={fetchDashboardData}
                className="flex shrink-0 items-center gap-1 font-semibold hover:underline"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          )}

          {/* Statistics Cards */}
          <section className="mb-8 grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
            {stats.map(({ label, value, description, icon: Icon }, index) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-[0_5px_25px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-500">{label}</p>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${index === 0 ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"}`}>
                    <Icon size={21} />
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <p className="text-[38px] font-bold leading-none tracking-tight text-[#10213e]">
                    {loading && label === "Total Users" ? (
                      <LoaderCircle className="h-9 w-9 animate-spin text-blue-600" />
                    ) : (
                      value
                    )}
                  </p>

                </div>

                <p className="mt-5 text-xs font-medium text-slate-500">
                  <span className="mr-1">✦</span>
                  {description}
                </p>
              </div>
            ))}
          </section>

          {/* Users Table */}
          <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_5px_25px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-8 py-6 max-sm:px-4">
              <div>
                <h2 className="text-[22px] font-bold text-[#10213e]">
                  {activeNav === "Dashboard" ? "Recent Users" : activeNav}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {users.length} organization members
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  placeholder="Search users..."
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  className="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={fetchDashboardData}
                  title="Refresh users"
                  className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                >
                  <RefreshCw
                    size={19}
                    className={loading ? "animate-spin" : ""}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveNav("Users")}
                  className="whitespace-nowrap font-medium text-blue-600 hover:text-blue-800"
                >
                  View all
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm font-semibold text-[#10213e]">
                    <th className="px-8 py-4">Name</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-14 text-center">
                        <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-blue-600" />
                        <p className="mt-3 text-sm text-slate-500">
                          Loading users...
                        </p>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-14 text-center text-slate-500"
                      >
                        {error ? "Unable to load users." : "No users found."}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.slice(0, 5).map((user, index) => (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                avatarColors[index % avatarColors.length]
                              }`}
                            >
                              {getInitials(user.name)}
                            </div>

                            <span className="font-semibold text-[#10213e]">
                              {user.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          {user.email}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex whitespace-nowrap rounded-lg bg-[#edf2fc] px-3 py-1.5 text-sm font-medium text-[#10213e]">
                            {formatRole(user.role)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-lg px-3 py-1.5 text-sm font-semibold ${
                              user.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {user.status
                              ? user.status.charAt(0) +
                                user.status.slice(1).toLowerCase()
                              : "Unknown"}
                          </span>
                        </td>

                        <td className="relative px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenu(
                                openMenu === user.id ? null : user.id
                              )
                            }
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label={`Actions for ${user.name}`}
                          >
                            <MoreVertical size={19} />
                          </button>

                          {openMenu === user.id && (
                            <div className="absolute right-8 top-12 z-10 w-40 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenu(null);
                                  window.alert(
                                    `${user.name}\n${user.email}\nRole: ${formatRole(
                                      user.role
                                    )}\nStatus: ${user.status}`
                                  );
                                }}
                                className="w-full rounded-md px-3 py-2 text-sm hover:bg-slate-50"
                              >
                                View details
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  setOpenMenu(null);
                                  try {
                                    await navigator.clipboard.writeText(
                                      user.email
                                    );
                                  } catch {
                                    window.alert(user.email);
                                  }
                                }}
                                className="w-full rounded-md px-3 py-2 text-sm hover:bg-slate-50"
                              >
                                Copy email
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-8 py-4 text-sm text-slate-500 max-sm:px-4">
              <span>
                Showing {Math.min(filteredUsers.length, 5)} of{" "}
                {filteredUsers.length} users
              </span>
              <span>FlowTenant Organization Management</span>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-6 flex items-center justify-between gap-3 text-xs text-slate-400">
            <p>© 2026 FlowTenant. All rights reserved.</p>

            <div className="flex items-center gap-2">
              <Settings size={14} />
              <span>{formatRole(storedUser.role || "EMPLOYEE")}</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Home;
