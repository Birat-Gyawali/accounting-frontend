import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getErrorMessage,
  getStoredOrganizations,
  saveOrganizationTokens,
  selectOrganization,
  type AuthOrganization,
} from "../api/auth";

export default function SelectOrganization() {
  const navigate = useNavigate();
  const organizations = getStoredOrganizations();

  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(organization: AuthOrganization) {
    setError(null);
    setSelectingId(organization.id);

    try {
      const data = await selectOrganization(organization.id);
      saveOrganizationTokens(data, organization);
      navigate("/invoices");
    } catch (err) {
      setError(getErrorMessage(err));
      setSelectingId(null);
    }
  }

  if (organizations.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">No organizations found</h1>
          <p className="mt-2 text-sm text-slate-500">
            You don't belong to any organization yet. Contact an admin for an invite, or create a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Select an organization</h1>
          <p className="mt-1.5 text-sm text-slate-500">Choose which books you'd like to work on.</p>
        </div>

        <div className="space-y-3">
          {organizations.map((org) => {
            const isSelecting = selectingId === org.id;
            const isDisabled = selectingId !== null;

            return (
              <button
                key={org.id}
                type="button"
                onClick={() => handleSelect(org)}
                disabled={isDisabled}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div>
                  <p className="text-[15px] font-medium text-slate-900">{org.name}</p>
                  <p className="mt-0.5 text-sm capitalize text-slate-500">{org.role}</p>
                </div>

                {isSelecting ? (
                  <span className="text-sm text-slate-400">Selecting…</span>
                ) : (
                  <span aria-hidden="true" className="text-slate-300">
                    →
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}