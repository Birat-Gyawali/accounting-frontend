import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage, signup, saveAuthSession, selectOrganization, saveOrganizationTokens } from "../api/auth";
import axios from "axios";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    organization_name: "",
    email: "",
    full_name: "",
    phone_number: "",
    password: "",
    password_confirm: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.organization_name.trim()) errors.organization_name = "Organization name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email format.";
    if (!form.password) errors.password = "Password is required.";
    else if (form.password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (form.password !== form.password_confirm) errors.password_confirm = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const data = await signup({
        organization_name: form.organization_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        password_confirm: form.password_confirm,
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
      });

      saveAuthSession({
        access: data.tokens.access,
        refresh: data.tokens.refresh,
        user: data.user,
        organizations: [{ id: data.organization.id, name: data.organization.name, slug: data.organization.slug, role: data.role }],
      });

      // Immediately select the newly created organization
      const orgSelect = await selectOrganization(data.organization.id);
      saveOrganizationTokens(orgSelect, { id: data.organization.id, name: data.organization.name, slug: data.organization.slug, role: data.role });

      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data;
        if (typeof data === "object") {
          // Map field errors
          const mapped: Record<string, string> = {};
          for (const [key, val] of Object.entries(data)) {
            if (Array.isArray(val) && val[0]) mapped[key] = val[0] as string;
          }
          if (Object.keys(mapped).length) {
            setFieldErrors(mapped);
            setError("Please fix the errors below.");
          } else if (typeof (data as { detail?: string }).detail === "string") {
            setError((data as { detail: string }).detail);
          } else {
            setError(getErrorMessage(err));
          }
        }
      } else {
        setError(getErrorMessage(err));
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
          <p className="mt-1.5 text-sm text-slate-500">Set up your organization and get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <label htmlFor="organization_name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Organization name
            </label>
            <input
              id="organization_name"
              name="organization_name"
              type="text"
              autoComplete="organization"
              required
              value={form.organization_name}
              onChange={handleChange}
              placeholder="Acme Inc."
              className={`w-full rounded-lg border px-3 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                fieldErrors.organization_name ? "border-red-300" : "border-slate-300"
              }`}
            />
            {fieldErrors.organization_name && <p className="mt-1 text-sm text-red-600">{fieldErrors.organization_name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@company.com"
              className={`w-full rounded-lg border px-3 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                fieldErrors.email ? "border-red-300" : "border-slate-300"
              }`}
            />
            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Full name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Ram Bahadur"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="phone_number" className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              autoComplete="tel"
              value={form.phone_number}
              onChange={handleChange}
              placeholder="+977-98XXXXXXXX"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full rounded-lg border px-3 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                fieldErrors.password ? "border-red-300" : "border-slate-300"
              }`}
            />
            {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="password_confirm" className="mb-1.5 block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input
              id="password_confirm"
              name="password_confirm"
              type="password"
              autoComplete="new-password"
              required
              value={form.password_confirm}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full rounded-lg border px-3 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                fieldErrors.password_confirm ? "border-red-300" : "border-slate-300"
              }`}
            />
            {fieldErrors.password_confirm && <p className="mt-1 text-sm text-red-600">{fieldErrors.password_confirm}</p>}
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-[15px] font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}