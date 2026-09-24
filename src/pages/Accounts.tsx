import { useEffect, useState, type FormEvent } from "react";
import { getErrorMessage } from "../api/auth";
import {
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  type AccountListItem,
  type PaginatedResponse,
  type CreateAccountPayload,
} from "../api/accounts";

const TYPE_STYLES: Record<string, string> = {
  ASSET: "bg-emerald-50 text-emerald-700",
  LIABILITY: "bg-red-50 text-red-700",
  EQUITY: "bg-purple-50 text-purple-700",
  INCOME: "bg-blue-50 text-blue-700",
  EXPENSE: "bg-amber-50 text-amber-700",
};

const TYPE_OPTIONS = [
  { value: "ASSET", label: "Asset" },
  { value: "LIABILITY", label: "Liability" },
  { value: "EQUITY", label: "Equity" },
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
] as const;

export default function Accounts() {
  const [data, setData] = useState<PaginatedResponse<AccountListItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<string>("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountListItem | null>(null);
  const [form, setForm] = useState<CreateAccountPayload>({
    code: "",
    name: "",
    account_type: "ASSET",
    description: "",
    parent: "",
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

 function load(url?: string) {
  setPageError(null);
  setIsLoading(true);
  setError(null);

  if (url) {
    fetchAccounts(url)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
    return;
  }

  fetchAccounts(
    filterType
      ? `/api/accounting/accounts/?account_type=${filterType}`
      : "/api/accounting/accounts/"
  )
    .then(setData)
    .catch((err) => setError(getErrorMessage(err)))
    .finally(() => setIsLoading(false));
}

useEffect(() => {
  load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [filterType]);

  function openCreateForm() {
    setEditingAccount(null);
    setForm({ code: "", name: "", account_type: "ASSET", description: "", parent: "", is_active: true });
    setFormError(null);
    setIsFormOpen(true);
    setPageError(null);
  }

  function openEditForm(account: AccountListItem) {
    setEditingAccount(account);
    setForm({
      code: account.code,
      name: account.name,
      account_type: account.account_type as CreateAccountPayload["account_type"],
      description: account.description,
      parent: account.parent ?? "",
      is_active: account.is_active,
    });
    setFormError(null);
    setIsFormOpen(true);
    setPageError(null);
  }

  function closeForm() {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setEditingAccount(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setFormError(null);

  if (!form.code.trim()) {
    setFormError("Code is required.");
    return;
  }
  if (!form.name.trim()) {
    setFormError("Name is required.");
    return;
  }

  // Construct payload ensuring empty parent string maps to null
  const payload = {
    ...form,
    code: form.code.trim(),
    name: form.name.trim(),
    parent: form.parent ? form.parent : null,
  };

  setIsSubmitting(true);
  try {
    if (editingAccount) {
      await updateAccount(editingAccount.id, payload);
    } else {
      await createAccount(payload);
    }
    setIsFormOpen(false);
    load();
  } catch (err) {
    setFormError(getErrorMessage(err));
  } finally {
    setIsSubmitting(false);
  }
}

  async function handleDelete(account: AccountListItem) {
    if (account.is_system) return;
    setDeleteConfirmId(account.id);
  }

 async function confirmDelete() {
  if (!deleteConfirmId) return;

  setPageError(null);
  try {
    await deleteAccount(deleteConfirmId);
    load();
  } catch (err: any) {
    const is500 = err?.response?.status === 500;
    const detail =
      err?.response?.data?.detail ||
      err?.response?.data?.error ||
      getErrorMessage(err);

    const lower = String(detail).toLowerCase();
    if (
      is500 ||
      lower.includes("protected") ||
      lower.includes("child") ||
      lower.includes("journal") ||
      lower.includes("system") ||
      lower.includes("reference")
    ) {
      setPageError(
        "Cannot delete: account has child accounts, journal entries, or is a system account. Deactivate it instead (Edit → uncheck Active)."
      );
    } else {
      setPageError(detail);
    }
  } finally {
    setDeleteConfirmId(null);
  }
}
  if (isLoading) {
    return <div className="px-6 py-16 text-center text-sm text-slate-500">Loading accounts…</div>;
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
            <h1 className="text-2xl font-semibold text-slate-900">Chart of Accounts</h1>
            <p className="mt-1 text-sm text-slate-500">{data ? `${data.count} total` : "All accounts for this organization"}</p>
          </div>
          <button type="button" onClick={openCreateForm} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300">
            New Account
          </button>
        </div>
        {pageError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
        {pageError}
        </p>
          )}

        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">Filter by type:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100">
            <option value="">All types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading && <div className="px-6 py-16 text-center text-sm text-slate-500">Loading accounts…</div>}

          {!isLoading && !error && data && data.results.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              No accounts yet.{" "}
              <button type="button" onClick={openCreateForm} className="font-medium text-indigo-600 hover:text-indigo-500">
                Create your first one
              </button>
              .
            </div>
          )}

          {!isLoading && !error && data && data.results.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.results.map((account) => (
                  <tr key={account.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900 font-mono">{account.code}</td>
                    <td className="px-6 py-4 text-slate-900">{account.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[account.account_type] || "bg-slate-100 text-slate-600"}`}>
                        {account.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={account.is_active ? "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700" : "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600"}>
                        {account.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(account)}
                          disabled={account.is_system}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(account)}
                          disabled={account.is_system}
                          className="text-sm font-medium text-red-600 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Delete
                        </button>
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
              <h2 className="mb-4 text-lg font-semibold text-slate-900">{editingAccount ? "Edit Account" : "New Account"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-slate-700">Code</label>
                    <input
                      id="code"
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      disabled={editingAccount}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="account_type" className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
                    <select
                      id="account_type"
                      value={form.account_type}
                      onChange={(e) => setForm((f) => ({ ...f, account_type: e.target.value as CreateAccountPayload["account_type"] }))}
                      disabled={editingAccount}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    >
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="parent" className="mb-1.5 block text-sm font-medium text-slate-700">Parent (optional)</label>
                    <select
                      id="parent"
                      value={form.parent}
                      onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">No parent</option>
                      {data?.results
                        .filter((a) => a.id !== (editingAccount?.id ?? ""))
                        .map((a) => (
                          <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                        ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">Description (optional)</label>
                    <input
                      id="description"
                      type="text"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center">
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700">Active</label>
                  </div>
                </div>

                {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</p>}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button type="button" onClick={closeForm} disabled={isSubmitting} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? "Saving…" : editingAccount ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-10">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Delete Account</h3>
              <p className="mb-4 text-sm text-slate-600">Are you sure you want to delete this account? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setDeleteConfirmId(null)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="button" onClick={confirmDelete} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

