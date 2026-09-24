import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/auth";
import { fetchBills, type BillListItem, type PaginatedResponse } from "../api/bills";

const STATUS_STYLES: Record<BillListItem["status"], string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  POSTED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

function formatMoney(value: string): string {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Bills() {
  const navigate = useNavigate();

  const [data, setData] = useState<PaginatedResponse<BillListItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load(url?: string) {
    setIsLoading(true);
    setError(null);

    fetchBills(url)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Bills</h1>
            <p className="mt-1 text-sm text-slate-500">
              {data ? `${data.count} total` : "Purchase bills for this organization"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/bills/new")}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            New Bill
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading && (
            <div className="px-6 py-16 text-center text-sm text-slate-500">Loading bills…</div>
          )}

          {!isLoading && error && (
            <div className="px-6 py-16 text-center">
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
              <button
                type="button"
                onClick={() => load()}
                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !error && data && data.results.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              No bills yet.{" "}
              <button
                type="button"
                onClick={() => navigate("/bills/new")}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Create your first one
              </button>
              .
            </div>
          )}

          {!isLoading && !error && data && data.results.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Number</th>
                  <th className="px-6 py-3 font-medium">Vendor</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.results.map((bill) => (
                  <tr
                    key={bill.id}
                    onClick={() => navigate(`/bills/${bill.id}`)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{bill.bill_number}</td>
                    <td className="px-6 py-4 text-slate-600">{bill.party_name}</td>
                    <td className="px-6 py-4 text-slate-600">{bill.bill_date}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[bill.status]}`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {formatMoney(bill.total_amount)}
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
      </div>
    </div>
  );
}