import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

function readViewsCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export async function incrementPostViews({
  supabase,
  slug,
}: {
  supabase: SupabaseClient;
  slug: string;
}): Promise<number | null> {
  const { data, error } = await supabase.rpc("increment_post_views", {
    post_slug: slug,
  });

  if (error) {
    console.error("[incrementPostViews] rpc failed", {
      slug,
      message: error.message,
      code: error.code,
    });
    return null;
  }

  return readViewsCount(data);
}
