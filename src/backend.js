export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const TIMEOUT_MS = 10000;

export class BackendError extends Error {
  constructor(message, { code, status } = {}) {
    super(message);
    this.name = 'BackendError';
    this.code = code;
    this.status = status;
  }
}

async function request(url, { method = 'GET', body, headers, token } = {}) {
  if (!isConfigured()) throw new BackendError('Backend is not configured', { code: 'NOT_CONFIGURED' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    const payload = text ? safeParse(text) : null;

    if (!response.ok) {
      // PostgREST reports { message, code }; GoTrue reports { msg, error_code }.
      throw new BackendError(
        payload?.message ?? payload?.msg ?? payload?.error_description ?? `HTTP ${response.status}`,
        {
          code: payload?.error_code ?? (typeof payload?.code === 'string' ? payload.code : undefined),
          status: response.status,
        },
      );
    }

    return { data: payload, headers: response.headers };
  } catch (error) {
    if (error.name === 'AbortError') throw new BackendError('Request timed out', { code: 'TIMEOUT' });
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** PostgREST. Pass a user access token to write under that user's identity. */
export async function rest(path, options) {
  const { data } = await request(`${SUPABASE_URL}/rest/v1/${path}`, options);
  return data;
}

/** Matching row count, read from Content-Range without transferring rows. */
export async function restCount(path) {
  const { headers } = await request(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'HEAD',
    headers: { Prefer: 'count=exact', Range: '0-0' },
  });
  const total = Number.parseInt(headers.get('content-range')?.split('/')[1] ?? '', 10);
  return Number.isFinite(total) ? total : 0;
}

/** GoTrue. */
export async function auth(path, options) {
  const { data } = await request(`${SUPABASE_URL}/auth/v1/${path}`, options);
  return data;
}
