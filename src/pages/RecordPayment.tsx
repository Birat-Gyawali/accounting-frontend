import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/auth";
import { fetchAssetAccounts,fetchLiabilityAccounts, type Account } from "../api/accounts";
import { fetchVendors, type Party } from "../api/parties";
import api from "../api/axios";
import { createPayment, postPayment, type CreatePaymentPayload, type PaymentMode } from "../api/payments";
import type { BillListItem, PaginatedResponse } from "../api/bills";


interface PostedBill extends BillListItem {
  party: string;
}

const PAYMENT_MODES: PaymentMode[] = [
  "CASH",
  "BANK_TRANSFER",
  "CHEQUE",
  "MOBILE_WALLET",
  "OTHER",
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function RecordPayment() {
  const navigate = useNavigate();

  // Reference data
  const [vendors, setVendors] = useState<Party[]>([]);
  const [cashBankAccounts, setCashBankAccounts] = useState<Account[]>([]);
  const [payableAccounts, setPayableAccounts] = useState<Account[]>([]);
  const [postedBills, setPostedBills] = useState<PostedBill[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Form state
  const [party, setParty] = useState("");
  const [purchaseBill, setPurchaseBill] = useState("");
  const [cashBankAccount, setCashBankAccount] = useState("");
  const [payableAccount, setPayableAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [notes, setNotes] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
  fetchVendors(),
  fetchAssetAccounts(),
  fetchLiabilityAccounts(),
  api.get("/api/purchases/bills/", { params: { status: "POSTED" } }),
])
.then(([vendorsData, assetData, liabilityData, billsRes]) => {
  setVendors(vendorsData);
  setCashBankAccounts(assetData);
  setPayableAccounts(liabilityData);
  const data = billsRes.data;
  setPostedBills(Array.isArray(data) ? data : data.results);
})
      .catch((err) => setPageError(getErrorMessage(err)))
      .finally(() => setPageLoading(false));
  }, []);

  // Only show bills belonging to the selected vendor
  const billsForParty = party ? postedBills.filter((bill) => bill.party === party) : [];

  const selectedBill = postedBills.find((bill) => bill.id === purchaseBill) ?? null;

  function handlePartyChange(newParty: string) {
    setParty(newParty);
    setPurchaseBill("");
  }

  function validate(): string | null {
    if (!party) return "Select a vendor.";
    if (!purchaseBill) return "Select a bill.";
    if (!cashBankAccount) return "Select a cash/bank account.";
    if (!payableAccount) return "Select a payable account.";
    if (!paymentDate) return "Payment date is required.";
    if (!(Number(amount) > 0)) return "Amount must be greater than 0.";
    return null;
  }

  function buildPayload(): CreatePaymentPayload {
    return {
      payment_type: "PAYMENT",
      party,
      payment_date: paymentDate,
      amount: Number(amount).toFixed(2),
      payment_mode: paymentMode,
      notes,
      cash_bank_account: cashBankAccount,
      payable_account: payableAccount,
      purchase_bill: purchaseBill,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>, andPost: boolean) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createPayment(buildPayload());

      if (andPost) {
        await postPayment(created.id);
      }

      navigate("/bills", {
        state: {
          flashMessage: andPost ? "Payment recorded and posted." : "Payment saved as draft.",
        },
      });
    } catch (err) {
      setFormError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  if (pageLoading) {
    return <div className="px-6 py-16 text-center text-sm text-slate-500">Loading form…</div>;
  }

  if (pageError) {
    return (
      <div className="px-6 py-16 text-center">
        <p role="alert" className="text-sm text-red-700">
          {pageError}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">Record Payment</h1>

        <form className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="party" className="mb-1.5 block text-sm font-medium text-slate-700">
                Vendor
              </label>
              <select
                id="party"
                value={party}
                onChange={(e) => handlePartyChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="purchase_bill" className="mb-1.5 block text-sm font-medium text-slate-700">
                Bill
              </label>
              <select
                id="purchase_bill"
                value={purchaseBill}
                onChange={(e) => setPurchaseBill(e.target.value)}
                disabled={!party}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">{party ? "Select a bill" : "Select a vendor first"}</option>
                {billsForParty.map((bill) => (
                  <option key={bill.id} value={bill.id}>
                    {bill.bill_number} — {bill.total_amount}
                  </option>
                ))}
              </select>
              {party && billsForParty.length === 0 && (
                <p className="mt-1.5 text-xs text-slate-400">No posted bills for this vendor.</p>
              )}
            </div>

            <div>
              <label htmlFor="cash_bank_account" className="mb-1.5 block text-sm font-medium text-slate-700">
                Cash / bank account
              </label>
              <select
                id="cash_bank_account"
                value={cashBankAccount}
                onChange={(e) => setCashBankAccount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select an account</option>
                {cashBankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} — {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="payable_account" className="mb-1.5 block text-sm font-medium text-slate-700">
                Payable account
              </label>
              <select
                id="payable_account"
                value={payableAccount}
                onChange={(e) => setPayableAccount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select an account</option>
                {payableAccounts.map((account) => (
                  <option key={`ap-${account.id}`} value={account.id}>
                    {account.code} — {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-slate-700">
                Amount
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={selectedBill ? selectedBill.total_amount : "0.00"}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label htmlFor="payment_date" className="mb-1.5 block text-sm font-medium text-slate-700">
                Payment date
              </label>
              <input
                id="payment_date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label htmlFor="payment_mode" className="mb-1.5 block text-sm font-medium text-slate-700">
                Payment mode
              </label>
              <select
                id="payment_mode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-slate-700">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {formError}
            </p>
          )}

          {successMessage && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{successMessage}</p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => navigate("/bills")}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e as unknown as FormEvent<HTMLFormElement>, false)}
              disabled={isSubmitting}
              className="rounded-lg border border-indigo-600 px-4 py-2.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save as draft"}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e as unknown as FormEvent<HTMLFormElement>, true)}
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save & Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}