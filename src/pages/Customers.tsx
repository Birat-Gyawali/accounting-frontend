import { useEffect, useState, type FormEvent } from "react";
import { getErrorMessage } from "../api/auth";
import { createParty, fetchCustomers, type Party } from "../api/parties";

interface NewCustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  pan_number: string;
}

function emptyForm(): NewCustomerForm {
  return { name: "", phone: "", email: "", address: "", pan_number: "" };
}

export default function Customers() {
  const [customers, setCustomers] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<NewCustomerForm>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function load() {
    setIsLoading(true);
    setLoadError(null);

    fetchCustomers()
      .then(setCustomers)
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openForm() {
    setForm(emptyForm());
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSubmitting) return;
    setIsFormOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createParty({
        name: form.name.trim(),
        party_type: "CUSTOMER",
        phone: form.phone,
        email: form.email,
        address: form.address,
        pan_number: form.pan_number,
      });
      setCustomers((prev) => [...prev, created]);
      setIsFormOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
            <p className="mt-1 text-sm text-slate-500">{customers.length} total</p>
          </div>

          <button
            type="button"
            onClick={openForm}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            New Customer
          </button>
        </div>

        {isFormOpen && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">New Customer</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Phone <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Address <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label htmlFor="pan_number" className="mb-1.5 block text-sm font-medium text-slate-700">
                    PAN number <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="pan_number"
                    type="text"
                    value={form.pan_number}
                    onChange={(e) => setForm((f) => ({ ...f, pan_number: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {formError && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSubmitting}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Saving…" : "Save customer"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading && (
            <div className="px-6 py-16 text-center text-sm text-slate-500">Loading customers…</div>
          )}

          {!isLoading && loadError && (
            <div className="px-6 py-16 text-center">
              <p role="alert" className="text-sm text-red-700">
                {loadError}
              </p>
              <button
                type="button"
                onClick={load}
                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !loadError && customers.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              No customers yet.{" "}
              <button type="button" onClick={openForm} className="font-medium text-indigo-600 hover:text-indigo-500">
                Add your first one
              </button>
              .
            </div>
          )}

          {!isLoading && !loadError && customers.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Address</th>
                  <th className="px-6 py-3 font-medium">PAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">{customer.name}</td>
                    <td className="px-6 py-4 text-slate-600">{customer.phone || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{customer.email || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{customer.address || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{customer.pan_number || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}