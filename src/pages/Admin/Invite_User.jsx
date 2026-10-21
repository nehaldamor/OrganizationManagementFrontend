import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  Mail,
  Send,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Admin_sideBar";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const roles = [
  { value: "ORGANIZATION_ADMIN", label: "Organization Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "EMPLOYEE", label: "Employee" },
];

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

const getMessage = (error, fallback) => {
  const message = error.response?.data?.message || error.message || fallback;
  return Array.isArray(message) ? message.join(", ") : message;
};

const Invite_User = () => {
  const navigate = useNavigate();
  const [storedUser] = useState(getStoredUser);
  const organizationId = storedUser.organizationId;
  const [specialities, setSpecialities] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    role: "EMPLOYEE",
    specialityId: "",
  });
  const [loadingSpecialities, setLoadingSpecialities] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }, [navigate]);

  const fetchSpecialities = useCallback(async () => {
    if (!organizationId) {
      setError("Organization ID was not found in localStorage.");
      setLoadingSpecialities(false);
      return;
    }

    try {
      setLoadingSpecialities(true);
      const response = await axios.get(`${API_BASE_URL}/speciality`, {
        headers: getAuthHeaders(),
      });
      const data = response.data;
      setSpecialities(Array.isArray(data) ? data : data.specialities || data.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(getMessage(err, "Unable to load specialities."));
    } finally {
      setLoadingSpecialities(false);
    }
  }, [organizationId, handleUnauthorized]);

  useEffect(() => {
    fetchSpecialities();
  }, [fetchSpecialities]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!organizationId) {
      setError("Organization ID was not found in localStorage.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        email: formData.email.trim(),
        role: formData.role,
        organizationId,
        ...(formData.specialityId ? { specialityId: formData.specialityId } : {}),
      };

      await axios.post(`${API_BASE_URL}/invitations`, payload, {
        headers: getAuthHeaders(),
      });

      setFormData({ email: "", role: "EMPLOYEE", specialityId: "" });
      setSuccess("Invitation sent successfully. The user can now accept it by email.");
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(getMessage(err, "Unable to send invitation."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar user={storedUser} activeNav="Users" />

        <main className="min-w-0 flex-1 bg-slate-50 px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
          <button
            type="button"
            onClick={() => navigate("/home/users")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to users
          </button>

          <div className="mx-auto max-w-3xl">
            <div className="mb-7">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <UserPlus size={25} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#10213e]">Invite a user</h1>
              <p className="mt-2 text-sm text-slate-500">
                Add a member to your organization with the right role and speciality.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_5px_25px_rgba(15,23,42,0.06)] sm:p-8">
              {error && (
                <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div role="status" className="mb-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Email address</span>
                <div className="relative mt-2">
                  <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </label>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Role</span>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Speciality</span>
                  <div className="relative mt-2">
                    <ClipboardList className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                    <select
                      name="specialityId"
                      value={formData.specialityId}
                      onChange={handleChange}
                      disabled={loadingSpecialities}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-wait disabled:bg-slate-50"
                    >
                      <option value="">No speciality</option>
                      {specialities.map((speciality) => (
                        <option key={speciality.id} value={speciality.id}>
                          {speciality.name} ({speciality.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="mt-2 block text-xs text-slate-500">
                    Optional. The speciality is assigned when the invitation is accepted.
                  </span>
                </label>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => navigate("/home/users")}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}
                  {submitting ? "Sending..." : "Send invitation"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Invite_User;
