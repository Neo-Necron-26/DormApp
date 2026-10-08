import { createApiClient } from "@sfu/shared";

export const TOKEN_KEY = "sfu_admin_token";
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = createApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => localStorage.getItem(TOKEN_KEY),
});

export function photoUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}
