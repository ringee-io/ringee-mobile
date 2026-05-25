import { API_URL } from '@/constants/Config';

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export function registerTokenGetter(getter: TokenGetter | null) {
  tokenGetter = getter;
}

async function buildHeaders(extra?: Record<string, string>) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(extra || {}),
  };
  try {
    const token = tokenGetter ? await tokenGetter() : null;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // ignore — request will fail with 401 and the screen handles it
  }
  return headers;
}

function buildUrl(path: string, params?: Record<string, unknown>) {
  const base = path.startsWith('http')
    ? path
    : `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!params) return base;

  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join('&');
  return qs ? `${base}?${qs}` : base;
}

async function handle<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = undefined;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new ApiError('Invalid server response', res.status);
    }
  }
  if (!res.ok) {
    const message =
      (body as { message?: string; error?: string })?.message ||
      (body as { error?: string })?.error ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }
  return (body as T) ?? (undefined as T);
}

async function request<T>(
  method: string,
  path: string,
  opts: { params?: Record<string, unknown>; body?: unknown } = {},
): Promise<T> {
  try {
    const url = buildUrl(path, opts.params);
    const res = await fetch(url, {
      method,
      headers: await buildHeaders(),
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    return await handle<T>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      (err as Error)?.message || 'Network error',
      0,
    );
  }
}

export const api = {
  get: <T = unknown>(path: string, params?: Record<string, unknown>) =>
    request<T>('GET', path, { params }),
  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>('POST', path, { body }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    request<T>('PATCH', path, { body }),
  put: <T = unknown>(path: string, body?: unknown) =>
    request<T>('PUT', path, { body }),
  delete: <T = unknown>(path: string, body?: unknown) =>
    request<T>('DELETE', path, { body }),
};
