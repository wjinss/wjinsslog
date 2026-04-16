"use client";

import { create } from "zustand";
import { combine } from "zustand/middleware";

interface AddTagOptions {
  caseSensitiveDuplicate?: boolean;
  maxTags?: number;
}

function normalizeForCompare(
  value: string,
  caseSensitiveDuplicate: boolean,
): string {
  return caseSensitiveDuplicate ? value : value.toLowerCase();
}

const initialState = {
  tags: [] as string[],
};

export const useTagInputStore = create(
  combine(initialState, (set, get) => ({
    addTag: (rawValue: string, options?: AddTagOptions) => {
      const trimmed = rawValue.trim();
      if (!trimmed) {
        return;
      }

      const caseSensitiveDuplicate = options?.caseSensitiveDuplicate ?? false;
      const maxTags = options?.maxTags;
      const currentTags = get().tags;

      if (typeof maxTags === "number" && currentTags.length >= maxTags) {
        return;
      }

      const candidate = normalizeForCompare(trimmed, caseSensitiveDuplicate);
      const exists = currentTags.some(
        (tag) => normalizeForCompare(tag, caseSensitiveDuplicate) === candidate,
      );

      if (exists) {
        return;
      }

      set({ tags: [...currentTags, trimmed] });
    },
    removeTag: (tagToRemove: string) => {
      set((state) => ({
        tags: state.tags.filter((tag) => tag !== tagToRemove),
      }));
    },
  })),
);
