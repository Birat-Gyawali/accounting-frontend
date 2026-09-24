import api from "./axios";

export type BillStatus = "DRAFT" | "POSTED" | "CANCELLED";

export interface BillListItem {
  id: string;
  bill_number: string;
  party: string;
  party_name: string;
  bill_date: string;
  status: BillStatus;
  total_amount: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function fetchBills(url?: string): Promise<PaginatedResponse<BillListItem>> {
  const response = url
    ? await api.get<PaginatedResponse<BillListItem>>(url)
    : await api.get<PaginatedResponse<BillListItem>>("/api/purchases/bills/");
  return response.data;
}

export interface BillLinePayload {
  description: string;
  quantity: string;
  rate: string;
  expense_account: string;
}

export interface CreateBillPayload {
  party: string;
  bill_date: string;
  due_date: string | null;
  narration: string;
  tax_amount: string;
  payable_account: string;
  lines: BillLinePayload[];
}

export interface CreateBillResponse {
  id: string;
  bill_number: string;
}

export async function createBill(payload: CreateBillPayload): Promise<CreateBillResponse> {
  const response = await api.post<CreateBillResponse>("/api/purchases/bills/", payload);
  return response.data;
}

export interface BillLineDetail {
  id: string;
  description: string;
  quantity: string;
  rate: string;
  amount: string;
  expense_account: string;
}

export interface BillDetail {
  id: string;
  bill_number: string;
  status: BillStatus;
  party: string;
  party_name: string;
  bill_date: string;
  due_date: string | null;
  narration: string;
  tax_amount: string;
  payable_account: string;
  lines: BillLineDetail[];
  subtotal: string;
  total_amount: string;
  journal_entry_id: string | null;
}

export async function fetchBill(id: string): Promise<BillDetail> {
  const response = await api.get<BillDetail>(`/api/purchases/bills/${id}/`);
  return response.data;
}

export async function postBill(id: string): Promise<BillDetail> {
  const response = await api.post<BillDetail>(`/api/purchases/bills/${id}/post/`);
  return response.data;
}