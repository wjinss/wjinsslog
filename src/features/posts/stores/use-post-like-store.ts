"use client";

import { create } from "zustand";
import { combine } from "zustand/middleware";

export interface PostLikeState {
  likesCount: number;
  isLiked: boolean;
  isPending: boolean;
}

interface PostLikeStateInput {
  likesCount: number;
  isLiked: boolean;
  isPending?: boolean;
}

const initialState = {
  postLikes: {} as Record<string, PostLikeState>,
};

export const usePostLikeStore = create(
  combine(initialState, (set) => ({
    initializePostLike: (postId: string, snapshot: PostLikeStateInput) => {
      set((state) => {
        const current = state.postLikes[postId];

        if (current?.isPending) {
          return state;
        }

        if (
          current &&
          current.likesCount === snapshot.likesCount &&
          current.isLiked === snapshot.isLiked
        ) {
          return state;
        }

        return {
          postLikes: {
            ...state.postLikes,
            [postId]: {
              likesCount: snapshot.likesCount,
              isLiked: snapshot.isLiked,
              isPending: current?.isPending ?? snapshot.isPending ?? false,
            },
          },
        };
      });
    },
    setPostLikeState: (postId: string, snapshot: PostLikeStateInput) => {
      set((state) => ({
        postLikes: {
          ...state.postLikes,
          [postId]: {
            likesCount: snapshot.likesCount,
            isLiked: snapshot.isLiked,
            isPending:
              snapshot.isPending ??
              state.postLikes[postId]?.isPending ??
              false,
          },
        },
      }));
    },
  })),
);
