import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { mockPosts } from "@/features/posts/data/mock-posts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatTimeAgo } from "@/utils/date";

interface PersistedPost {
  slug: string;
  title: string;
  bodyMarkdown: string;
  tags: string[];
  createdAt: string | null;
}

interface PostDetailPageProps {
  params: Promise<{ slug: string }>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((tag): tag is string => typeof tag === "string");
}

async function getPostFromDatabase(slug: string): Promise<PersistedPost | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("posts")
      .select("slug, title, body_markdown, tags, created_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data || typeof data !== "object") {
      return null;
    }

    const row = data as Record<string, unknown>;
    const persistedSlug = readString(row.slug);
    const title = readString(row.title);
    const bodyMarkdown = readString(row.body_markdown);

    if (!persistedSlug || !title || !bodyMarkdown) {
      return null;
    }

    return {
      slug: persistedSlug,
      title,
      bodyMarkdown,
      tags: normalizeTags(row.tags),
      createdAt: readString(row.created_at),
    };
  } catch {
    return null;
  }
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug } = await params;
  const persistedPost = await getPostFromDatabase(slug);

  if (persistedPost) {
    return (
      <PageContainer>
        <article className="mx-auto max-w-3xl space-y-6">
          <header className="space-y-3 border-b pb-5">
            <h1 className="text-3xl font-bold">{persistedPost.title}</h1>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>
                {persistedPost.createdAt
                  ? formatTimeAgo(persistedPost.createdAt)
                  : "-"}
              </span>
            </div>
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
          </header>

          <section className="markdown-body rounded-xl border p-6">
            <div className="whitespace-pre-wrap leading-7">
              {persistedPost.bodyMarkdown}
            </div>
          </section>
        </article>
      </PageContainer>
    );
  }

  const post = mockPosts.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <PageContainer>
      <article className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-3 border-b pb-5">
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{formatTimeAgo(post.createdAt)}</span>
            <span>조회수 {post.viewsCount}</span>
            <span>좋아요 {post.likesCount}</span>
            <span>댓글 {post.commentsCount}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        </header>

        <section className="markdown-body rounded-xl border p-6">
          {post.excerpt}
        </section>
      </article>
    </PageContainer>
  );
}
