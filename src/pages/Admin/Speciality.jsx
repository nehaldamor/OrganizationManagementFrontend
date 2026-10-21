import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  ClipboardList,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Admin_sideBar";

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

const getMessage = (error, fallback) => {
  const message = error.response?.data?.message || error.message || fallback;
  return Array.isArray(message) ? message.join(", ") : message;
};

const Speciality = () => {
  const navigate = useNavigate();
  const [storedUser] = useState(getStoredUser);
  const organizationId = storedUser.organizationId;
  const [specialities, setSpecialities] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }, [navigate]);

  const fetchSpecialities = useCallback(async () => {
    if (!organizationId) {
      setError("Organization ID was not found in localStorage.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

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
      setLoading(false);
    }
  }, [organizationId, handleUnauthorized]);

  useEffect(() => {
    fetchSpecialities();
  }, [fetchSpecialities]);

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!organizationId) {
      setError("Organization ID was not found in localStorage.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const response = await axios.post(
        `${API_BASE_URL}/speciality`,
        {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || undefined,
          organizationId,
        },
        { headers: getAuthHeaders() }
      );

      setSpecialities((previous) => [response.data, ...previous]);
      setFormData({ name: "", code: "", description: "" });
      setSuccess("Speciality created successfully.");
      setShowForm(false);
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(getMessage(err, "Unable to create speciality."));
    } finally {
      setCreating(false);
    }
  };

  const filteredSpecialities = specialities.filter((speciality) => {
    const search = searchText.toLowerCase();
    return [speciality.name, speciality.code, speciality.description].some((value) =>
      (value || "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar user={storedUser} activeNav="Speciality" />

        <main className="min-w-0 flex-1 bg-slate-50 px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
          <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Organization setup
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[#10213e]">Specialities</h1>
              <p className="mt-2 text-sm text-slate-500">
                Create and manage specialities for your organization.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowForm((previous) => !previous)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Create speciality
              </button>
              <button
                type="button"
                onClick={fetchSpecialities}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>
              <button type="button" onClick={fetchSpecialities} className="font-semibold hover:underline">Try again</button>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
          )}

          {showForm && (
            <form onSubmit={handleCreate} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><ClipboardList size={21} /></div>
                <div>
                  <h2 className="font-bold text-[#10213e]">New speciality</h2>
                  <p className="text-sm text-slate-500">This speciality will belong to your organization.</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Name</span>
                  <input required minLength={2} maxLength={100} name="name" value={formData.name} onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))} placeholder="Frontend Development" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Code</span>
                  <input required minLength={2} maxLength={50} name="code" value={formData.code} onChange={(event) => setFormData((previous) => ({ ...previous, code: event.target.value }))} placeholder="FE-DEV" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                </label>
              </div>
              <label className="mt-5 block">
                <span className="text-sm font-semibold text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></span>
                <textarea maxLength={500} name="description" value={formData.description} onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))} placeholder="What this speciality covers" rows={3} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
              </label>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {creating && <LoaderCircle size={17} className="animate-spin" />}
                  {creating ? "Creating..." : "Create speciality"}
                </button>
              </div>
            </form>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_25px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><ClipboardList size={22} /></div>
                <div>
                  <h2 className="text-lg font-bold text-[#10213e]">Your specialities</h2>
                  <p className="text-sm text-slate-500">{specialities.length} total specialities</p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search specialities..." className="w-64 rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center"><RefreshCw className="mx-auto animate-spin text-blue-600" size={28} /><p className="mt-3 text-sm text-slate-500">Loading specialities...</p></div>
            ) : filteredSpecialities.length === 0 ? (
              <div className="p-16 text-center text-sm text-slate-500">{specialities.length === 0 ? "No specialities found. Create your first one to get started." : "No specialities match your search."}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead><tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><th className="px-5 py-4 sm:px-7">Name</th><th className="px-5 py-4">Code</th><th className="px-5 py-4">Description</th><th className="px-5 py-4 text-right sm:px-7">Users</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSpecialities.map((speciality) => (
                      <tr key={speciality.id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-4 sm:px-7"><p className="font-semibold text-[#10213e]">{speciality.name}</p></td>
                        <td className="px-5 py-4"><span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{speciality.code}</span></td>
                        <td className="max-w-md px-5 py-4 text-sm text-slate-600">{speciality.description || "No description"}</td>
                        <td className="px-5 py-4 text-right text-sm font-semibold text-slate-700 sm:px-7">{speciality._count?.users ?? 0}</td>
                      </tr>
                    ))}
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

export default Speciality;
