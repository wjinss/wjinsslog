import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

interface PostTagNamesSuccess {
  ok: true;
  tagNamesByPostId: Map<string, string[]>;
  uniqueTagNames: string[];
}

interface QueryFailure {
  ok: false;
  message: string;
}

interface PostIdsByTagSuccess {
  ok: true;
  postIds: string[];
}

export type PostTagNamesResult = PostTagNamesSuccess | QueryFailure;
export type PostIdsByTagResult = PostIdsByTagSuccess | QueryFailure;

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

function readDatabaseId(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ko"));
}

function readTagName(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return readString(value.name);
}

export async function loadPostIdsByTagSlug({
  supabase,
  tagSlug,
}: {
  supabase: SupabaseClient;
  tagSlug: string;
}): Promise<PostIdsByTagResult> {
  const { data, error } = await supabase
    .from("post_tags")
    .select("post_id, tags!inner(slug), posts!inner(status)")
    .eq("tags.slug", tagSlug)
    .eq("posts.status", "published");

  if (error) {
    console.error("[loadPostIdsByTagSlug] query failed", {
      tagSlug,
      message: error.message,
      code: error.code,
    });

    return {
      ok: false,
      message: "태그 기준 게시글을 불러오지 못했습니다.",
    };
  }

  const postIds = uniqueSorted(
    asRecordArray(data)
      .map((row) => readDatabaseId(row.post_id))
      .filter((postId): postId is string => postId !== null),
  );

  return {
    ok: true,
    postIds,
  };
}

export async function loadPostTagNamesByPostIds({
  supabase,
  postIds,
}: {
  supabase: SupabaseClient;
  postIds: string[];
}): Promise<PostTagNamesResult> {
  if (postIds.length === 0) {
    return {
      ok: true,
      tagNamesByPostId: new Map<string, string[]>(),
      uniqueTagNames: [],
    };
  }

  const { data, error } = await supabase
    .from("post_tags")
    .select("post_id, tags:tags(id, name, slug)")
    .in("post_id", postIds);

  if (error) {
    console.error("[loadPostTagNamesByPostIds] query failed", {
      postIdsCount: postIds.length,
      message: error.message,
      code: error.code,
    });

    return {
      ok: false,
      message: "게시글 태그 정보를 불러오지 못했습니다.",
    };
  }

  const mutableMap = new Map<string, Set<string>>();
  const allTagNames: string[] = [];

  for (const row of asRecordArray(data)) {
    const postId = readDatabaseId(row.post_id);
    const tagName = readTagName(row.tags);

    if (!postId || !tagName) {
      continue;
    }

    allTagNames.push(tagName);

    const currentSet = mutableMap.get(postId) ?? new Set<string>();
    currentSet.add(tagName);
    mutableMap.set(postId, currentSet);
  }

  const tagNamesByPostId = new Map<string, string[]>();

  for (const [postId, tagSet] of mutableMap.entries()) {
    tagNamesByPostId.set(postId, uniqueSorted([...tagSet]));
  }

  return {
    ok: true,
    tagNamesByPostId,
    uniqueTagNames: uniqueSorted(allTagNames),
  };
}

export async function loadPublishedTagNames({
  supabase,
}: {
  supabase: SupabaseClient;
}): Promise<PostTagNamesResult> {
  const { data, error } = await supabase
    .from("post_tags")
    .select("post_id, tags:tags(id, name, slug), posts!inner(status)")
    .eq("posts.status", "published");

  if (error) {
    console.error("[loadPublishedTagNames] query failed", {
      message: error.message,
      code: error.code,
    });

    return {
      ok: false,
      message: "전체 태그 목록을 불러오지 못했습니다.",
    };
  }

  const mutableMap = new Map<string, Set<string>>();
  const allTagNames: string[] = [];

  for (const row of asRecordArray(data)) {
    const postId = readDatabaseId(row.post_id);
    const tagName = readTagName(row.tags);

    if (!postId || !tagName) {
      continue;
    }

    allTagNames.push(tagName);
    const currentSet = mutableMap.get(postId) ?? new Set<string>();
    currentSet.add(tagName);
    mutableMap.set(postId, currentSet);
  }

  const tagNamesByPostId = new Map<string, string[]>();

  for (const [postId, tagSet] of mutableMap.entries()) {
    tagNamesByPostId.set(postId, uniqueSorted([...tagSet]));
  }

  return {
    ok: true,
    tagNamesByPostId,
    uniqueTagNames: uniqueSorted(allTagNames),
  };
}
