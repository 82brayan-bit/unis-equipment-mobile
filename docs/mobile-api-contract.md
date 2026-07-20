# Mobile ↔ Hub API Contract

> **Status: PROPOSED / PARTIALLY VERIFIED.**
> The UNIS Equipment Hub backend source and PostgreSQL schema were **not obtainable**
> from this workstation while building the mobile client (no readable repo, no
> `DATABASE_URL`, no OpenAPI spec). Everything marked **PROPOSED** below is the
> contract the mobile app currently assumes and must be reconciled against the real
> backend before it can be called "confirmed". Everything marked **VERIFIED** was
> observed live against the deployed instance on 2026-07-20.

## Base

- **Base URL:** `https://unis-equipment-performance-maintenance-hub.coolify.item.pub`
- **Content type:** `application/json` for request/response bodies.
- All facility-scoped records **must** be queried with facility authorization. Never
  query facility-owned resources by ID alone.

## Identity headers (VERIFIED, development-grade)

The deployed backend authenticates facility-scoped requests with development-grade
headers:

| Header           | Example  | Notes                                            |
| ---------------- | -------- | ------------------------------------------------ |
| `x-user-id`      | `19708`  | Dev-grade user identity.                         |
| `x-user-roles`   | `admin`  | **Never trust client-supplied role in prod.**    |
| `x-facility-id`  | `LT_F1`  | Facility scope. Must be validated server-side.   |
| `Authorization`  | `Bearer <token>` | Preferred production identity (see mobile-authentication.md). |

The mobile client sends the header trio today and additionally sends `Authorization:
Bearer <token>` whenever a token is configured. **The production goal is for the
server to derive user/roles/facility from the verified token and to stop trusting the
header trio.**

## Endpoints consumed by the mobile app

### Read endpoints (VERIFIED to exist; row shapes NOT verified)

| Method | Path                        | Mobile helper            | Response envelope                       |
| ------ | --------------------------- | ------------------------ | --------------------------------------- |
| GET    | `/api/database/health`      | `hub.health()`           | `{ status: 'healthy', ... }`            |
| GET    | `/api/dashboard/summary`    | `hub.dashboard()`        | `{ success, summary: DashboardSummary }`|
| GET    | `/api/facilities`           | `hub.facilities()`       | `{ facilities: Row[] }`                 |
| GET    | `/api/equipment`            | `hub.equipment()`        | `{ equipment: Row[] }`                  |
| GET    | `/api/equipment/:id`        | `hub.equipmentById(id)`  | `{ equipment: Row }`                    |
| GET    | `/api/work-orders`          | `hub.workOrders()`       | `{ work_orders: Row[] }`                |
| GET    | `/api/maintenance-plans`    | `hub.plans()`            | `{ plans: Row[] }`                      |
| GET    | `/api/inspections`          | `hub.inspections()`      | `{ inspections: Row[] }`                |
| GET    | `/api/meter-readings`       | `hub.meterReadings()`    | `{ readings: Row[] }`                   |
| GET    | `/api/maintenance-costs`    | `hub.costs()`            | `{ costs: Row[] }`                      |

`Row = Record<string, any>` — the app renders rows generically because the real
column names are unconfirmed.

### Inspection write (PROPOSED)

`POST /api/inspections`

Observed live behavior (2026-07-20): the endpoint returns **400 `"Facility not
resolved."`** before validating the body, so the body schema could **not** be learned
empirically. The mobile client sends the following **PROPOSED** payload:

```jsonc
{
  "client_ref": "uuid-v4",          // idempotency key; server should de-dupe on this
  "equipment_id": "string",
  "equipment_name": "string|null",
  "status": "pass|fail",            // derived from checklist
  "performed_at": "ISO-8601",
  "meter_reading": 1234,            // optional number
  "notes": "string|null",
  "items": [
    { "key": "brakes", "label": "Brakes", "result": "pass|fail|na" }
  ]
}
```

Expected response (PROPOSED): `{ success: true, inspection?: Row }`.

> **Server TODO (must be implemented + verified):**
> - Persist the inspection **and** its checklist responses in a single DB
>   transaction — both saved together or rolled back together.
> - Derive `inspector` identity and `facility_id` from the authenticated context,
>   **not** from the request body.
> - Enforce facility isolation: an `LT_F1` user cannot write an `LT_F21` record.
> - De-duplicate on `client_ref` so a retried/queued submission cannot create a
>   duplicate.

### Equipment-scoped inspection history (WORKAROUND)

`GET /api/equipment/:id/inspections` — **does not exist yet (404).** The mobile app
fetches `/api/inspections` and filters client-side by candidate equipment keys
(`equipment_id`, `equipmentId`, `asset_id`, `assetId`, `equipment`). This should be
replaced by a real facility-scoped route.

### Photos (NOT IMPLEMENTED)

There is no photo upload endpoint. See `inspection-photo-upload.md` for the proposed
`POST /api/inspections/:id/photos` design. Until it exists, captured photos remain
**local URIs** on the device and are never embedded as base64 in the JSON payload.

## Error taxonomy (mobile client)

The client maps HTTP status → `ApiError.kind`:

| Kind           | Trigger                          |
| -------------- | -------------------------------- |
| `offline`      | no connectivity / fetch failure  |
| `timeout`      | request exceeded 20s             |
| `unauthorized` | 401                              |
| `forbidden`    | 403 (e.g. wrong facility)        |
| `not_found`    | 404                              |
| `validation`   | 400 / 422                        |
| `server`       | 5xx                              |
| `unknown`      | anything else                    |

## Offline queue

Submissions that fail with `offline`/`timeout` are saved to a local draft queue
(`unis.inspection.drafts.v1`) keyed by `client_ref`, and re-submitted via "Sync now"
or automatically on the next successful submit. Photos travel with the draft as local
URIs.
