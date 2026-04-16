import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

interface GenerateUniquePostSlugParams {
  supabase: SupabaseClient;
  title: string;
  requestedSlug?: string;
}

function buildFallbackSlug(): string {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `post-${timestamp}`;
}

export function sanitizePostSlug(input: string): string {
  const normalized = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized.replace(/^-+|-+$/g, "");
}

export async function generateUniquePostSlug({
  supabase,
  title,
  requestedSlug,
}: GenerateUniquePostSlugParams): Promise<string> {
  const preferredSlug = sanitizePostSlug(requestedSlug ?? "");
  const baseSlug = preferredSlug || sanitizePostSlug(title) || buildFallbackSlug();

  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .like("slug", `${baseSlug}%`)
    .limit(200);

  if (error || !data || data.length === 0) {
    return baseSlug;
  }

  const existingSlugs = new Set<string>();

  for (const row of data) {
    const candidate =
      row && typeof row === "object"
        ? (row as Record<string, unknown>).slug
        : null;

    if (typeof candidate === "string" && candidate.length > 0) {
      existingSlugs.add(candidate);
    }
  }

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}
