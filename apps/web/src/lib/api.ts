import type { DataEnvelope, ListEnvelope, LoginResponse, UserRole } from "@coadjust/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("coadjust_token");
}

export function setSession(token: string, user: LoginResponse["user"]) {
  localStorage.setItem("coadjust_token", token);
  localStorage.setItem("coadjust_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("coadjust_token");
  localStorage.removeItem("coadjust_user");
}

export function getStoredUser(): LoginResponse["user"] | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("coadjust_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoginResponse["user"];
  } catch {
    return null;
  }
}

export function homeForRole(role: UserRole): string {
  switch (role) {
    case "handler":
      return "/handler";
    case "team_leader":
      return "/leader";
    case "quality_conduct":
      return "/ops/baselines";
    case "workforce":
      return "/workforce/redeploy";
    case "caio_governance":
      return "/ops/register";
    case "dpo":
      return "/ops/reproduce";
    default:
      return "/handler";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (init.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (body as { title?: string; detail?: string }).detail ||
        (body as { title?: string }).title ||
        res.statusText,
      body
    );
  }
  return body as T;
}

export async function login(email: string, password: string) {
  const res = await apiFetch<DataEnvelope<LoginResponse>>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    auth: false,
  });
  setSession(res.data.token, res.data.user);
  return res.data;
}

export async function listData<T>(path: string) {
  const res = await apiFetch<ListEnvelope<T>>(path);
  return res.data.items;
}

export async function getData<T>(path: string) {
  const res = await apiFetch<DataEnvelope<T>>(path);
  return res.data;
}

export async function postData<T>(path: string, body: unknown) {
  const res = await apiFetch<DataEnvelope<T>>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}
