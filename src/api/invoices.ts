import api from "./axios";

export type InvoiceStatus = "DRAFT" | "POSTED" | "CANCELLED";

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  party: string;
  party_name: string;
  invoice_date: string;
  status: InvoiceStatus;
  total_amount: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function fetchInvoices(url?: string): Promise<PaginatedResponse<InvoiceListItem>> {
  
  const response = url
    ? await api.get<PaginatedResponse<InvoiceListItem>>(url)
    : await api.get<PaginatedResponse<InvoiceListItem>>("/api/sales/invoices/");
  return response.data;
}

export interface InvoiceLinePayload {
  description: string;
  quantity: string;
  rate: string;
  income_account: string;
}

export interface CreateInvoicePayload {
  party: string;
  invoice_date: string;
  due_date: string | null;
  narration: string;
  tax_amount: string;
  receivable_account: string;
  lines: InvoiceLinePayload[];
}

export interface CreateInvoiceResponse {
  id: string;
  invoice_number: string;
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<CreateInvoiceResponse> {
  const response = await api.post<CreateInvoiceResponse>("/api/sales/invoices/", payload);
  return response.data;
}

export interface InvoiceLineDetail {
  id: string;
  description: string;
  quantity: string;
  rate: string;
  amount: string;
  income_account: string;
}

export interface InvoiceDetail {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  party: string;
  party_name: string;
  invoice_date: string;
  due_date: string | null;
  narration: string;
  tax_amount: string;
  receivable_account: string;
  lines: InvoiceLineDetail[];
  subtotal: string;
  total_amount: string;
  journal_entry_id: string | null;
}

export async function fetchInvoice(id: string): Promise<InvoiceDetail> {
  const response = await api.get<InvoiceDetail>(`/api/sales/invoices/${id}/`);
  return response.data;
}

export async function postInvoice(id: string): Promise<InvoiceDetail> {
  const response = await api.post<InvoiceDetail>(`/api/sales/invoices/${id}/post/`);
  return response.data;
}