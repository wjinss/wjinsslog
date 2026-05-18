import { NextResponse } from "next/server";

import { incrementPostViews } from "@/features/posts/lib/increment-post-views";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface IncrementPostViewRouteContext {
  params: Promise<{ postId: string }>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(
  _request: Request,
  { params }: IncrementPostViewRouteContext,
) {
  const { postId } = await params;

  if (!postId) {
    return NextResponse.json(
      {
        message: "잘못된 요청입니다.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("posts")
      .select("slug")
      .eq("id", postId)
      .maybeSingle();

    if (error) {
      console.error("[incrementPostView] post lookup failed", {
        postId,
        message: error.message,
        code: error.code,
      });

      return NextResponse.json(
        {
          message: "조회수를 증가시키지 못했습니다.",
        },
        {
          status: 500,
        },
      );
    }

    const slug = readString(data?.slug);

    if (!slug) {
      return NextResponse.json(
        {
          message: "포스트를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const viewsCount = await incrementPostViews({
      supabase,
      slug,
    });

    if (viewsCount === null) {
      return NextResponse.json(
        {
          message: "조회수를 증가시키지 못했습니다.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      viewsCount,
    });
  } catch (error) {
    console.error("[incrementPostView] unexpected error", {
      postId,
      error,
    });

    return NextResponse.json(
      {
        message: "조회수를 증가시키지 못했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
