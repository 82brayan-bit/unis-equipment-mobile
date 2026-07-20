import { secureDelete, secureGet, secureSet } from './secureStore';

/**
 * Connection + identity settings for the UNIS Equipment Hub.
 *
 * The deployed backend currently authenticates facility-scoped requests with
 * `x-user-id` / `x-user-roles` / `x-facility-id` headers (development-grade).
 * We ALSO support an `Authorization: Bearer <token>` for when the backend
 * exposes a real token auth flow — see docs/mobile-authentication.md.
 *
 * In production builds (`!__DEV__`) the identity fields are NOT editable in the
 * UI; only a signed-in token should drive identity. The editable header
 * override is a DEV-ONLY convenience.
 */
const env = process.env;

export const DEFAULTS = {
  baseUrl:
    env.EXPO_PUBLIC_API_BASE_URL ??
    'https://unis-equipment-performance-maintenance-hub.coolify.item.pub',
  userId: env.EXPO_PUBLIC_DEV_USER_ID ?? '19708',
  roles: env.EXPO_PUBLIC_DEV_USER_ROLES ?? 'admin',
  facilityId: env.EXPO_PUBLIC_DEV_FACILITY_ID ?? 'LT_F1',
  token: '',
} as const;

export type Session = {
  baseUrl: string;
  userId: string;
  roles: string;
  facilityId: string;
  /** Optional bearer token; when present it is sent as Authorization: Bearer. */
  token: string;
};

/** True only in development builds. Gates the editable identity override. */
export const DEV_MODE: boolean =
  typeof __DEV__ !== 'undefined' ? __DEV__ : false;

const STORAGE_KEY = 'unis.session.v2';

let cache: Session | null = null;

export async function getSession(): Promise<Session> {
  if (cache) return cache;
  let session: Session;
  try {
    const raw = await secureGet(STORAGE_KEY);
    session = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    session = { ...DEFAULTS };
  }
  cache = session;
  return session;
}

export async function saveSession(session: Session): Promise<void> {
  cache = session;
  await secureSet(STORAGE_KEY, JSON.stringify(session));
}

export async function updateSession(patch: Partial<Session>): Promise<Session> {
  const next = { ...(await getSession()), ...patch };
  await saveSession(next);
  return next;
}

export async function resetSession(): Promise<Session> {
  cache = { ...DEFAULTS };
  await secureDelete(STORAGE_KEY);
  return cache;
}
