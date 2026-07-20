# Mobile Authentication & Facility Security

> **Status: mobile side implemented; backend token flow PROPOSED (not yet available).**

## Current state (VERIFIED)

The deployed backend authenticates with development-grade headers
(`x-user-id`, `x-user-roles`, `x-facility-id`). There is no real token/login endpoint
in the deployed instance today.

## Mobile client behavior (IMPLEMENTED)

- The session (`baseUrl`, `userId`, `roles`, `facilityId`, `token`) is stored with
  **Expo SecureStore** on native (OS keychain/keystore) and falls back to
  AsyncStorage on web only (`src/lib/secureStore.ts`). Web is dev/preview only, not a
  shipping credential target.
- When a `token` is present, the client sends `Authorization: Bearer <token>` on every
  request (`src/lib/api.ts`).
- **Production build gating (`!__DEV__`):** the editable identity fields
  (`x-user-id`, `x-user-roles`, `x-facility-id`) are **hidden** in the Settings screen.
  They appear only under a clearly labeled "Developer identity override" card when
  `__DEV__` is true (`src/app/settings.tsx`, gated on `DEV_MODE`). In production only
  the token drives identity.

## Backend requirements (PROPOSED — must be implemented + verified)

1. Expose a real token auth flow (login → short-lived access token, ideally with
   refresh). Return a token the client stores in SecureStore.
2. Derive **user id, roles, and facility** from the **verified token**, server-side.
   Do **not** trust `x-user-*` / `x-facility-id` headers in production.
3. **Never trust a client-supplied role.** Authorization decisions use the
   server-verified role only.
4. **Facility isolation:** a user's accessible facilities come from
   `user_facility_access` (or equivalent). An `LT_F1` user must not read or write
   `LT_F21` records **even if they change a header**. Return `403` on cross-facility
   access.
5. Every facility-owned query must include facility scope; never fetch by ID alone.

## Migration path

Keep the dev header trio working behind an environment flag during transition. Once
token auth ships, disable header-based identity in production and rely solely on the
Bearer token. The mobile client already prefers the token and hides the dev fields in
release builds, so no mobile change is required to complete the cutover.
