"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  createPostCommentReplyAction,
  type CreatePostCommentReplyState,
} from "@/features/comments/actions/create-post-comment-reply";

interface PostCommentReplyFormProps {
  postId: string;
  postSlug: string;
  parentCommentId: string;
  onCancel: () => void;
}

const INITIAL_CREATE_POST_COMMENT_REPLY_STATE: CreatePostCommentReplyState = {
  status: "idle",
  message: "",
};

function ReplySubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="h-9 px-4">
      {pending ? "작성 중..." : "답글 작성"}
    </Button>
  );
}

export function PostCommentReplyForm({
  postId,
  postSlug,
  parentCommentId,
  onCancel,
}: PostCommentReplyFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createPostCommentReplyAction,
    INITIAL_CREATE_POST_COMMENT_REPLY_STATE,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="postSlug" value={postSlug} />
      <input type="hidden" name="parentCommentId" value={parentCommentId} />

      <label htmlFor={`reply-content-${parentCommentId}`} className="sr-only">
        답글 작성
      </label>
      <textarea
        id={`reply-content-${parentCommentId}`}
        name="content"
        rows={3}
        placeholder="답글을 입력해주세요."
        className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-0 transition focus:border-primary"
      />
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {state.message}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 px-4"
          onClick={() => {
            formRef.current?.reset();
            onCancel();
          }}
        >
          취소
        </Button>
        <ReplySubmitButton />
      </div>
    </form>
  );
}
