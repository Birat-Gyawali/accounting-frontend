import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getErrorMessage } from "../api/auth";
import { fetchBill, postBill, type BillDetail } from "../api/bills";

const STATUS_STYLES: Record<BillDetail["status"], string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  POSTED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

function formatMoney(value: string): string {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [bill, setBill] = useState<BillDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  function load() {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    fetchBill(id)
      .then(setBill)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handlePost() {
    if (!id) return;
    setPostError(null);
    setIsPosting(true);

    try {
      const updated = await postBill(id);
      setBill(updated);
    } catch (err) {
      setPostError(getErrorMessage(err));
    } finally {
      setIsPosting(false);
    }
  }

  if (isLoading) {
    return <div className="px-6 py-16 text-center text-sm text-slate-500">Loading bill…</div>;
  }

  if (error || !bill) {
    return (
      <div className="px-6 py-16 text-center">
        <p role="alert" className="text-sm text-red-700">
          {error ?? "Bill not found."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/bills")}
          className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to bills
        </button>
      </div>
    );
  }

  const subtotal = bill.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);
  const taxValue = Number(bill.tax_amount);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/bills")}
          className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          ← Back to bills
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{bill.bill_number}</h1>
              <p className="mt-1 text-sm text-slate-500">{bill.party_name}</p>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[bill.status]}`}
              >
                {bill.status}
              </span>
              <p className="mt-2 text-sm text-slate-500">{bill.bill_date}</p>
            </div>
          </div>

          {bill.narration && (
            <p className="mb-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">{bill.narration}</p>
          )}

          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Rate</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bill.lines.map((line) => (
                <tr key={line.id}>
                  <td className="py-3 text-slate-900">{line.description}</td>
                  <td className="py-3 text-right text-slate-600">{line.quantity}</td>
                  <td className="py-3 text-right text-slate-600">{formatMoney(line.rate)}</td>
                  <td className="py-3 text-right font-medium text-slate-900">{formatMoney(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-48 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatMoney(String(subtotal))}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>{formatMoney(bill.tax_amount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatMoney(bill.total_amount)}</span>
              </div>
            </div>
          </div>

          {bill.status === "POSTED" && bill.journal_entry_id && (
            <p className="mt-6 text-xs text-slate-400">Journal entry: {bill.journal_entry_id}</p>
          )}

          {postError && (
            <p role="alert" className="mt-6 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {postError}
            </p>
          )}

          {bill.status === "DRAFT" && (
            <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={handlePost}
                disabled={isPosting}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPosting ? "Posting…" : "Post bill"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}