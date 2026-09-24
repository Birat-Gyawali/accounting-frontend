import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import SelectOrganization from "./pages/SelectOrganization";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceDetail from "./pages/InvoiceDetail";
import PrintInvoice from "./pages/PrintInvoice";
import Bills from "./pages/Bills";
import CreateBill from "./pages/CreateBill";
import BillDetail from "./pages/BillDetail";
import RecordReceipt from "./pages/RecordReceipt";
import RecordPayment from "./pages/RecordPayment";
import Reports from "./pages/Reports";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Team from "./pages/Team";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Customers from "./pages/Customers";
import Vendors from "./pages/Vendors";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/select-organization" element={<SelectOrganization />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/invoices/:id/print" element={<PrintInvoice />} />

        {/* Protected routes under AppLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<CreateInvoice />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/bills/new" element={<CreateBill />} />
            <Route path="/bills/:id" element={<BillDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/receipts/new" element={<RecordReceipt />} />
            <Route path="/payments/new" element={<RecordPayment />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/team" element={<Team />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}