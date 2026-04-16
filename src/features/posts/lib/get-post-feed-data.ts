import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PostSummary } from "@/types/post";

import {
  loadPostIdsByTagSlug,
  loadPostTagNamesByPostIds,
  loadPublishedTagNames,
} from "@/features/posts/lib/post-tag-relations";
import { sanitizePostSlug } from "@/features/posts/lib/slug";

const POST_LIST_BASE_SELECT =
  "id, slug, title, excerpt, thumbnail_url, likes_count, views_count, comments_count, created_at";
const FALLBACK_THUMBNAIL_URL = "/fallbackImage.webp";

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

function createTagSlugFromName(tagName: string): string {
  const sanitized = sanitizePostSlug(tagName);
  if (sanitized.length > 0) {
    return sanitized;
  }

  const codepointFallback = Array.from(tagName.trim())
    .map((character) => character.codePointAt(0)?.toString(16))
    .filter((value): value is string => Boolean(value))
    .join("-");

  return codepointFallback ? `tag-${codepointFallback}` : "tag";
}

function mapRowToPostSummary(
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
    thumbnailUrl: readString(row.thumbnail_url) ?? FALLBACK_THUMBNAIL_URL,
    likesCount: readNumber(row.likes_count),
    viewsCount: readNumber(row.views_count),
    commentsCount: readNumber(row.comments_count),
    createdAt: readString(row.created_at) ?? "",
    tags: tagNamesByPostId.get(id) ?? [],
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

    let filteredPostIds: string[] | null = null;

    if (normalizedTag) {
      const primaryTagMatch = await loadPostIdsByTagSlug({
        supabase,
        tagSlug: normalizedTag,
      });

      if (!primaryTagMatch.ok) {
        return {
          ok: false,
          message: primaryTagMatch.message,
        };
      }

      if (primaryTagMatch.postIds.length > 0) {
        filteredPostIds = primaryTagMatch.postIds;
      } else {
        const normalizedTagSlug = createTagSlugFromName(normalizedTag);

        if (normalizedTagSlug !== normalizedTag) {
          const fallbackTagMatch = await loadPostIdsByTagSlug({
            supabase,
            tagSlug: normalizedTagSlug,
          });

          if (!fallbackTagMatch.ok) {
            return {
              ok: false,
              message: fallbackTagMatch.message,
            };
          }

          filteredPostIds = fallbackTagMatch.postIds;
        } else {
          filteredPostIds = primaryTagMatch.postIds;
        }
      }
    }

    let postsQuery = supabase
      .from("posts")
      .select(POST_LIST_BASE_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (filteredPostIds) {
      if (filteredPostIds.length === 0) {
        const publishedTags = await loadPublishedTagNames({ supabase });
        if (!publishedTags.ok) {
          return {
            ok: false,
            message: publishedTags.message,
          };
        }

        return {
          ok: true,
          data: {
            posts: [],
            tags: publishedTags.uniqueTagNames,
          },
        };
      }

      postsQuery = postsQuery.in("id", filteredPostIds);
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

    const postRows = asRecordArray(rawPosts);
    const postIds = postRows
      .map((row) => readId(row.id))
      .filter((postId): postId is string => postId !== null);

    const postTagNames = await loadPostTagNamesByPostIds({
      supabase,
      postIds,
    });

    if (!postTagNames.ok) {
      return {
        ok: false,
        message: postTagNames.message,
      };
    }

    const publishedTags = await loadPublishedTagNames({ supabase });
    if (!publishedTags.ok) {
      return {
        ok: false,
        message: publishedTags.message,
      };
    }

    const posts = postRows
      .map((row) => mapRowToPostSummary(row, postTagNames.tagNamesByPostId))
      .filter((post): post is PostSummary => post !== null);

    return {
      ok: true,
      data: {
        posts,
        tags: publishedTags.uniqueTagNames,
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
