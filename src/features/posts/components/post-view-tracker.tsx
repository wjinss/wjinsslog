"use client";

import { useEffect, useRef } from "react";

import {
  canIncreasePostView,
  markPostAsViewed,
} from "@/features/posts/lib/post-view-dedup";

interface PostViewTrackerProps {
  postId: string;
}

export function PostViewTracker({ postId }: PostViewTrackerProps) {
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (hasRequestedRef.current || !canIncreasePostView(postId)) {
      return;
    }

    hasRequestedRef.current = true;

    const incrementPostView = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/view`, {
          method: "POST",
        });

        if (response.ok) {
          markPostAsViewed(postId);
        }
      } catch (error) {
        console.error("[PostViewTracker] increment request failed", {
          postId,
          error,
        });
      }
    };

    void incrementPostView();
  }, [postId]);

  return null;
}
