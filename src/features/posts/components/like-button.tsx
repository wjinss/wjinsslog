"use client";

import { Heart } from "lucide-react";
import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { useTogglePostLike } from "@/features/posts/hooks/use-toggle-post-like";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  initialLikesCount: number;
  initialIsLiked: boolean;
  viewerUserId: string | null;
}

export function LikeButton({
  postId,
  initialLikesCount,
  initialIsLiked,
  viewerUserId,
}: LikeButtonProps) {
  const { likesCount, isLiked, isPending, togglePostLike } =
    useTogglePostLike({
      postId,
      initialLikesCount,
      initialIsLiked,
      viewerUserId,
    });

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    togglePostLike();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-busy={isPending}
      aria-label={
        isLiked
          ? `좋아요 취소, 현재 ${likesCount}개`
          : `좋아요, 현재 ${likesCount}개`
      }
      aria-pressed={isLiked}
      className={cn(
        "h-auto rounded-full px-0 text-sm font-normal hover:bg-transparent focus-visible:ring-2 focus-visible:ring-ring/40",
        isLiked
          ? "text-rose-600 hover:text-rose-600"
          : "text-muted-foreground hover:text-foreground",
        isPending && "cursor-wait opacity-70",
      )}
      disabled={isPending}
      onClick={handleClick}
    >
      <Heart
        className={cn(
          "size-4 transition-transform duration-150",
          isLiked ? "fill-current" : "fill-none",
        )}
      />
      <span>{likesCount}</span>
      <span className="sr-only">
        {isPending
          ? "좋아요 처리 중"
          : isLiked
            ? "좋아요를 누른 상태"
            : "좋아요를 누르지 않은 상태"}
      </span>
    </Button>
  );
}
