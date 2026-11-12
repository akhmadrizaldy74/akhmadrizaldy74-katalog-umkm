export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const TOKEN_KEY = "umkm_admin_token";

export const auth = {
  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function errorMessage(body) {
  if (!body?.detail) return "Terjadi kesalahan, coba lagi.";
  if (typeof body.detail === "string") return body.detail;
  // error validasi FastAPI (422)
  return body.detail.map((d) => d.msg.replace(/^Value error, /, "")).join(", ");
}

export async function api(path, { method = "GET", body, form, params } = {}) {
  // params: objek query string; nilai undefined / "" / false dilewati
  const url = new URL(API_URL + path);
  Object.entries(params || {}).forEach(([k, v]) => v !== undefined && v !== "" && v !== false && url.searchParams.set(k, v));

  const headers = {};
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(url, { method, headers, body: form || (body && JSON.stringify(body)) });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && path !== "/api/auth/login") {
      auth.clear();
      window.dispatchEvent(new Event("auth:logout"));
    }
    throw new ApiError(res.status, errorMessage(data));
  }
  return data;
}
