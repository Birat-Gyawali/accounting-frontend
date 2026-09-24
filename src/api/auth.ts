import axios from "axios";
import api from "./axios";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  created_at: string;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
  organizations: AuthOrganization[];
}

export interface SignupResponse {
  user: AuthUser;
  organization: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    pan_number: string;
    is_active: boolean;
    created_at: string;
  };
  role: string;
  tokens: {
    access: string;
    refresh: string;
  };
}

export async function signup(payload: {
  organization_name: string;
  email: string;
  password: string;
  password_confirm: string;
  full_name?: string;
  phone_number?: string;
}): Promise<SignupResponse> {
  const response = await api.post<SignupResponse>("/api/auth/signup/", payload);
  return response.data;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/api/auth/login/", { email, password });
  return response.data;
}

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "auth_user";
const ORGANIZATIONS_KEY = "auth_organizations";

export function saveAuthSession(data: LoginResponse): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(data.organizations));
}

export function getStoredOrganizations(): AuthOrganization[] {
  const raw = localStorage.getItem(ORGANIZATIONS_KEY);
  return raw ? (JSON.parse(raw) as AuthOrganization[]) : [];
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ORGANIZATIONS_KEY);
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data && typeof data === "object") {
      if (typeof (data as { detail?: unknown }).detail === "string") {
        return (data as { detail: string }).detail;
      }

      const firstFieldErrors = Object.values(data as Record<string, unknown>)[0];
      if (Array.isArray(firstFieldErrors) && typeof firstFieldErrors[0] === "string") {
        return firstFieldErrors[0];
      }
    }

    if (!error.response) {
      return "Could not reach the server. Check your connection and try again.";
    }
  }

  return "Something went wrong. Please try again.";
}

export interface SelectOrganizationResponse {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  role: string;
  tokens: {
    access: string;
    refresh: string;
  };
}

export async function selectOrganization(
  organizationId: string
): Promise<SelectOrganizationResponse> {
  const response = await api.post<SelectOrganizationResponse>(
    "/api/auth/select-organization/",
    { organization_id: organizationId }
  );
  return response.data;
}

const CURRENT_ORGANIZATION_KEY = "current_organization";

export function saveOrganizationTokens(
  data: SelectOrganizationResponse,
  organization?: AuthOrganization
): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refresh);

  const orgToSave = data.organization ?? organization;
  if (orgToSave) {
    localStorage.setItem(CURRENT_ORGANIZATION_KEY, JSON.stringify(orgToSave));
  }

  if (data.role) {
    localStorage.setItem("current_role", data.role);
  }
}

export function getCurrentOrganization(): AuthOrganization | null {
  const raw = localStorage.getItem(CURRENT_ORGANIZATION_KEY);
  return raw ? (JSON.parse(raw) as AuthOrganization) : null;
}

