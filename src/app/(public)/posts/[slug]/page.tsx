import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatTimeAgo } from "@/utils/date";

interface PersistedPost {
  slug: string;
  title: string;
  contentMd: string;
  createdAt: string | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
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

async function getPostFromDatabase(slug: string): Promise<PersistedPost | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("posts")
      .select(
        "slug, title, content_md, created_at, views_count, likes_count, comments_count",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data || typeof data !== "object") {
      return null;
    }

    const row = data as Record<string, unknown>;
    const persistedSlug = readString(row.slug);
    const title = readString(row.title);
    const contentMd = readString(row.content_md);

    if (!persistedSlug || !title || !contentMd) {
      return null;
    }

    return {
      slug: persistedSlug,
      title,
      contentMd,
      createdAt: readString(row.created_at),
      viewsCount: readNumber(row.views_count),
      likesCount: readNumber(row.likes_count),
      commentsCount: readNumber(row.comments_count),
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
