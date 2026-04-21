"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { ROUTES } from "@/constants/routes";
import { postLikeQueryKeys } from "@/features/posts/lib/post-like-query-keys";
import {
  usePostLikeStore,
  type PostLikeState,
} from "@/features/posts/stores/use-post-like-store";

interface UseTogglePostLikeParams {
  postId: string;
  initialLikesCount: number;
  initialIsLiked: boolean;
  viewerUserId: string | null;
}

interface PostLikeResponse {
  likesCount: number;
  isLiked: boolean;
}

class UnauthorizedPostLikeError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function requestTogglePostLike({
  postId,
  shouldLike,
}: {
  postId: string;
  shouldLike: boolean;
}): Promise<PostLikeResponse> {
  const response = await fetch(`/api/posts/${postId}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shouldLike }),
  });

  const payload = await response.json().catch(() => null);
  const message =
    isRecord(payload) && typeof payload.message === "string"
      ? payload.message
      : "좋아요를 처리하지 못했습니다.";

  if (response.status === 401) {
    throw new UnauthorizedPostLikeError(message);
  }

  if (!response.ok) {
    throw new Error(message);
  }

  return {
    likesCount: isRecord(payload) ? readNumber(payload.likesCount) : 0,
    isLiked: (isRecord(payload) && readBoolean(payload.isLiked)) ?? shouldLike,
  };
}

export function useTogglePostLike({
  postId,
  initialLikesCount,
  initialIsLiked,
  viewerUserId,
}: UseTogglePostLikeParams) {
  const router = useRouter();
  const requestLockRef = useRef(false);
  const initializePostLike = usePostLikeStore(
    (state) => state.initializePostLike,
  );
  const setPostLikeState = usePostLikeStore((state) => state.setPostLikeState);
  const snapshot = usePostLikeStore((state) => state.postLikes[postId]);

  useEffect(() => {
    const existing = usePostLikeStore.getState().postLikes[postId];

    if (!existing) {
      initializePostLike(postId, {
        likesCount: initialLikesCount,
        isLiked: initialIsLiked,
      });
    }
  }, [initialIsLiked, initialLikesCount, initializePostLike, postId]);

  const likesCount = snapshot?.likesCount ?? initialLikesCount;
  const isLiked = snapshot?.isLiked ?? initialIsLiked;
  const isPending = snapshot?.isPending ?? false;

  const mutation = useMutation({
    mutationKey: postLikeQueryKeys.toggle(postId),
    mutationFn: ({ shouldLike }: { shouldLike: boolean }) =>
      requestTogglePostLike({ postId, shouldLike }),
    onMutate: async ({ shouldLike }) => {
      requestLockRef.current = true;

      const previous = usePostLikeStore.getState().postLikes[postId] ?? {
        likesCount: initialLikesCount,
        isLiked: initialIsLiked,
        isPending: false,
      };

      const next: PostLikeState = {
        likesCount: Math.max(previous.likesCount + (shouldLike ? 1 : -1), 0),
        isLiked: shouldLike,
        isPending: true,
      };

      setPostLikeState(postId, next);

      return { previous };
    },
    onError: (error, _variables, context) => {
      const previous = context?.previous ?? {
        likesCount: initialLikesCount,
        isLiked: initialIsLiked,
        isPending: false,
      };

      setPostLikeState(postId, previous);
      requestLockRef.current = false;

      if (error instanceof UnauthorizedPostLikeError) {
        router.push(ROUTES.signIn);
        return;
      }

      console.error("[togglePostLike] mutation failed", error);
    },
    onSuccess: (data) => {
      setPostLikeState(postId, {
        likesCount: data.likesCount,
        isLiked: data.isLiked,
        isPending: false,
      });
    },
    onSettled: () => {
      requestLockRef.current = false;
      const current = usePostLikeStore.getState().postLikes[postId];

      if (current?.isPending) {
        setPostLikeState(postId, {
          likesCount: current.likesCount,
          isLiked: current.isLiked,
          isPending: false,
        });
      }
    },
  });

  const togglePostLike = () => {
    if (requestLockRef.current || isPending || mutation.isPending) {
      return;
    }

    if (!viewerUserId) {
      router.push(ROUTES.signIn);
      return;
    }

    mutation.mutate({ shouldLike: !isLiked });
  };

  return {
    likesCount,
    isLiked,
    isPending: isPending || mutation.isPending,
    togglePostLike,
  };
}
