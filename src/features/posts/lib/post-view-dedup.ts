"use client";

export const POST_VIEW_DEDUP_INTERVAL_MS = 30 * 60 * 1000;

const POST_VIEW_STORAGE_KEY_PREFIX = "wjinsslog:viewed-post:";

function getPostViewStorageKey(postId: string): string {
  return `${POST_VIEW_STORAGE_KEY_PREFIX}${postId}`;
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredViewedAt(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const viewedAt = Number(value);
  return Number.isFinite(viewedAt) ? viewedAt : null;
}

export function canIncreasePostView(postId: string): boolean {
  const normalizedPostId = postId.trim();

  if (!normalizedPostId) {
    return false;
  }

  const storage = getBrowserStorage();

  if (!storage) {
    return false;
  }

  try {
    const storageKey = getPostViewStorageKey(normalizedPostId);
    const viewedAt = readStoredViewedAt(storage.getItem(storageKey));

    if (viewedAt === null) {
      return true;
    }

    return Date.now() - viewedAt >= POST_VIEW_DEDUP_INTERVAL_MS;
  } catch {
    return false;
  }
}

export function markPostAsViewed(postId: string): boolean {
  const normalizedPostId = postId.trim();

  if (!normalizedPostId) {
    return false;
  }

  const storage = getBrowserStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(getPostViewStorageKey(normalizedPostId), String(Date.now()));
    return true;
  } catch {
    return false;
  }
}
