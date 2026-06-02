import "server-only";

import type { PostSummary } from "@/types/post";

export const POST_SUMMARY_SELECT =
  "id, slug, title, excerpt, thumbnail_url, likes_count, views_count, comments_count, created_at";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord);
}

export function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function readId(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

export function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function mapRowToPostSummary(
  row: Record<string, unknown>,
  tagNamesByPostId: Map<string, string[]>,
): PostSummary | null {
  const id = readId(row.id);
  const slug = readString(row.slug);
  const title = readString(row.title);

  if (!id || !slug || !title) {
    return null;
  }

  return {
    id,
    slug,
    title,
    excerpt: readString(row.excerpt) ?? "",
    thumbnailUrl: readString(row.thumbnail_url),
    likesCount: readNumber(row.likes_count),
    viewsCount: readNumber(row.views_count),
    commentsCount: readNumber(row.comments_count),
    createdAt: readString(row.created_at) ?? "",
    tags: tagNamesByPostId.get(id) ?? [],
  };
}
