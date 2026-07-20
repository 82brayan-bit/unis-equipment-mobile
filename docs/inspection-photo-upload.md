# Inspection Photo Upload

> **Status: PROPOSED. No photo endpoint exists on the deployed backend today.**

## Why photos are not in the JSON payload

Embedding photos as base64 inside the inspection JSON was explicitly rejected:
base64 inflates payload size ~33%, blows past body-size limits, blocks streaming, and
mixes binary blobs into a transactional record insert. The mobile client therefore:

- Captures photos as **local file URIs** only (`src/app/inspections/new.tsx`).
- Keeps them local and marked **pending** — they travel with an offline draft as
  `photoUris: string[]` but are **never** uploaded until a real endpoint exists.

## Proposed endpoint

`POST /api/inspections/:id/photos` — `multipart/form-data`

1. Client first creates the inspection (`POST /api/inspections`) and receives its id.
2. Client uploads each photo as a multipart part to the returned id.

### Server-side validation (required)

- **MIME allow-list:** `image/jpeg`, `image/png`, `image/webp` — validate the actual
  bytes, not just the declared `Content-Type` or extension.
- **Extension allow-list** matching the MIME.
- **Max size per file** (e.g. 10 MB) and **max count per inspection** (e.g. 12).
- **Server-generated safe filenames** (e.g. `<uuid>.<ext>`). Never trust or reuse the
  client-supplied filename.

### Storage

- Persist bytes to **durable object storage** (S3-compatible / signed URLs), **not**
  the container filesystem (ephemeral on redeploy).
- Store **metadata in PostgreSQL**: file id, inspection id, equipment id, facility id,
  uploader id, MIME, size, storage key, created_at.
- Link each photo to its inspection **and** enforce facility scope — a photo can only
  be attached to an inspection in the uploader's facility.

### Response

Return stable identifiers and retrievable URLs:

```jsonc
{
  "photos": [
    { "id": "uuid", "url": "https://.../signed", "mime": "image/jpeg", "bytes": 812345 }
  ]
}
```

## Alternative: signed direct-to-storage upload

Backend issues a short-lived signed upload URL per photo; client PUTs bytes directly;
then client (or a storage webhook) confirms and the backend writes metadata. Avoids
proxying large bodies through the API server.

## Mobile client readiness

Once the endpoint exists, the offline queue's `syncDrafts()` (`src/lib/queue.ts`)
should be extended to, after the inspection JSON is accepted, upload each
`photoUris[]` entry to `POST /api/inspections/:id/photos` and only then remove the
draft. The draft already carries the local URIs for exactly this purpose.
