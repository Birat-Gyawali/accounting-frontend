import api from "./axios";

export type PaymentType = "RECEIPT" | "PAYMENT";
export type PaymentMode =
  | "CASH"
  | "BANK_TRANSFER"
  | "CHEQUE"
  | "MOBILE_WALLET"
  | "OTHER";
export type PaymentStatus = "DRAFT" | "POSTED";

export interface CreateReceiptPayload {
  payment_type: "RECEIPT";
  party: string;
  payment_date: string;
  amount: string;
  payment_mode: PaymentMode;
  notes: string;
  cash_bank_account: string;
  receivable_account: string;
  sales_invoice: string;
}

export interface CreatePaymentPayload {
  payment_type: "PAYMENT";
  party: string;
  payment_date: string;
  amount: string;
  payment_mode: PaymentMode;
  notes: string;
  cash_bank_account: string;
  payable_account: string;
  purchase_bill: string;
}

export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
}

export async function createReceipt(payload: CreateReceiptPayload): Promise<PaymentResponse> {
  const response = await api.post<PaymentResponse>("/api/payments/", payload);
  return response.data;
}

export async function createPayment(payload: CreatePaymentPayload): Promise<PaymentResponse> {
  const response = await api.post<PaymentResponse>("/api/payments/", payload);
  return response.data;
}

export async function postPayment(id: string): Promise<PaymentResponse> {
  const response = await api.post<PaymentResponse>(`/api/payments/${id}/post/`);
  return response.data;
}