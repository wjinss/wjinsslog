import { NextResponse } from "next/server";

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

    const result = await setPostLike({
      supabase,
      postId,
      shouldLike,
      userId: user.id,
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
