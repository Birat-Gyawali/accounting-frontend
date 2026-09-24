import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAuthSession, getCurrentOrganization } from "../api/auth";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/invoices", label: "Invoices" },
  { to: "/invoices/new", label: "New Invoice" },
  { to: "/bills", label: "Bills" },
  { to: "/bills/new", label: "New Bill" },
  { to: "/accounts", label: "Chart of Accounts" },
  { to: "/team", label: "Team" },
  { to: "/customers", label: "Customers" },
  { to: "/vendors", label: "Vendors" },
  { to: "/receipts/new", label: "Record Receipt" },
  { to: "/payments/new", label: "Record Payment" },
  { to: "/reports", label: "Reports" },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const organization = getCurrentOrganization();

  function handleLogout() {
    clearAuthSession();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Organization</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
            {organization?.name ?? "No organization selected"}
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 px-3 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}