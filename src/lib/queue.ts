import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError, hub, type Row } from './api';

/**
 * Offline draft queue for inspections.
 *
 * A draft holds the inspection JSON payload plus LOCAL photo URIs. Photos are
 * intentionally NOT embedded as base64 in the payload (see
 * docs/inspection-photo-upload.md) — until the backend exposes a real photo
 * upload endpoint, captured photos stay local and are marked pending.
 */
export type InspectionDraft = {
  /** Idempotency key; also sent as `client_ref` to de-dupe server-side. */
  id: string;
  payload: Row;
  photoUris: string[];
  createdAt: string;
  attempts: number;
  lastError?: string;
  /** Set true once the inspection JSON is accepted by the server. */
  submitted?: boolean;
};

const KEY = 'unis.inspection.drafts.v1';

async function readAll(): Promise<InspectionDraft[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as InspectionDraft[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(drafts: InspectionDraft[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(drafts));
}

export async function listDrafts(): Promise<InspectionDraft[]> {
  return readAll();
}

export async function enqueueDraft(
  draft: Omit<InspectionDraft, 'createdAt' | 'attempts'>,
): Promise<void> {
  const drafts = await readAll();
  // De-dupe by idempotency id — replace instead of appending a duplicate.
  const existing = drafts.findIndex((d) => d.id === draft.id);
  const next: InspectionDraft = {
    ...draft,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  if (existing >= 0) drafts[existing] = { ...drafts[existing], ...next };
  else drafts.push(next);
  await writeAll(drafts);
}

export async function removeDraft(id: string): Promise<void> {
  await writeAll((await readAll()).filter((d) => d.id !== id));
}

export async function draftCount(): Promise<number> {
  return (await readAll()).length;
}

export type SyncResult = { synced: number; failed: number; remaining: number };

/**
 * Attempt to submit all queued inspection payloads. On success a draft is
 * removed. Failures increment `attempts` and keep the draft for later retry.
 */
export async function syncDrafts(): Promise<SyncResult> {
  const drafts = await readAll();
  let synced = 0;
  let failed = 0;
  const keep: InspectionDraft[] = [];

  for (const d of drafts) {
    try {
      await hub.createInspection({ ...d.payload, client_ref: d.id });
      synced += 1;
      // NOTE: photos (d.photoUris) cannot be uploaded yet — no server endpoint.
    } catch (e) {
      failed += 1;
      const msg = e instanceof ApiError ? `${e.kind}: ${e.message}` : String(e);
      // Offline: stop trying the rest, keep everything.
      keep.push({ ...d, attempts: d.attempts + 1, lastError: msg });
      if (e instanceof ApiError && e.kind === 'offline') {
        // preserve remaining drafts untouched
        const idx = drafts.indexOf(d);
        keep.push(...drafts.slice(idx + 1));
        break;
      }
    }
  }
  await writeAll(keep);
  return { synced, failed, remaining: keep.length };
}
