import { PageContainer } from "@/components/layout/page-container";
import { PostFeed } from "@/features/posts/components/post-feed";
import { mockPosts } from "@/features/posts/data/mock-posts";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = mockPosts.filter((post) => post.tags.includes(decodedTag));

  return (
    <PageContainer>
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">#{decodedTag}</h1>
        <p className="text-sm text-muted-foreground">태그별 포스트</p>
        <PostFeed posts={posts} />
      </section>
    </PageContainer>
  );
}
