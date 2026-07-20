import * as Network from 'expo-network';

import { getSession } from './config';

export type ApiErrorKind =
  | 'offline'
  | 'timeout'
  | 'unauthorized' // 401
  | 'forbidden' // 403 (e.g. wrong facility)
  | 'not_found' // 404
  | 'validation' // 400 / 422
  | 'server' // 5xx
  | 'unknown';

export class ApiError extends Error {
  kind: ApiErrorKind;
  status: number;
  body: unknown;
  constructor(kind: ApiErrorKind, message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.body = body;
  }
}

/** Human-friendly copy per error kind, for UI states. */
export function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.kind) {
      case 'offline':
        return 'You appear to be offline. Your work is saved and will sync when you reconnect.';
      case 'timeout':
        return 'The server took too long to respond. Please try again.';
      case 'unauthorized':
        return 'Your session is not authorized. Please sign in again.';
      case 'forbidden':
        return 'You do not have access to this facility or record.';
      case 'not_found':
        return 'That endpoint or record was not found.';
      case 'validation':
        return err.message || 'The request was rejected by the server.';
      case 'server':
        return 'The server had a problem. Please try again shortly.';
      default:
        return err.message || 'Something went wrong.';
    }
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

const TIMEOUT_MS = 20000;

async function isOffline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === false || state.isInternetReachable === false;
  } catch {
    return false; // if we can't tell, attempt the request
  }
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 400 || status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

async function request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  if (await isOffline()) {
    throw new ApiError('offline', 'No network connection', 0, null);
  }

  const session = await getSession();
  const headers: Record<string, string> = {
    // Dev-grade facility headers the deployed backend requires today.
    'x-user-id': session.userId,
    'x-user-roles': session.roles,
    'x-facility-id': session.facilityId,
    Accept: 'application/json',
    ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...((init.headers as Record<string, string>) ?? {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${session.baseUrl}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (e: any) {
    clearTimeout(timer);
    if (e?.name === 'AbortError') {
      throw new ApiError('timeout', 'Request timed out', 0, null);
    }
    // fetch network failure (DNS, CORS on web, connection reset)
    throw new ApiError('offline', e?.message ?? 'Network request failed', 0, null);
  }
  clearTimeout(timer);

  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const msg = (body && (body.error || body.message)) || `Request failed (${res.status})`;
    throw new ApiError(kindForStatus(res.status), msg, res.status, body);
  }
  return body as T;
}

export const api = {
  request,
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, data: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T = any>(path: string, data: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  del: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ---- Typed helpers for the hub's live endpoints ----

export type DashboardSummary = {
  total_equipment: number;
  available: number;
  under_repair: number;
  maintenance_required: number;
  open_work_orders: number;
  overdue_plans: number;
  inspections_this_month: number;
  total_costs_this_month: number;
};

// Row shapes are schema-flexible: the real column names are not yet confirmed
// against the backend source, so rows are rendered generically. See
// docs/mobile-api-contract.md.
export type Row = Record<string, any>;

/** Candidate keys used to correlate an inspection row to an equipment id. */
const EQUIP_KEYS = ['equipment_id', 'equipmentId', 'asset_id', 'assetId', 'equipment'];

export const hub = {
  health: () => api.get('/api/database/health'),
  dashboard: () =>
    api.get<{ success: boolean; summary: DashboardSummary }>('/api/dashboard/summary'),
  facilities: () => api.get<{ facilities: Row[] }>('/api/facilities'),
  equipment: () => api.get<{ equipment: Row[] }>('/api/equipment'),
  equipmentById: (id: string) => api.get<{ equipment: Row }>(`/api/equipment/${id}`),
  workOrders: () => api.get<{ work_orders: Row[] }>('/api/work-orders'),
  plans: () => api.get<{ plans: Row[] }>('/api/maintenance-plans'),
  inspections: () => api.get<{ inspections: Row[] }>('/api/inspections'),
  meterReadings: () => api.get<{ readings: Row[] }>('/api/meter-readings'),
  costs: () => api.get<{ costs: Row[] }>('/api/maintenance-costs'),
  createInspection: (data: Row) =>
    api.post<{ success: boolean; inspection?: Row }>('/api/inspections', data),

  /**
   * Equipment-scoped inspection history. The dedicated route
   * `/api/equipment/:id/inspections` does not exist yet (returns 404), so we
   * fetch all facility inspections and filter client-side by equipment id.
   */
  equipmentInspections: async (equipmentId: string): Promise<Row[]> => {
    const all = (await api.get<{ inspections: Row[] }>('/api/inspections')).inspections ?? [];
    return all.filter((r) =>
      EQUIP_KEYS.some((k) => r[k] != null && String(r[k]) === String(equipmentId)),
    );
  },
};
