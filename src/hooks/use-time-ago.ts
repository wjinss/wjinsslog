"use client";

import { formatTimeAgo } from "@/utils/date";

export function useTimeAgo(input: string | number | Date): string {
  return formatTimeAgo(input);
}
