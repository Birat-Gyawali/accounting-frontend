import api from "./axios";

export interface Party {
  id: string;
  name: string;
  party_type: "CUSTOMER" | "VENDOR" | "BOTH";
  phone: string;
  email: string;
  address: string;
  pan_number: string;
}

export interface CreatePartyPayload {
  name: string;
  party_type: "CUSTOMER" | "VENDOR" | "BOTH";
  phone: string;
  email: string;
  address: string;
  pan_number: string;
}

async function fetchPartiesByType(
  partyType: "CUSTOMER" | "VENDOR" | "BOTH"
): Promise<Party[]> {
  const response = await api.get<{ results?: Party[] } | Party[]>("/api/parties/", {
    params: { party_type: partyType },
  });
  const data = response.data;
  return Array.isArray(data) ? data : (data.results ?? []);
}

export function fetchCustomers(): Promise<Party[]> {
  return fetchPartiesByType("CUSTOMER");
}

export function fetchVendors(): Promise<Party[]> {
  return fetchPartiesByType("VENDOR");
}

export async function createParty(payload: CreatePartyPayload): Promise<Party> {
  const response = await api.post<Party>("/api/parties/", payload);
  return response.data;
}