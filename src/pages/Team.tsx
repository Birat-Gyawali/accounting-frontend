import { useEffect, useState, type FormEvent } from "react";
import { getErrorMessage } from "../api/auth";
import {
  fetchMemberships,
  inviteMember,
  updateMembership,
  deactivateMembership,
  type Membership,
  type InvitePayload,
  type PaginatedResponse,
} from "../api/organizations";

const ROLE_OPTIONS = [
  { value: "STAFF", label: "Staff" },
  { value: "MANAGER", label: "Manager" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "ADMIN", label: "Admin" },
  { value: "OWNER", label: "Owner" },
] as const;

const ROLE_STYLES: Record<string, string> = {
  STAFF: "bg-slate-100 text-slate-600",
  MANAGER: "bg-blue-50 text-blue-700",
  ACCOUNTANT: "bg-emerald-50 text-emerald-700",
  ADMIN: "bg-purple-50 text-purple-700",
  OWNER: "bg-amber-50 text-amber-700",
};

export default function Team() {
  const [data, setData] = useState<PaginatedResponse<Membership> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Membership | null>(null);
  const [form, setForm] = useState<InvitePayload>({
    email: "",
    full_name: "",
    role: "STAFF",
    password: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function load(url?: string) {
    setIsLoading(true);
    setError(null);

    fetchMemberships(url)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openInviteForm() {
    setEditingMember(null);
    setForm({ email: "", full_name: "", role: "STAFF", password: "" });
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(member: Membership) {
    setEditingMember(member);
    setForm({ email: member.email, full_name: member.full_name, role: member.role, password: "" });
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setEditingMember(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.email.trim()) {
      setFormError("Email is required.");
      return;
    }
    if (editingMember === null && !form.password) {
      setFormError("Password is required for new members.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMember) {
        // FIX: Only update role, do not force is_active to true
        await updateMembership(editingMember.id, { role: form.role });
      } else {
        await inviteMember(form);
      }
      setIsFormOpen(false);
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
}

  async function handleRoleChange(member: Membership, newRole: string) {
    if (member.role === newRole) return;
    try {
      await updateMembership(member.id, { role: newRole as InvitePayload["role"] });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDeactivate(member: Membership) {
    if (!member.is_active) return;
    try {
      await deactivateMembership(member.id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (isLoading) {
    return <div className="px-6 py-16 text-center text-sm text-slate-500">Loading team members…</div>;
  }

  if (error) {
    return (
      <div className="px-6 py-16 text-center">
        <p role="alert" className="text-sm text-red-700">{error}</p>
        <button type="button" onClick={load} className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Team Members</h1>
            <p className="mt-1 text-sm text-slate-500">{data ? `${data.count} total` : "Members in this organization"}</p>
          </div>
          <button type="button" onClick={openInviteForm} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300">
            Invite Member
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {!isLoading && !error && data && data.results.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              No team members yet.{" "}
              <button type="button" onClick={openInviteForm} className="font-medium text-indigo-600 hover:text-indigo-500">
                Invite your first member
              </button>
              .
            </div>
          )}

          {!isLoading && !error && data && data.results.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.results.map((member) => (
                  <tr key={member.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{member.full_name || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{member.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member, e.target.value)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${ROLE_STYLES[member.role] || "bg-slate-100 text-slate-600"} focus:outline-none focus:ring-2 focus:ring-indigo-100`}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={member.is_active ? "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700" : "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600"}>
                        {member.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{member.created_at.slice(0, 10)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(member)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Edit
                        </button>
                        {member.is_active && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(member)}
                            className="text-sm font-medium text-red-600 hover:text-red-500"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && !error && data && (data.next || data.previous) && (
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => data.previous && load(data.previous)}
              disabled={!data.previous}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => data.next && load(data.next)}
              disabled={!data.next}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-10">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">{editingMember ? "Edit Member" : "Invite Member"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    disabled={editingMember}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    id="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
                  <select
                    id="role"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as InvitePayload["role"] }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {!editingMember && (
                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Temporary Password</label>
                    <input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                )}

                {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</p>}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button type="button" onClick={closeForm} disabled={isSubmitting} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? "Saving…" : editingMember ? "Update" : "Invite"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}