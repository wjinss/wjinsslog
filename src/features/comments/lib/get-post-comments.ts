import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const UNKNOWN_AUTHOR_NAME = "알 수 없는 사용자";

interface CommentAuthor {
  id: string | null;
  displayName: string;
  avatarUrl: string | null;
}

interface BasePostCommentItem {
  id: string;
  postId: string;
  userId: string | null;
  content: string;
  createdAt: string | null;
  author: CommentAuthor;
}

export interface PostCommentReplyItem extends BasePostCommentItem {
  parentId: string;
}

export interface PostCommentItem extends BasePostCommentItem {
  replies: PostCommentReplyItem[];
}

export interface GetPostCommentsResult {
  comments: PostCommentItem[];
  errorMessage: string | null;
}

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
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim().length > 0 ? value : null;
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

function createUnknownAuthor(userId: string | null): CommentAuthor {
  return {
    id: userId,
    displayName: UNKNOWN_AUTHOR_NAME,
    avatarUrl: null,
  };
}

function mapCommentRow(
  row: Record<string, unknown>,
  authorsByUserId: Map<string, CommentAuthor>,
): BasePostCommentItem | null {
  const id = readId(row.id);
  const persistedPostId = readId(row.post_id);

  if (!id || !persistedPostId) {
    return null;
  }

  const userId = readId(row.user_id);

  return {
    id,
    postId: persistedPostId,
    userId,
    content: readText(row.content) ?? "",
    createdAt: readString(row.created_at),
    author: userId
      ? authorsByUserId.get(userId) ?? createUnknownAuthor(userId)
      : createUnknownAuthor(null),
  };
}

export async function getPostComments(
  postId: string,
): Promise<GetPostCommentsResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .select("id, post_id, user_id, content, created_at")
      .eq("post_id", postId)
      .is("parent_id", null)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (commentError) {
      console.error("[getPostComments] comments query failed", {
        postId,
        message: commentError.message,
        code: commentError.code,
      });

      return {
        comments: [],
        errorMessage: "댓글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    const commentRows = asRecordArray(commentData);
    const commentIds = [
      ...new Set(
        commentRows
          .map((row) => readId(row.id))
          .filter((commentId): commentId is string => commentId !== null),
      ),
    ];
    let replyRows: Record<string, unknown>[] = [];

    if (commentIds.length > 0) {
      const { data: replyData, error: replyError } = await supabase
        .from("comments")
        .select("id, post_id, user_id, parent_id, content, created_at")
        .eq("post_id", postId)
        .in("parent_id", commentIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });

      if (replyError) {
        console.error("[getPostComments] replies query failed", {
          postId,
          parentCommentsCount: commentIds.length,
          message: replyError.message,
          code: replyError.code,
        });

        return {
          comments: [],
          errorMessage:
            "댓글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        };
      }

      replyRows = asRecordArray(replyData);
    }

    const userIds = [
      ...new Set(
        [...commentRows, ...replyRows]
          .map((row) => readId(row.user_id))
          .filter((userId): userId is string => userId !== null),
      ),
    ];

    const authorsByUserId = new Map<string, CommentAuthor>();

    if (userIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      if (profileError) {
        console.error("[getPostComments] profiles query failed", {
          postId,
          userIdsCount: userIds.length,
          message: profileError.message,
          code: profileError.code,
        });
      } else {
        for (const row of asRecordArray(profileData)) {
          const id = readId(row.id);

          if (!id) {
            continue;
          }

          authorsByUserId.set(id, {
            id,
            displayName: readString(row.display_name) ?? UNKNOWN_AUTHOR_NAME,
            avatarUrl: readString(row.avatar_url),
          });
        }
      }
    }

    const comments = commentRows
      .map((row): PostCommentItem | null => {
        const comment = mapCommentRow(row, authorsByUserId);

        if (!comment) {
          return null;
        }

        return {
          ...comment,
          replies: [],
        };
      })
      .filter((comment): comment is PostCommentItem => comment !== null);
    const commentsById = new Map(
      comments.map((comment) => [comment.id, comment]),
    );

    for (const row of replyRows) {
      const parentId = readId(row.parent_id);

      if (!parentId) {
        continue;
      }

      const parentComment = commentsById.get(parentId);

      if (!parentComment) {
        continue;
      }

      const reply = mapCommentRow(row, authorsByUserId);

      if (!reply) {
        continue;
      }

      parentComment.replies.push({
        ...reply,
        parentId,
      });
    }

    return {
      comments,
      errorMessage: null,
    };
  } catch (error) {
    console.error("[getPostComments] unexpected error", {
      postId,
      error,
    });

    return {
      comments: [],
      errorMessage: "댓글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
