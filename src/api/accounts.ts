import api from "./axios";

export interface Account {
  id: string;
  code: string;
  name: string;
  account_type: string;
  description?: string;
  parent?: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AccountListItem {
  id: string;
  code: string;
  name: string;
  account_type: string;
  description: string;
  parent: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
}

async function fetchAccountsByType(accountType: string): Promise<Account[]> {
  const response = await api.get<{ results?: Account[] } | Account[]>("/api/accounting/accounts/", {
    params: { account_type: accountType },
  });
  const data = response.data;
  return Array.isArray(data) ? data : (data.results ?? []);
}

export function fetchAssetAccounts(): Promise<Account[]> {
  return fetchAccountsByType("ASSET");
}

export function fetchIncomeAccounts(): Promise<Account[]> {
  return fetchAccountsByType("INCOME");
}

export function fetchLiabilityAccounts(): Promise<Account[]> {
  return fetchAccountsByType("LIABILITY");
}

export function fetchExpenseAccounts(): Promise<Account[]> {
  return fetchAccountsByType("EXPENSE");
}

export async function fetchAccounts(url?: string): Promise<PaginatedResponse<AccountListItem>> {
  const response = url
    ? await api.get<PaginatedResponse<AccountListItem>>(url)
    : await api.get<PaginatedResponse<AccountListItem>>("/api/accounting/accounts/");
  return response.data;
}

export interface CreateAccountPayload {
  code: string;
  name: string;
  account_type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
  description?: string;
  parent?: string | null;
  is_active?: boolean;
}

export interface CreateAccountResponse {
  id: string;
  code: string;
  name: string;
}

export async function createAccount(payload: CreateAccountPayload): Promise<CreateAccountResponse> {
  const response = await api.post<CreateAccountResponse>("/api/accounting/accounts/", payload);
  return response.data;
}

export async function updateAccount(id: string, payload: Partial<CreateAccountPayload>): Promise<AccountListItem> {
  const response = await api.patch<AccountListItem>(`/api/accounting/accounts/${id}/`, payload);
  return response.data;
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/api/accounting/accounts/${id}/`);
}
