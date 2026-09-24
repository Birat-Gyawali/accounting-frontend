import api from "./axios";

export interface Membership {
  id: string;
  user: string;
  email: string;
  full_name: string;
  role: "STAFF" | "MANAGER" | "ACCOUNTANT" | "ADMIN" | "OWNER";
  role_display: string;
  is_active: boolean;
  created_at: string;
}

export interface InvitePayload {
  email: string;
  full_name: string;
  role: "STAFF" | "MANAGER" | "ACCOUNTANT" | "ADMIN" | "OWNER";
  password: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function fetchMemberships(url?: string): Promise<PaginatedResponse<Membership>> {
  const response = url
    ? await api.get<PaginatedResponse<Membership>>(url)
    : await api.get<PaginatedResponse<Membership>>("/api/memberships/");
  return response.data;
}

export async function inviteMember(payload: InvitePayload): Promise<Membership> {
  const response = await api.post<Membership>("/api/memberships/invite/", payload);
  return response.data;
}

export async function updateMembership(
  id: string,
  payload: { role?: Membership["role"]; is_active?: boolean }
): Promise<Membership> {
  const response = await api.patch<Membership>(`/api/memberships/${id}/`, payload);
  return response.data;
}
export async function deactivateMembership(id: string): Promise<Membership> {
  const response = await api.post<Membership>(`/api/memberships/${id}/deactivate/`);
  return response.data;
}