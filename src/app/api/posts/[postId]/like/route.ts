import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { setPostLike } from "@/features/posts/lib/set-post-like";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface TogglePostLikeRouteContext {
  params: Promise<{ postId: string }>;
}

function readShouldLike(payload: unknown): boolean | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = (payload as Record<string, unknown>).shouldLike;
  return typeof value === "boolean" ? value : null;
}

async function readLikeDiagnostics({
  supabase,
  postId,
  userId,
}: {
  supabase: SupabaseClient;
  postId: string;
  userId: string;
}) {
  const [{ data: postData, error: postError }, { data: likeData, error: likeError }] =
    await Promise.all([
      supabase
        .from("posts")
        .select("likes_count")
        .eq("id", postId)
        .maybeSingle(),
      supabase
        .from("post_likes")
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  return {
    post: {
      likesCount:
        postData &&
        typeof postData.likes_count === "number" &&
        Number.isFinite(postData.likes_count)
          ? postData.likes_count
          : null,
      error: postError
        ? {
            message: postError.message,
            code: postError.code ?? null,
            details: postError.details ?? null,
          }
        : null,
    },
    postLike: {
      exists: Boolean(likeData),
      error: likeError
        ? {
            message: likeError.message,
            code: likeError.code ?? null,
            details: likeError.details ?? null,
          }
        : null,
    },
  };
}

export async function POST(
  request: Request,
  { params }: TogglePostLikeRouteContext,
) {
  const { postId } = await params;

  try {
    const payload = await request.json().catch(() => null);
    const shouldLike = readShouldLike(payload);

    if (!postId || shouldLike === null) {
      return NextResponse.json(
        {
          message: "잘못된 요청입니다.",
        },
        {
          status: 400,
        },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } =
      await supabase.auth.getUser();
    const user = authData.user;

    if (authError || !user) {
      console.error("[togglePostLike] user not found", {
        message: authError?.message ?? null,
        postId,
      });

      return NextResponse.json(
        {
          code: "UNAUTHORIZED",
          message: "로그인이 필요합니다.",
        },
        {
          status: 401,
        },
      );
    }

    console.info("[togglePostLike] request", {
      postId,
      shouldLike,
      userId: user.id,
    });

    const before = await readLikeDiagnostics({
      supabase,
      postId,
      userId: user.id,
    });

    console.info("[togglePostLike] before rpc", {
      postId,
      shouldLike,
      userId: user.id,
      ...before,
    });

    const result = await setPostLike({
      supabase,
      postId,
      shouldLike,
      userId: user.id,
    });

    console.info("[togglePostLike] rpc result", result.debug);

    const after = await readLikeDiagnostics({
      supabase,
      postId,
      userId: user.id,
    });

    console.info("[togglePostLike] after rpc", {
      postId,
      shouldLike,
      userId: user.id,
      ...after,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          message: result.message,
        },
        {
          status: result.status,
        },
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[togglePostLike] unexpected error", error);

    return NextResponse.json(
      {
        message: "좋아요를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
      {
        status: 500,
      },
    );
  }
}
