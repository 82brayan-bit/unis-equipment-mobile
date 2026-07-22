# Ticket Notifications + Email Integration

This document describes how the UNIS Equipment Hub backend should connect to
`https://unisticket.item.com` so equipment events can create tickets and send email or
push notifications.

## Scope

- Mobile app repo: `82brayan-bit/unis-equipment-mobile`
- Hub backend base URL used by the app:
  `https://unis-equipment-performance-maintenance-hub.coolify.item.pub`
- Ticket/notification service: `https://unisticket.item.com`
- Tenant: `LT`
- Facility: `LT_F1`
- Timezone: `America/Los_Angeles`

The Expo mobile app must **not** call `unisticket.item.com` directly if IAM tokens or
API keys are required. The mobile app should call the Hub backend, and the Hub backend
should call `unisticket.item.com` server-to-server.

## Backend environment variables

Configure these only on the Hub backend/Coolify service. Do not put secret values in
this repository, in `EXPO_PUBLIC_*` variables, or in the mobile bundle.

```bash
# Non-secret routing / business scope
UNIS_TICKET_BASE_URL=https://unisticket.item.com
UNIS_TICKET_TENANT=LT
UNIS_TICKET_FACILITY_ID=LT_F1
UNIS_TICKET_TIMEZONE=America/Los_Angeles

# Secrets: set real values only in backend secret storage
UNIS_TICKET_IAM_TOKEN=
UNIS_TICKET_API_KEY=

# Optional email metadata used by the Hub when requesting outbound email
NOTIFICATION_FROM_EMAIL=
NOTIFICATION_REPLY_TO_EMAIL=
```

`UNIS_TICKET_IAM_TOKEN` and `UNIS_TICKET_API_KEY` are intentionally blank in docs and
examples. They must be supplied through backend secret storage only.

## Recommended Hub flow

1. Mobile submits an inspection, work order, meter reading, or manual ticket request to
   the Hub backend.
2. Hub authenticates the user and resolves tenant/facility from the server-side auth
   context.
3. Hub validates the payload and creates/updates its own local ticket or event record.
4. Hub calls `unisticket.item.com` with backend-only IAM/API credentials.
5. Hub stores the external ticket/notification ID returned by the ticket service.
6. Hub returns a safe response to the mobile app without exposing raw provider headers,
   credentials, or secret values.

## Proposed Hub endpoints

### `POST /api/tickets`

Create a ticket and optionally send notifications.

```jsonc
{
  "client_ref": "uuid-v4",
  "source": "inspection|work_order|meter_reading|manual",
  "equipment_id": "string|null",
  "inspection_id": "string|null",
  "severity": "low|medium|high|critical",
  "title": "string",
  "description": "string",
  "notify": true,
  "channels": ["email", "push"],
  "email_recipients": ["ops@example.com"]
}
```

Expected response:

```jsonc
{
  "success": true,
  "ticket": {
    "id": "hub-ticket-id",
    "external_id": "unisticket-id",
    "status": "open"
  }
}
```

### `POST /api/tickets/:id/notifications`

Send or re-send notification(s) for an existing ticket.

```jsonc
{
  "channels": ["email", "push"],
  "subject": "string",
  "message": "string",
  "recipients": ["ops@example.com"]
}
```

Expected response:

```jsonc
{ "success": true, "notification_id": "string" }
```

## Security requirements

- Never expose IAM tokens, API keys, raw `Authorization` headers, or email provider
  secrets to the Expo app.
- Redact secrets from logs and error responses.
- Validate facility scope server-side; do not trust mobile-supplied facility headers in
  production.
- Use `client_ref` as an idempotency key so offline retries do not create duplicate
  tickets or notifications.
- Store provider IDs (`external_id`, `notification_id`) for audit and support.
- Return mobile-safe errors such as `validation`, `forbidden`, `not_found`, or
  `server`; do not pass through sensitive provider error bodies.

## Implementation notes for the Hub backend

The Hub backend should use a server-side HTTP client with headers similar to:

```text
Authorization: Bearer <UNIS_TICKET_IAM_TOKEN>
x-api-key: <UNIS_TICKET_API_KEY>
content-type: application/json
```

The placeholders above are variable references only. Do not commit or display the real
values.

If `unisticket.item.com` requires different header names or request paths, update this
document and the Hub backend together after confirming the provider contract.
