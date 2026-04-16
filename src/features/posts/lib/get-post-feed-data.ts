import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PostSummary } from "@/types/post";

const POST_LIST_BASE_SELECT =
  "id, slug, title, excerpt, thumbnail_url, likes_count, views_count, comments_count, created_at";
const POST_LIST_SELECT_WITH_TAGS = `${POST_LIST_BASE_SELECT}, tags`;
const FALLBACK_THUMBNAIL_URL = "/fallbackImage.webp";

type TagsColumnType =
  | "missing"
  | "string"
  | "text_array_or_json_array"
  | "jsonb_object"
  | "unknown";

interface PostFeedData {
  posts: PostSummary[];
  tags: string[];
}

export type PostFeedResult =
  | { ok: true; data: PostFeedData }
  | { ok: false; message: string };

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

function normalizeTag(rawTag?: string): string | null {
  if (!rawTag) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(rawTag).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    const trimmed = rawTag.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}

function isMissingColumnError(error: PostgrestError | null): boolean {
  return Boolean(error && error.code === "42703");
}

function parseStringTags(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}"))
  ) {
    try {
      return parseTagsValue(JSON.parse(trimmed));
    } catch {
      // JSON 형식 문자열이 아니면 아래 일반 문자열 처리로 내려갑니다.
    }
  }

  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  return [trimmed];
}

function parseTagsValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return parseStringTags(value);
  }

  if (isRecord(value)) {
    if ("tags" in value) {
      return parseTagsValue(value.tags);
    }

    if ("values" in value) {
      return parseTagsValue(value.values);
    }
  }

  return [];
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ko"));
}

function inferTagsColumnType(rows: Record<string, unknown>[]): TagsColumnType {
  for (const row of rows) {
    const tags = row.tags;

    if (typeof tags === "string") {
      return "string";
    }

    if (Array.isArray(tags)) {
      return "text_array_or_json_array";
    }

    if (isRecord(tags)) {
      return "jsonb_object";
    }
  }

  return "unknown";
}

async function resolveTagsColumnType(
  supabase: SupabaseClient,
  normalizedTag: string | null,
): Promise<TagsColumnType> {
  const { data, error } = await supabase
    .from("posts")
    .select("tags")
    .not("tags", "is", null)
    .limit(20);

  if (error) {
    return isMissingColumnError(error) ? "missing" : "unknown";
  }

  const inferred = inferTagsColumnType(asRecordArray(data));

  if (inferred !== "unknown" || !normalizedTag) {
    return inferred;
  }

  const containsProbe = await supabase
    .from("posts")
    .select("id")
    .contains("tags", [normalizedTag])
    .limit(1);

  if (!containsProbe.error) {
    return "text_array_or_json_array";
  }

  if (isMissingColumnError(containsProbe.error)) {
    return "missing";
  }

  const equalsProbe = await supabase
    .from("posts")
    .select("id")
    .eq("tags", normalizedTag)
    .limit(1);

  if (!equalsProbe.error) {
    return "string";
  }

  return "unknown";
}

function buildPostsQuery(supabase: SupabaseClient, includeTags: boolean) {
  return supabase
    .from("posts")
    .select(includeTags ? POST_LIST_SELECT_WITH_TAGS : POST_LIST_BASE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
}

function mapRowToPostSummary(row: Record<string, unknown>): PostSummary | null {
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
    thumbnailUrl: readString(row.thumbnail_url) ?? FALLBACK_THUMBNAIL_URL,
    likesCount: readNumber(row.likes_count),
    viewsCount: readNumber(row.views_count),
    commentsCount: readNumber(row.comments_count),
    createdAt: readString(row.created_at) ?? "",
    tags: uniqueSorted(parseTagsValue(row.tags)),
  };
}

export async function getPostFeedData({
  tag,
}: {
  tag?: string;
}): Promise<PostFeedResult> {
  const normalizedTag = normalizeTag(tag);

  try {
    const supabase = await createSupabaseServerClient();
    const tagsColumnType = await resolveTagsColumnType(supabase, normalizedTag);
    const includeTags = tagsColumnType !== "missing";
    const canFilterByTagInQuery =
      Boolean(normalizedTag) &&
      (tagsColumnType === "string" ||
        tagsColumnType === "text_array_or_json_array");

    let postsQuery = buildPostsQuery(supabase, includeTags);

    if (normalizedTag && canFilterByTagInQuery) {
      postsQuery =
        tagsColumnType === "string"
          ? postsQuery.eq("tags", normalizedTag)
          : postsQuery.contains("tags", [normalizedTag]);
    }

    const { data: rawPosts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error("[getPostFeedData] posts query failed", {
        message: postsError.message,
        code: postsError.code,
      });

      return {
        ok: false,
        message: "게시글을 불러오는 중 오류가 발생했습니다.",
      };
    }

    const parsedPosts = asRecordArray(rawPosts)
      .map(mapRowToPostSummary)
      .filter((post): post is PostSummary => post !== null);

    const posts =
      normalizedTag && !canFilterByTagInQuery
        ? parsedPosts.filter((post) => post.tags.includes(normalizedTag))
        : parsedPosts;

    if (!includeTags) {
      return {
        ok: true,
        data: {
          posts,
          tags: [],
        },
      };
    }

    const { data: rawTagRows, error: tagsError } = await supabase
      .from("posts")
      .select("tags")
      .eq("status", "published");

    if (tagsError) {
      console.error("[getPostFeedData] tags query failed", {
        message: tagsError.message,
        code: tagsError.code,
      });

      return {
        ok: true,
        data: {
          posts,
          tags: [],
        },
      };
    }

    const tags = uniqueSorted(
      asRecordArray(rawTagRows).flatMap((row) => parseTagsValue(row.tags)),
    );

    return {
      ok: true,
      data: {
        posts,
        tags,
      },
    };
  } catch (error) {
    console.error("[getPostFeedData] unexpected error", error);

    return {
      ok: false,
      message: "게시글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
