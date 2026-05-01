"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { createPostCommentAction } from "@/features/comments/actions/create-post-comment";
import { PostCommentBody } from "@/features/comments/components/post-comment-body";
import { PostCommentReplyPanel } from "@/features/comments/components/post-comment-reply-panel";
import type { PostCommentItem } from "@/features/comments/lib/get-post-comments";

interface PostCommentsSectionProps {
  postId: string;
  postSlug: string;
  isAuthenticated: boolean;
  comments: PostCommentItem[];
  count: number;
  errorMessage?: string | null;
}

interface PostCommentsSectionState {
  status: "idle" | "success" | "error";
  message: string;
}

const INITIAL_CREATE_POST_COMMENT_STATE: PostCommentsSectionState = {
  status: "idle",
  message: "",
};

export function PostCommentsSection({
  postId,
  postSlug,
  isAuthenticated,
  comments,
  count,
  errorMessage = null,
}: PostCommentsSectionProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createPostCommentAction,
    INITIAL_CREATE_POST_COMMENT_STATE,
  );

  const { pending } = useFormStatus();

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <section id="comments" className="rounded-xl border p-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold">{count}개의 댓글 </h2>
      </div>

      <div className="mt-4 border-b pb-6">
        <h3 className="sr-only">댓글 작성</h3>
        {isAuthenticated ? (
          <form ref={formRef} action={formAction} className="mt-4 space-y-4">
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="postSlug" value={postSlug} />

            <div className="space-y-1.5">
              <label htmlFor="content" className="text-sm font-medium">
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  placeholder="댓글을 입력해주세요."
                  className="min-h-28 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-0 transition focus:border-primary"
                />
              </label>
            </div>
            <Button type="submit" disabled={pending} className="w-full h-10">
              {pending ? "작성 중..." : "댓글 작성"}
            </Button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            댓글은 로그인한 사용자만 작성할 수 있습니다.{" "}
            <Link
              href={ROUTES.signIn}
              className="font-medium text-foreground underline"
            >
              로그인하러 가기
            </Link>
          </p>
        )}
      </div>

      {errorMessage ? (
        <p className="mt-4 text-sm text-destructive">{errorMessage}</p>
      ) : comments.length === 0 ? (
        <p className="mt-4 rounded-lg bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
          등록된 댓글이 없습니다.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-xl border bg-card/60 p-3">
              <PostCommentBody comment={comment} />
              <PostCommentReplyPanel
                postId={postId}
                postSlug={postSlug}
                parentCommentId={comment.id}
                replies={comment.replies}
                isAuthenticated={isAuthenticated}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
