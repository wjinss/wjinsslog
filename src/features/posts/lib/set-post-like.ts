import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

interface SetPostLikeParams {
  supabase: SupabaseClient;
  postId: string;
  userId: string;
  shouldLike: boolean;
}

interface SetPostLikeData {
  likesCount: number;
  isLiked: boolean;
}

interface SetPostLikeDebugInfo {
  postId: string;
  userId: string;
  shouldLike: boolean;
  rpcData: unknown;
  rpcError: {
    message: string;
    code: string | null;
    details: string | null;
    hint: string | null;
  } | null;
}

export type SetPostLikeResult =
  | { ok: true; data: SetPostLikeData; debug: SetPostLikeDebugInfo }
  | {
      ok: false;
      status: number;
      message: string;
      debug: SetPostLikeDebugInfo;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function setPostLike({
  supabase,
  postId,
  userId,
  shouldLike,
}: SetPostLikeParams): Promise<SetPostLikeResult> {
  const { data, error } = await supabase.rpc("set_post_like", {
    p_post_id: postId,
    p_should_like: shouldLike,
    p_user_id: userId,
  });

  const debug: SetPostLikeDebugInfo = {
    postId,
    userId,
    shouldLike,
    rpcData: data,
    rpcError: error
      ? {
          message: error.message,
          code: error.code ?? null,
          details: error.details ?? null,
          hint: error.hint ?? null,
        }
      : null,
  };

  if (error) {
    console.error(`[togglePostLike] ${shouldLike ? "insert" : "delete"} failed`, {
      message: error.message,
      code: error.code,
      details: error.details,
      postId,
      userId,
    });

    return {
      ok: false,
      status: 500,
      message: "좋아요를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      debug,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!isRecord(row)) {
    console.error("[togglePostLike] invalid rpc payload", {
      data,
      postId,
      userId,
      shouldLike,
    });

    return {
      ok: false,
      status: 500,
      message: "좋아요 상태를 확인하지 못했습니다.",
      debug,
    };
  }

  return {
    ok: true,
    data: {
      likesCount: readNumber(row.likes_count),
      isLiked: readBoolean(row.is_liked) ?? shouldLike,
    },
    debug,
  };
}
