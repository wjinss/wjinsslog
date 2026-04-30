"use client";

import { UserAvatar } from "@/components/ui/user-avatar";
import type {
  PostCommentItem,
  PostCommentReplyItem,
} from "@/features/comments/lib/get-post-comments";
import { formatTimeAgo } from "@/utils/date";

interface PostCommentBodyProps {
  comment: PostCommentItem | PostCommentReplyItem;
  avatarSize?: number;
}

export function PostCommentBody({
  comment,
  avatarSize = 35,
}: PostCommentBodyProps) {
  return (
    <div className="flex items-start gap-2">
      <UserAvatar
        src={comment.author.avatarUrl}
        alt={`${comment.author.displayName} 아바타`}
        size={avatarSize}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="text-sm font-semibold">
            {comment.author.displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            {comment.createdAt ? formatTimeAgo(comment.createdAt) : "-"}
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-foreground">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
