import React, { useState } from "react";
import axios from "axios";
import { ArrowLeft, Building2, CheckCircle2, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Platform_Admin_Sidebar";

const API_URL =
  import.meta.env?.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/platform/organizations/`
    : "http://localhost:3000/platform/organizations/";

const Create_Organization = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", slug: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const slug = formData.slug.trim();

    if (!name || !slug) {
      setError("Organization name and slug are required.");
      return;
    }

    const token = localStorage.getItem("accessToken");

    try {
      setSubmitting(true);
      setError("");

      await axios.post(
        API_URL,
        { name, slug },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setSuccess("Organization created successfully.");
      window.setTimeout(() => navigate("/platform/organizations"), 700);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to create organization. Please try again.";

      setError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setSubmitting(false);
    }
  };

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

        <div className="mx-auto max-w-3xl">
          <div className="mb-7">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <Building2 size={25} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Create organization
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Add a new organization to your FlowTenant platform.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                <CheckCircle2 size={18} />
                {success}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Organization name
                </span>
                <input
                  required
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="AB technology"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Organization slug
                </span>
                <input
                  required
                  name="slug"
                  type="text"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="ABTC"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
                <span className="mt-2 block text-xs text-slate-500">
                  A short, unique identifier for the organization.
                </span>
              </label>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={() => navigate("/platform/organizations")}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || Boolean(success)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <LoaderCircle size={17} className="animate-spin" />}
                {submitting ? "Creating..." : "Create organization"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Create_Organization;
