import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { mockPosts } from "@/features/posts/data/mock-posts";
import { formatTimeAgo } from "@/utils/date";

interface PostDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug } = await params;
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
