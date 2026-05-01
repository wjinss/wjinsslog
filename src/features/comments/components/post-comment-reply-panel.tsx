"use client";

import Link from "next/link";
import { useState } from "react";

import { ROUTES } from "@/constants/routes";
import { PostCommentBody } from "@/features/comments/components/post-comment-body";
import { PostCommentReplyForm } from "@/features/comments/components/post-comment-reply-form";
import type { PostCommentReplyItem } from "@/features/comments/lib/get-post-comments";

interface PostCommentReplyPanelProps {
  postId: string;
  postSlug: string;
  parentCommentId: string;
  replies: PostCommentReplyItem[];
  isAuthenticated: boolean;
}

export function PostCommentReplyPanel({
  postId,
  postSlug,
  parentCommentId,
  replies,
  isAuthenticated,
}: PostCommentReplyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const repliesCount = replies.length;
  const buttonLabel =
    repliesCount > 0 ? `${repliesCount}개의 답글` : "답글 달기";

  return (
    <>
      <button
        type="button"
        className="text-xs mt-4 font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {buttonLabel}
      </button>
      <div className=" bg-gray-100 rounded-xl">
        {isOpen ? (
          <div className="mt-3 space-y-3 py-4 px-6">
            {repliesCount > 0 ? (
              <ol className="space-y-3">
                {replies.map((reply) => (
                  <li key={reply.id}>
                    <PostCommentBody comment={reply} avatarSize={28} />
                  </li>
                ))}
              </ol>
            ) : null}

            {isAuthenticated ? (
              <PostCommentReplyForm
                postId={postId}
                postSlug={postSlug}
                parentCommentId={parentCommentId}
                onCancel={() => setIsOpen(false)}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                답글을 작성하려면{" "}
                <Link
                  href={ROUTES.signIn}
                  className="font-medium text-foreground underline"
                >
                  로그인
                </Link>
                해주세요.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
