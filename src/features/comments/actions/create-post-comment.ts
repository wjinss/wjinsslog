"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CreatePostCommentState {
  status: "idle" | "success" | "error";
  message: string;
}

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createPostCommentAction(
  _prevState: CreatePostCommentState,
  formData: FormData,
): Promise<CreatePostCommentState> {
  const postId = readFormValue(formData, "postId").trim();
  const postSlug = readFormValue(formData, "postSlug").trim();
  const content = readFormValue(formData, "content").trim();

  if (!postId || !postSlug) {
    return {
      status: "error",
      message: "게시글 정보를 확인하지 못했습니다.",
    };
  }

  if (!content) {
    return {
      status: "error",
      message: "댓글을 입력해주세요.",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        status: "error",
        message: "로그인한 사용자만 댓글을 작성할 수 있습니다.",
      };
    }

    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .eq("slug", postSlug)
      .maybeSingle();

    if (postError || !postData) {
      return {
        status: "error",
        message: "댓글을 작성할 게시글을 찾지 못했습니다.",
      };
    }

    const { error: insertError } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      parent_id: null,
      depth: 0,
      content,
      likes_count: 0,
    });

    if (insertError) {
      console.error("[createPostCommentAction] insert failed", {
        postId,
        postSlug,
        userId: user.id,
        message: insertError.message,
        code: insertError.code,
      });

      return {
        status: "error",
        message: "댓글 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    revalidatePath(`/posts/${postSlug}`);

    return {
      status: "success",
      message: "댓글이 등록되었습니다.",
    };
  } catch (error) {
    console.error("[createPostCommentAction] unexpected error", {
      postId,
      postSlug,
      error,
    });

    return {
      status: "error",
      message: "댓글 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
