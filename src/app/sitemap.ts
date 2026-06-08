import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

import { SITE_CONFIG } from "@/constants/site";

interface SitemapPostRow {
  slug: string | null;
  updated_at: string | null;
  published_at: string | null;
  created_at: string | null;
}

const SITE_URL = SITE_CONFIG.url.replace(/\/$/, "");

export const revalidate = 3600;

function createSiteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

function createLastModified(post: SitemapPostRow): Date | undefined {
  const lastModified =
    post.updated_at ?? post.published_at ?? post.created_at ?? null;

  if (!lastModified) {
    return undefined;
  }

  const date = new Date(lastModified);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function getPublishedPostRows(): Promise<SitemapPostRow[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[sitemap] Supabase env is missing.");
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from("posts")
    .select("slug, updated_at, published_at, created_at")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[sitemap] published posts query failed", {
      message: error.message,
      code: error.code,
    });

    return [];
  }

  return Array.isArray(data) ? data : [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPostRows();

  return [
    {
      url: createSiteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...posts
      .filter((post) => typeof post.slug === "string" && post.slug.length > 0)
      .map((post) => ({
        url: createSiteUrl(`/posts/${post.slug}`),
        lastModified: createLastModified(post),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}
