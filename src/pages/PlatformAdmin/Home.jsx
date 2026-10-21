import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Platform_Admin_Sidebar";

const API_URL =
  import.meta.env?.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/platform/organizations/`
    : "http://localhost:3000/platform/organizations/";

const Home = () => {
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [openMenu, setOpenMenu] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Clear session and redirect to login
  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }, [navigate]);

  // Fetch organizations
  const fetchOrganizations = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(API_URL, {
          params: { page: currentPage, limit },
          headers: getAuthHeaders(),
          signal,
        });

        const data = response.data;

        setOrganizations(data.organizations ?? data.data ?? []);
        setTotalPages(
          data.meta?.totalPages ?? data.pagination?.totalPages ?? 1
        );
        setTotalItems(
          data.meta?.totalItems ?? data.pagination?.totalItems ?? 0
        );
      } catch (err) {
        // Ignore cancelled requests
        if (axios.isCancel(err) || err.code === "ERR_CANCELED") return;

        // Axios throws on 401, so it must be handled here
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        setError(
          err.response?.data?.message || "Failed to load organizations."
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [currentPage, limit, handleUnauthorized]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchOrganizations(controller.signal);
    return () => controller.abort();
  }, [fetchOrganizations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (openMenu === null) return;

    const handleClickOutside = (event) => {
      if (!event.target.closest("[data-actions-menu]")) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  // Activate or suspend organization
  const handleStatusChange = async (organization) => {
    const newStatus =
      organization.status?.toUpperCase() === "ACTIVE"
        ? "SUSPENDED"
        : "ACTIVE";

    try {
      setUpdatingId(organization.id);
      setActionError("");
      setOpenMenu(null);

      await axios.patch(
        `${API_URL}${organization.id}/status`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );

      setOrganizations((previous) =>
        previous.map((item) =>
          item.id === organization.id ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setActionError(
        err.response?.data?.message ||
          `Failed to ${
            newStatus === "ACTIVE" ? "activate" : "suspend"
          } organization. Check the API endpoint and permissions.`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Format date
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

  // Status badge styles
  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "SUSPENDED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const handleCreateOrganization = () => {
    navigate("/platform/organizations/create");
  };

  const handleViewOrganization = (organization) => {
    setOpenMenu(null);
    navigate(`/platform/organizations/${organization.id}`);
  };

  const handleRetry = () => {
    fetchOrganizations();
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <Sidebar activeItem="Organizations" />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {/* Header */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Organizations
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage all organizations on the platform.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateOrganization}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 sm:self-auto"
          >
            <span className="text-lg leading-none">+</span>
            Create Organization
          </button>
        </div>

        {/* Status action error */}
        {actionError && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError("")}
              className="shrink-0 font-semibold"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Organizations table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500">
                  <th className="px-5 py-4 sm:px-6">Name</th>
                  <th className="px-5 py-4 sm:px-6">Slug</th>
                  <th className="px-5 py-4 sm:px-6">Status</th>
                  <th className="px-5 py-4 sm:px-6">Created At</th>
                  <th className="px-5 py-4 text-center sm:px-6">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                        <p className="text-sm text-slate-500">
                          Loading organizations...
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-sm text-red-600">{error}</p>
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Try again
                      </button>
                    </td>
                  </tr>
                )}

                {!loading && !error && organizations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <h3 className="font-semibold text-slate-900">
                        No organizations found
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Create your first organization to get started.
                      </p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  organizations.map((organization) => {
                    const isActive =
                      organization.status?.toUpperCase() === "ACTIVE";
                    const isUpdating = updatingId === organization.id;
                    const isMenuOpen = openMenu === organization.id;

                    return (
                      <tr
                        key={organization.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                              {organization.name?.charAt(0).toUpperCase() ||
                                "O"}
                            </div>
                            <span className="font-medium text-slate-700">
                              {organization.name || "Unnamed organization"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                          {organization.slug || "—"}
                        </td>

                        <td className="px-5 py-4 sm:px-6">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                              organization.status
                            )}`}
                          >
                            {organization.status
                              ? organization.status.charAt(0).toUpperCase() +
                                organization.status.slice(1).toLowerCase()
                              : "Unknown"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 sm:px-6">
                          {formatDate(organization.createdAt)}
                        </td>

                        {/* Actions dropdown */}
                        <td className="px-5 py-4 text-center sm:px-6">
                          <div
                            data-actions-menu
                            className="relative inline-block text-left"
                          >
                            <button
                              type="button"
                              aria-label={`Actions for ${organization.name}`}
                              aria-expanded={isMenuOpen}
                              disabled={isUpdating}
                              onClick={() =>
                                setOpenMenu((previous) =>
                                  previous === organization.id
                                    ? null
                                    : organization.id
                                )
                              }
                              className="rounded-lg px-3 py-1 text-xl font-bold leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                            >
                              {isUpdating ? "..." : "···"}
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 text-left shadow-xl">
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() =>
                                    handleStatusChange(organization)
                                  }
                                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition disabled:opacity-50 ${
                                    isActive
                                      ? "text-red-600 hover:bg-red-50"
                                      : "text-green-700 hover:bg-green-50"
                                  }`}
                                >
                                  {isActive ? "Suspend" : "Activate"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleViewOrganization(organization)
                                  }
                                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  View
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!loading && !error && totalItems > 0 && (
          <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {(currentPage - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-700">
                {Math.min(currentPage * limit, totalItems)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-700">{totalItems}</span>{" "}
              organizations
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage((page) => page - 1)}
                className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    type="button"
                    key={page}
                    disabled={loading}
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-medium transition ${
                      currentPage === page
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((page) => page + 1)}
                className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;