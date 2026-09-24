import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/auth";
import {
  fetchProfitLoss,
  fetchBalanceSheet,
  fetchOutstandingReceivables,
  fetchOutstandingPayables,
  type ProfitLossResponse,
  type BalanceSheetResponse,
  type OutstandingParty,
} from "../api/reports";

function formatMoney(value: string): string {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ReportState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

function initialState<T>(): ReportState<T> {
  return { data: null, isLoading: true, error: null };
}

export default function Dashboard() {
  const [profitLoss, setProfitLoss] = useState<ReportState<ProfitLossResponse>>(initialState);
  const [balanceSheet, setBalanceSheet] = useState<ReportState<BalanceSheetResponse>>(initialState);
  const [receivables, setReceivables] = useState<ReportState<OutstandingParty[]>>(initialState);
  const [payables, setPayables] = useState<ReportState<OutstandingParty[]>>(initialState);

  useEffect(() => {
    fetchProfitLoss()
      .then((data) => setProfitLoss({ data, isLoading: false, error: null }))
      .catch((err) => setProfitLoss({ data: null, isLoading: false, error: getErrorMessage(err) }));
  }, []);

  useEffect(() => {
    fetchBalanceSheet()
      .then((data) => setBalanceSheet({ data, isLoading: false, error: null }))
      .catch((err) => setBalanceSheet({ data: null, isLoading: false, error: getErrorMessage(err) }));
  }, []);

  useEffect(() => {
    fetchOutstandingReceivables()
      .then((data) => setReceivables({ data, isLoading: false, error: null }))
      .catch((err) => setReceivables({ data: null, isLoading: false, error: getErrorMessage(err) }));
  }, []);

  useEffect(() => {
    fetchOutstandingPayables()
      .then((data) => setPayables({ data, isLoading: false, error: null }))
      .catch((err) => setPayables({ data: null, isLoading: false, error: getErrorMessage(err) }));
  }, []);

  // Compute cash from balance sheet assets (find by name containing "Cash" or "Bank")
  const cashAmount = balanceSheet.data?.assets
    ?.find((a) => /cash|bank/i.test(a.name))
    ?.amount ?? "0.00";

  const totalReceivables = receivables.data?.reduce((sum, p) => sum + Number(p.total_outstanding || 0), 0) ?? 0;
  const totalPayables = payables.data?.reduce((sum, p) => sum + Number(p.total_outstanding || 0), 0) ?? 0;

  const allLoading = profitLoss.isLoading || balanceSheet.isLoading || receivables.isLoading || payables.isLoading;
  const anyError = profitLoss.error || balanceSheet.error || receivables.error || payables.error;

  if (allLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-slate-500">Loading dashboard…</div>
      </div>
    );
  }

  if (anyError) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <p role="alert" className="text-sm text-red-700">
            {anyError}
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Income", value: formatMoney(profitLoss.data?.total_income ?? "0"), color: "bg-emerald-50 text-emerald-700 border-emerald-200", iconColor: "text-emerald-600" },
    { label: "Expenses", value: formatMoney(profitLoss.data?.total_expenses ?? "0"), color: "bg-red-50 text-red-700 border-red-200", iconColor: "text-red-600" },
    { label: "Net Profit", value: formatMoney(profitLoss.data?.net_profit ?? "0"), color: "bg-indigo-50 text-indigo-700 border-indigo-200", iconColor: "text-indigo-600" },
    { label: "Receivables", value: formatMoney(String(totalReceivables)), color: "bg-blue-50 text-blue-700 border-blue-200", iconColor: "text-blue-600" },
    { label: "Payables", value: formatMoney(String(totalPayables)), color: "bg-amber-50 text-amber-700 border-amber-200", iconColor: "text-amber-600" },
    { label: "Cash & Bank", value: formatMoney(cashAmount), color: "bg-slate-50 text-slate-700 border-slate-200", iconColor: "text-slate-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">Dashboard</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {cards.map((card) => (
            <div key={card.label} className={`rounded-2xl border p-6 shadow-sm ${card.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-white/50 ${card.iconColor}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a href="/invoices/new" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition">
            <p className="text-sm font-medium text-indigo-600">+ New Invoice</p>
            <p className="mt-1 text-sm text-slate-500">Create a sales invoice</p>
          </a>
          <a href="/bills/new" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition">
            <p className="text-sm font-medium text-indigo-600">+ New Bill</p>
            <p className="mt-1 text-sm text-slate-500">Record a purchase bill</p>
          </a>
          <a href="/receipts/new" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition">
            <p className="text-sm font-medium text-indigo-600">+ Record Receipt</p>
            <p className="mt-1 text-sm text-slate-500">Customer payment received</p>
          </a>
          <a href="/payments/new" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition">
            <p className="text-sm font-medium text-indigo-600">+ Record Payment</p>
            <p className="mt-1 text-sm text-slate-500">Vendor payment made</p>
          </a>
        </div>
      </div>
    </div>
  );
}