import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { loadPostTagNamesByPostIds } from "@/features/posts/lib/post-tag-relations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatTimeAgo } from "@/utils/date";

interface PersistedPost {
  id: string;
  slug: string;
  title: string;
  contentMd: string;
  createdAt: string | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  tagsLoadError: string | null;
}

interface PostDetailPageProps {
  params: Promise<{ slug: string }>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readId(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

async function getPostFromDatabase(slug: string): Promise<PersistedPost | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, slug, title, content_md, created_at, views_count, likes_count, comments_count",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data || typeof data !== "object") {
      return null;
    }

    const row = data as Record<string, unknown>;
    const id = readId(row.id);
    const persistedSlug = readString(row.slug);
    const title = readString(row.title);
    const contentMd = readString(row.content_md);

    if (!id || !persistedSlug || !title || !contentMd) {
      return null;
    }

    const loadedTags = await loadPostTagNamesByPostIds({
      supabase,
      postIds: [id],
    });

    const tags = loadedTags.ok ? loadedTags.tagNamesByPostId.get(id) ?? [] : [];
    const tagsLoadError = loadedTags.ok ? null : loadedTags.message;

    return {
      id,
      slug: persistedSlug,
      title,
      contentMd,
      createdAt: readString(row.created_at),
      viewsCount: readNumber(row.views_count),
      likesCount: readNumber(row.likes_count),
      commentsCount: readNumber(row.comments_count),
      tags,
      tagsLoadError,
    };
  } catch {
    return null;
  }
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug } = await params;
  const persistedPost = await getPostFromDatabase(slug);

  if (!persistedPost) {
    notFound();
  }

  return (
    <PageContainer>
      <article className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-3 border-b pb-5">
          <h1 className="text-3xl font-bold">{persistedPost.title}</h1>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>
              {persistedPost.createdAt ? formatTimeAgo(persistedPost.createdAt) : "-"}
            </span>
            <span>조회수 {persistedPost.viewsCount}</span>
            <span>좋아요 {persistedPost.likesCount}</span>
            <span>댓글 {persistedPost.commentsCount}</span>
          </div>
          {persistedPost.tagsLoadError ? (
            <p className="text-sm text-destructive">{persistedPost.tagsLoadError}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {persistedPost.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <section className="markdown-body rounded-xl border p-6">
          <div className="whitespace-pre-wrap leading-7">
            {persistedPost.contentMd}
          </div>
        </section>
      </article>
    </PageContainer>
  );
}
