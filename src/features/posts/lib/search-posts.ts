import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { loadPostTagNamesByPostIds } from "@/features/posts/lib/post-tag-relations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PostSummary } from "@/types/post";

const MIN_SEARCH_QUERY_LENGTH = 1;
const POST_SEARCH_BASE_SELECT =
  "id, slug, title, excerpt, thumbnail_url, likes_count, views_count, comments_count, created_at, published_at";

type SearchablePostRow = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readId(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isMissingDeletedAtColumnError(error: PostgrestError): boolean {
  const message = error.message.toLowerCase();

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    (message.includes("deleted_at") && message.includes("column"))
  );
}

function escapeIlikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function uniqueIds(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => value !== null))];
}

function mapRowToPostSummary(
  row: SearchablePostRow,
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

async function selectPublishedPostIdsByTitle({
  supabase,
  searchPattern,
  excludeDeleted,
}: {
  supabase: SupabaseClient;
  searchPattern: string;
  excludeDeleted: boolean;
}): Promise<{ postIds: string[]; error: PostgrestError | null }> {
  let query = supabase
    .from("posts")
    .select("id")
    .eq("status", "published")
    .ilike("title", searchPattern);

  if (excludeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;

  return {
    postIds: uniqueIds(asRecordArray(data).map((row) => readId(row.id))),
    error,
  };
}

async function loadPublishedPostIdsByTitle({
  supabase,
  searchPattern,
}: {
  supabase: SupabaseClient;
  searchPattern: string;
}): Promise<{ postIds: string[]; error: PostgrestError | null }> {
  const softDeleteAwareResult = await selectPublishedPostIdsByTitle({
    supabase,
    searchPattern,
    excludeDeleted: true,
  });

  if (
    softDeleteAwareResult.error &&
    isMissingDeletedAtColumnError(softDeleteAwareResult.error)
  ) {
    return selectPublishedPostIdsByTitle({
      supabase,
      searchPattern,
      excludeDeleted: false,
    });
  }

  return softDeleteAwareResult;
}

async function loadPublishedPostIdsByTagName({
  supabase,
  searchPattern,
}: {
  supabase: SupabaseClient;
  searchPattern: string;
}): Promise<{ postIds: string[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("post_tags")
    .select("post_id, tags!inner(name), posts!inner(status)")
    .ilike("tags.name", searchPattern)
    .eq("posts.status", "published");

  return {
    postIds: uniqueIds(asRecordArray(data).map((row) => readId(row.post_id))),
    error,
  };
}

async function selectPublishedPostRowsByIds({
  supabase,
  postIds,
  excludeDeleted,
}: {
  supabase: SupabaseClient;
  postIds: string[];
  excludeDeleted: boolean;
}): Promise<{ data: unknown; error: PostgrestError | null }> {
  let query = supabase
    .from("posts")
    .select(POST_SEARCH_BASE_SELECT)
    .in("id", postIds)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (excludeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;
  return { data, error };
}

async function loadPublishedPostRowsByIds({
  supabase,
  postIds,
}: {
  supabase: SupabaseClient;
  postIds: string[];
}): Promise<{ data: unknown; error: PostgrestError | null }> {
  const softDeleteAwareResult = await selectPublishedPostRowsByIds({
    supabase,
    postIds,
    excludeDeleted: true,
  });

  if (
    softDeleteAwareResult.error &&
    isMissingDeletedAtColumnError(softDeleteAwareResult.error)
  ) {
    return selectPublishedPostRowsByIds({
      supabase,
      postIds,
      excludeDeleted: false,
    });
  }

  return softDeleteAwareResult;
}

export async function searchPosts(query: string): Promise<PostSummary[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const searchPattern = `%${escapeIlikePattern(normalizedQuery)}%`;

  const [titleMatches, tagMatches] = await Promise.all([
    loadPublishedPostIdsByTitle({ supabase, searchPattern }),
    loadPublishedPostIdsByTagName({ supabase, searchPattern }),
  ]);

  if (titleMatches.error) {
    console.error("[searchPosts] title query failed", {
      message: titleMatches.error.message,
      code: titleMatches.error.code,
    });

    return [];
  }

  if (tagMatches.error) {
    console.error("[searchPosts] tag query failed", {
      message: tagMatches.error.message,
      code: tagMatches.error.code,
    });

    return [];
  }

  const matchedPostIds = uniqueIds([...titleMatches.postIds, ...tagMatches.postIds]);

  if (matchedPostIds.length === 0) {
    return [];
  }

  const { data, error } = await loadPublishedPostRowsByIds({
    supabase,
    postIds: matchedPostIds,
  });

  if (error) {
    console.error("[searchPosts] posts query failed", {
      message: error.message,
      code: error.code,
    });

    return [];
  }

  const postRows = asRecordArray(data);
  const postIds = postRows
    .map((row) => readId(row.id))
    .filter((postId): postId is string => postId !== null);

  const postTagNames = await loadPostTagNamesByPostIds({
    supabase,
    postIds,
  });

  if (!postTagNames.ok) {
    console.error("[searchPosts] tag names query failed", {
      message: postTagNames.message,
    });

    return [];
  }

  return postRows
    .map((row) => mapRowToPostSummary(row, postTagNames.tagNamesByPostId))
    .filter((post): post is PostSummary => post !== null);
}
