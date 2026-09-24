import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/auth";
import { fetchAssetAccounts, fetchIncomeAccounts, type Account } from "../api/accounts";
import { fetchCustomers, type Party } from "../api/parties";
import { createInvoice, type CreateInvoicePayload } from "../api/invoices";

interface LineFormState {
  key: string;
  description: string;
  quantity: string;
  rate: string;
  income_account: string;
}

function emptyLine(): LineFormState {
  return {
    key: crypto.randomUUID(),
    description: "",
    quantity: "1.00",
    rate: "0.00",
    income_account: "",
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateInvoice() {
  const navigate = useNavigate();

  // Reference data
  const [customers, setCustomers] = useState<Party[]>([]);
  const [assetAccounts, setAssetAccounts] = useState<Account[]>([]);
  const [incomeAccounts, setIncomeAccounts] = useState<Account[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Form state
  const [party, setParty] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState("");
  const [narration, setNarration] = useState("");
  const [taxAmount, setTaxAmount] = useState("0.00");
  const [receivableAccount, setReceivableAccount] = useState("");
  const [lines, setLines] = useState<LineFormState[]>([emptyLine()]);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchCustomers(), fetchAssetAccounts(), fetchIncomeAccounts()])
      .then(([customersData, assetData, incomeData]) => {
        setCustomers(customersData);
        setAssetAccounts(assetData);
        setIncomeAccounts(incomeData);
      })
      .catch((err) => setPageError(getErrorMessage(err)))
      .finally(() => setPageLoading(false));
  }, []);

  function updateLine(key: string, patch: Partial<LineFormState>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((line) => line.key !== key) : prev));
  }

  const subtotal = lines.reduce((sum, line) => {
    const qty = Number(line.quantity);
    const rate = Number(line.rate);
    return sum + (Number.isFinite(qty) && Number.isFinite(rate) ? qty * rate : 0);
  }, 0);
  const taxValue = Number(taxAmount);
  const grandTotal = subtotal + (Number.isFinite(taxValue) ? taxValue : 0);

  function validate(): string | null {
    if (!party) return "Select a customer.";
    if (!invoiceDate) return "Invoice date is required.";
    if (!receivableAccount) return "Select a receivable account.";
    if (lines.length === 0) return "Add at least one line.";

    for (const line of lines) {
      if (!line.description.trim()) return "Every line needs a description.";
      if (!line.income_account) return "Every line needs an income account.";
      if (!(Number(line.quantity) > 0)) return "Quantity must be greater than 0 on every line.";
      if (!(Number(line.rate) >= 0)) return "Rate must be a valid number on every line.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload: CreateInvoicePayload = {
      party,
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      narration,
      tax_amount: (Number.isFinite(taxValue) ? taxValue : 0).toFixed(2),
      receivable_account: receivableAccount,
      lines: lines.map((line) => ({
        description: line.description.trim(),
        quantity: Number(line.quantity).toFixed(2),
        rate: Number(line.rate).toFixed(2),
        income_account: line.income_account,
      })),
    };

    setIsSubmitting(true);
    try {
      const created = await createInvoice(payload);
      navigate(`/invoices/${created.id}`);
    } catch (err) {
      setFormError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  if (pageLoading) {
    return <div className="px-6 py-16 text-center text-sm text-slate-500">Loading form…</div>;
  }

  if (pageError) {
    return (
      <div className="px-6 py-16 text-center">
        <p role="alert" className="text-sm text-red-700">
          {pageError}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">New Invoice</h1>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="party" className="mb-1.5 block text-sm font-medium text-slate-700">
                Customer
              </label>
              <select
                id="party"
                value={party}
                onChange={(e) => setParty(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="receivable_account" className="mb-1.5 block text-sm font-medium text-slate-700">
                Receivable account
              </label>
              <select
                id="receivable_account"
                value={receivableAccount}
                onChange={(e) => setReceivableAccount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select an account</option>
                {assetAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} — {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="invoice_date" className="mb-1.5 block text-sm font-medium text-slate-700">
                Invoice date
              </label>
              <input
                id="invoice_date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label htmlFor="due_date" className="mb-1.5 block text-sm font-medium text-slate-700">
                Due date <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="narration" className="mb-1.5 block text-sm font-medium text-slate-700">
              Narration <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="narration"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-700">Lines</h2>
              <button
                type="button"
                onClick={addLine}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                + Add line
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line) => (
                <div key={line.key} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <label className="mb-1 block text-xs font-medium text-slate-500">Description</label>
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(line.key, { description: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-500">Quantity</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-500">Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.rate}
                        onChange={(e) => updateLine(line.key, { rate: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-slate-500">Income account</label>
                      <select
                        value={line.income_account}
                        onChange={(e) => updateLine(line.key, { income_account: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">Select</option>
                        {incomeAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} — {account.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end justify-end sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        disabled={lines.length === 1}
                        className="rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Remove line"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-right text-xs text-slate-400">
                    Line total: {(Number(line.quantity || 0) * Number(line.rate || 0)).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div>
              <label htmlFor="tax_amount" className="mb-1.5 block text-sm font-medium text-slate-700">
                Tax amount
              </label>
              <input
                id="tax_amount"
                type="number"
                step="0.01"
                min="0"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                className="w-40 rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-500">Subtotal: {subtotal.toFixed(2)}</p>
              <p className="text-lg font-semibold text-slate-900">Total: {grandTotal.toFixed(2)}</p>
            </div>
          </div>

          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}