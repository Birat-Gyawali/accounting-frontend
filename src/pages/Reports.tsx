import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/auth";
import {
  fetchBalanceSheet,
  fetchOutstandingReceivables,
  fetchProfitLoss,
  fetchTrialBalance,
  type BalanceSheetResponse,
  type OutstandingParty,
  type ProfitLossResponse,
  type TrialBalanceResponse,
} from "../api/reports";

type ReportKey = "receivables" | "trial-balance" | "profit-loss" | "balance-sheet";

const TABS: { key: ReportKey; label: string }[] = [
  { key: "receivables", label: "Outstanding Receivables" },
  { key: "trial-balance", label: "Trial Balance" },
  { key: "profit-loss", label: "Profit & Loss" },
  { key: "balance-sheet", label: "Balance Sheet" },
];

function formatMoney(value: string): string {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// One cache slot per report, keyed by tab -- so switching tabs back
// and forth doesn't refetch data that's already loaded.
interface ReportState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

function initialState<T>(): ReportState<T> {
  return { data: null, isLoading: false, error: null };
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportKey>("receivables");

  const [receivables, setReceivables] = useState<ReportState<OutstandingParty[]>>(initialState);
  const [trialBalance, setTrialBalance] = useState<ReportState<TrialBalanceResponse>>(initialState);
  const [profitLoss, setProfitLoss] = useState<ReportState<ProfitLossResponse>>(initialState);
  const [balanceSheet, setBalanceSheet] = useState<ReportState<BalanceSheetResponse>>(initialState);

  useEffect(() => {
    if (activeTab === "receivables" && !receivables.data && !receivables.isLoading) {
      setReceivables((s) => ({ ...s, isLoading: true, error: null }));
      fetchOutstandingReceivables()
        .then((data) => setReceivables({ data, isLoading: false, error: null }))
        .catch((err) => setReceivables({ data: null, isLoading: false, error: getErrorMessage(err) }));
    }

    if (activeTab === "trial-balance" && !trialBalance.data && !trialBalance.isLoading) {
      setTrialBalance((s) => ({ ...s, isLoading: true, error: null }));
      fetchTrialBalance()
        .then((data) => setTrialBalance({ data, isLoading: false, error: null }))
        .catch((err) => setTrialBalance({ data: null, isLoading: false, error: getErrorMessage(err) }));
    }

    if (activeTab === "profit-loss" && !profitLoss.data && !profitLoss.isLoading) {
      setProfitLoss((s) => ({ ...s, isLoading: true, error: null }));
      fetchProfitLoss()
        .then((data) => setProfitLoss({ data, isLoading: false, error: null }))
        .catch((err) => setProfitLoss({ data: null, isLoading: false, error: getErrorMessage(err) }));
    }

    if (activeTab === "balance-sheet" && !balanceSheet.data && !balanceSheet.isLoading) {
      setBalanceSheet((s) => ({ ...s, isLoading: true, error: null }));
      fetchBalanceSheet()
        .then((data) => setBalanceSheet({ data, isLoading: false, error: null }))
        .catch((err) => setBalanceSheet({ data: null, isLoading: false, error: getErrorMessage(err) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">Reports</h1>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {activeTab === "receivables" && (
            <ReceivablesPanel state={receivables} />
          )}
          {activeTab === "trial-balance" && (
            <TrialBalancePanel state={trialBalance} />
          )}
          {activeTab === "profit-loss" && (
            <ProfitLossPanel state={profitLoss} />
          )}
          {activeTab === "balance-sheet" && (
            <BalanceSheetPanel state={balanceSheet} />
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingRow() {
  return <div className="px-2 py-16 text-center text-sm text-slate-500">Loading…</div>;
}

function ErrorRow({ message }: { message: string }) {
  return (
    <div className="px-2 py-16 text-center">
      <p role="alert" className="text-sm text-red-700">
        {message}
      </p>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <div className="px-2 py-16 text-center text-sm text-slate-500">{message}</div>;
}

function ReceivablesPanel({ state }: { state: ReportState<OutstandingParty[]> }) {
  if (state.isLoading) return <LoadingRow />;
  if (state.error) return <ErrorRow message={state.error} />;
  if (!state.data || state.data.length === 0) return <EmptyRow message="No outstanding receivables." />;

  return (
    <div className="space-y-6">
      {state.data.map((party) => (
        <div key={party.party_id}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">{party.party_name}</h3>
            <span className="text-sm font-medium text-slate-900">
              {formatMoney(party.total_outstanding)}
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 font-medium">Invoice</th>
                <th className="py-2 text-right font-medium">Total</th>
                <th className="py-2 text-right font-medium">Paid</th>
                <th className="py-2 text-right font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {party.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 text-slate-700">{item.number}</td>
                  <td className="py-2 text-right text-slate-600">{formatMoney(item.total_amount)}</td>
                  <td className="py-2 text-right text-slate-600">{formatMoney(item.paid_amount)}</td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    {formatMoney(item.outstanding_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function TrialBalancePanel({ state }: { state: ReportState<TrialBalanceResponse> }) {
  if (state.isLoading) return <LoadingRow />;
  if (state.error) return <ErrorRow message={state.error} />;
  if (!state.data || state.data.accounts.length === 0) {
  return <EmptyRow message="No trial balance data." />;
}

const { accounts, total_debit, total_credit } = state.data;
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th className="py-2 font-medium">Code</th>
          <th className="py-2 font-medium">Account</th>
          <th className="py-2 text-right font-medium">Debit</th>
          <th className="py-2 text-right font-medium">Credit</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
       {accounts.map((row) => (
  <tr key={row.code}>
    <td className="py-2 text-slate-500">{row.code}</td>
    <td className="py-2 text-slate-900">{row.name}</td>
    <td className="py-2 text-right text-slate-600">{formatMoney(row.total_debit)}</td>
    <td className="py-2 text-right text-slate-600">{formatMoney(row.total_credit)}</td>
  </tr>
))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-slate-200 font-semibold text-slate-900">
          <td className="py-2" colSpan={2}>
            Total
          </td>
          <td className="py-2 text-right">{formatMoney(total_debit)}</td>
          <td className="py-2 text-right">{formatMoney(total_credit)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function ProfitLossPanel({ state }: { state: ReportState<ProfitLossResponse> }) {
  if (state.isLoading) return <LoadingRow />;
  if (state.error) return <ErrorRow message={state.error} />;
  if (!state.data) return <EmptyRow message="No profit & loss data." />;

  const { income, expenses, total_income, total_expenses, net_profit } = state.data;

  return (
    <div className="space-y-8">
      <LineSection title="Income" lines={income} total={total_income} totalLabel="Total Income" />
      <LineSection title="Expenses" lines={expenses} total={total_expenses} totalLabel="Total Expenses" />
      <div className="flex justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
        <span>Net Profit</span>
        <span>{formatMoney(net_profit)}</span>
      </div>
    </div>
  );
}

function BalanceSheetPanel({ state }: { state: ReportState<BalanceSheetResponse> }) {
  if (state.isLoading) return <LoadingRow />;
  if (state.error) return <ErrorRow message={state.error} />;
  if (!state.data) return <EmptyRow message="No balance sheet data." />;

  const { assets, liabilities, equity, total_assets, total_liabilities, total_equity } = state.data;

  return (
    <div className="space-y-8">
      <LineSection title="Assets" lines={assets} total={total_assets} totalLabel="Total Assets" />
      <LineSection title="Liabilities" lines={liabilities} total={total_liabilities} totalLabel="Total Liabilities" />
      <LineSection title="Equity" lines={equity} total={total_equity} totalLabel="Total Equity" />
    </div>
  );
}

function LineSection({
  title,
  lines,
  total,
  totalLabel,
}: {
  title: string;
  lines: { code: string | null; name: string; amount: string }[]
  total: string;
  totalLabel: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
      <table className="w-full text-left text-sm">
        <tbody className="divide-y divide-slate-100">
          {lines.map((line) => (
            <tr key={line.code ?? line.name}>
  <td className="py-2 text-slate-500">{line.code}</td>
  <td className="py-2 text-slate-700">{line.name}</td>
  <td className="py-2 text-right text-slate-900">{formatMoney(line.amount)}</td>
</tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 font-medium text-slate-900">
            <td className="py-2" colSpan={2}>
              {totalLabel}
            </td>
            <td className="py-2 text-right">{formatMoney(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}