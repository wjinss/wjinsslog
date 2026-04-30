"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CreatePostCommentReplyState {
  status: "idle" | "success" | "error";
  message: string;
}

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createPostCommentReplyAction(
  _prevState: CreatePostCommentReplyState,
  formData: FormData,
): Promise<CreatePostCommentReplyState> {
  const postId = readFormValue(formData, "postId").trim();
  const postSlug = readFormValue(formData, "postSlug").trim();
  const parentCommentId = readFormValue(formData, "parentCommentId").trim();
  const content = readFormValue(formData, "content").trim();

  if (!postId || !postSlug || !parentCommentId) {
    return {
      status: "error",
      message: "답글을 작성할 댓글 정보를 확인하지 못했습니다.",
    };
  }

  if (!content) {
    return {
      status: "error",
      message: "답글을 입력해주세요.",
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
        message: "로그인한 사용자만 답글을 작성할 수 있습니다.",
      };
    }

    const { data: parentComment, error: parentCommentError } = await supabase
      .from("comments")
      .select("id, post_id, parent_id, depth")
      .eq("id", parentCommentId)
      .eq("post_id", postId)
      .is("deleted_at", null)
      .maybeSingle();

    if (parentCommentError) {
      console.error("[createPostCommentReplyAction] parent query failed", {
        postId,
        parentCommentId,
        userId: user.id,
        message: parentCommentError.message,
        code: parentCommentError.code,
      });

      return {
        status: "error",
        message: "부모 댓글을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    if (!parentComment) {
      return {
        status: "error",
        message: "답글을 작성할 댓글을 찾지 못했습니다.",
      };
    }

    if (
      typeof parentComment.parent_id === "string" &&
      parentComment.parent_id.trim().length > 0
    ) {
      return {
        status: "error",
        message: "대댓글에는 다시 답글을 작성할 수 없습니다.",
      };
    }

    const { error: insertError } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      parent_id: parentCommentId,
      depth: 1,
      content,
      likes_count: 0,
    });

    if (insertError) {
      console.error("[createPostCommentReplyAction] insert failed", {
        postId,
        parentCommentId,
        userId: user.id,
        message: insertError.message,
        code: insertError.code,
      });

      return {
        status: "error",
        message: "답글 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    revalidatePath(`/posts/${postSlug}`);

    return {
      status: "success",
      message: "답글이 등록되었습니다.",
    };
  } catch (error) {
    console.error("[createPostCommentReplyAction] unexpected error", {
      postId,
      parentCommentId,
      error,
    });

    return {
      status: "error",
      message: "답글 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
