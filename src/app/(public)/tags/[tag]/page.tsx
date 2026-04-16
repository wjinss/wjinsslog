import { PageContainer } from "@/components/layout/page-container";
import { PostFeed } from "@/features/posts/components/post-feed";
import { getPostFeedData } from "@/features/posts/lib/get-post-feed-data";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const postFeedResult = await getPostFeedData({ tag: decodedTag });

  if (!postFeedResult.ok) {
    return (
      <PageContainer>
        <section className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <h1 className="text-lg font-semibold">게시글을 불러오지 못했습니다.</h1>
          <p className="text-sm text-muted-foreground">{postFeedResult.message}</p>
        </section>
      </PageContainer>
    );
  }

  const { posts } = postFeedResult.data;

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
