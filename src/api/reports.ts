import api from "./axios";


export interface OutstandingItem {
  id: string;
  number: string;
  total_amount: string;
  paid_amount: string;
  outstanding_amount: string;
}

export interface OutstandingParty {
  party_id: string;
  party_name: string;
  total_outstanding: string;
  items: OutstandingItem[];
}

export async function fetchOutstandingReceivables(): Promise<OutstandingParty[]> {
  const response = await api.get<OutstandingParty[]>("/api/reports/outstanding-receivables/");
  return response.data;
}

export async function fetchOutstandingPayables(): Promise<OutstandingParty[]> {
  const response = await api.get<OutstandingParty[]>("/api/reports/outstanding-payables/");
  return response.data;
}


export interface TrialBalanceRow {
  account_id: string;
  code: string;
  name: string;
  account_type: string;
  total_debit: string;
  total_credit: string;
}

export interface TrialBalanceResponse {
  accounts: TrialBalanceRow[];
  total_debit: string;
  total_credit: string;
  is_balanced: boolean;
}

export async function fetchTrialBalance(): Promise<TrialBalanceResponse> {
  const response = await api.get<TrialBalanceResponse>("/api/reports/trial-balance/");
  return response.data;
}


export interface ProfitLossLine {
  account_id?: string;
  code: string;
  name: string;
  amount: string;
}

export interface ProfitLossResponse {
  income: ProfitLossLine[];
  expenses: ProfitLossLine[];
  total_income: string;
  total_expenses: string;
  net_profit: string;
}

export async function fetchProfitLoss(): Promise<ProfitLossResponse> {
  const response = await api.get<ProfitLossResponse>("/api/reports/profit-loss/");
  return response.data;
}


export interface BalanceSheetLine {
  account_id?: string | null;
  code: string | null;
  name: string;
  amount: string;
}

export interface BalanceSheetResponse {
  assets: BalanceSheetLine[];
  liabilities: BalanceSheetLine[];
  equity: BalanceSheetLine[];
  total_assets: string;
  total_liabilities: string;
  total_equity: string;
  is_balanced: boolean;
}

export async function fetchBalanceSheet(): Promise<BalanceSheetResponse> {
  const response = await api.get<BalanceSheetResponse>("/api/reports/balance-sheet/");
  return response.data;
}