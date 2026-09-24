/* eslint-disable no-irregular-whitespace */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getErrorMessage, getCurrentOrganization } from "../api/auth";
import { fetchInvoice, type InvoiceDetail } from "../api/invoices";
const STATUS_STYLES: Record<InvoiceDetail["status"], string> = {

  DRAFT: "bg-slate-100 text-slate-600",
  POSTED: "bg-emerald-50 text-emerald-700",

  CANCELLED: "bg-red-50 text-red-700",
};
function formatMoney(value: string): string {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
export default function PrintInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const organization = getCurrentOrganization();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  function load() {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    fetchInvoice(id)
      .then(setInvoice)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }
  useEffect(() => {
    load();
  }, [id]);
  function handlePrint() {
    window.print();
  }
  function handleBack() {
    navigate(`/invoices/${id}`);
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white px-4 py-10 sm:px-8 print:hidden">
        <div className="mx-auto max-w-3xl text-center text-sm text-slate-500">Loading invoice…</div>
      </div>
    );
  }
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-white px-4 py-10 sm:px-8 print:hidden">
        <div className="mx-auto max-w-3xl text-center">
          <p role="alert" className="text-sm text-red-700">
            {error ?? "Invoice not found."}
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to invoice
          </button>
        </div>
      </div>
    );
  }
  const subtotal = invoice.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);
  const taxValue = Number(invoice.tax_amount);
  
return (
  <div className="min-h-screen bg-white px-4 py-10 sm:px-8">
    {/* Screen-only toolbar */}
    <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between print:hidden">
      <button
        type="button"
        onClick={handleBack}
        className="text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        ← Back to invoice
      </button>
      <button
        type="button"
        onClick={handlePrint}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        Print / Save as PDF
      </button>
    </div>

    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {organization?.name && (
              <p className="mb-1 text-sm font-medium text-slate-500">{organization.name}</p>
            )}
            <h2 className="text-3xl font-bold text-slate-900">INVOICE</h2>
            <p className="mt-1 font-mono text-lg text-slate-700">{invoice.invoice_number}</p>
          </div>

          <div className="text-left sm:text-right">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[invoice.status]}`}
            >
              {invoice.status}
            </span>
            <p className="mt-2 text-sm text-slate-500">Date: {formatDate(invoice.invoice_date)}</p>
            {invoice.due_date && (
              <p className="text-sm text-slate-500">Due: {formatDate(invoice.due_date)}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-slate-200 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Bill To</p>
            <p className="mt-1 font-medium text-slate-900">{invoice.party_name}</p>
            {invoice.narration && (
              <p className="mt-2 text-sm text-slate-600">{invoice.narration}</p>
            )}
          </div>
        </div>
      </div>

      {/* Lines */}
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300 bg-slate-50">
            <th className="px-2 py-3 font-medium text-slate-700">Description</th>
            <th className="w-20 px-2 py-3 text-right font-medium text-slate-700">Qty</th>
            <th className="w-28 px-2 py-3 text-right font-medium text-slate-700">Rate</th>
            <th className="w-28 px-2 py-3 text-right font-medium text-slate-700">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoice.lines.map((line) => (
            <tr key={line.id}>
              <td className="px-2 py-3 text-slate-900">{line.description}</td>
              <td className="px-2 py-3 text-right text-slate-600">
                {Number(line.quantity).toLocaleString()}
              </td>
              <td className="px-2 py-3 text-right text-slate-600">{formatMoney(line.rate)}</td>
              <td className="px-2 py-3 text-right font-medium text-slate-900">
                {formatMoney(line.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatMoney(String(subtotal))}</span>
          </div>
          {taxValue > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Tax</span>
              <span>{formatMoney(invoice.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(invoice.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        <p>Thank you for your business.</p>
        {organization?.name && <p className="mt-1">{organization.name}</p>}
      </div>
    </div>
  </div>
);
}