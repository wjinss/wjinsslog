import { PageContainer } from "@/components/layout/page-container";
import { PostFeed } from "@/features/posts/components/post-feed";
import { TagFilterBar } from "@/features/posts/components/tag-filter-bar";
import { getPostFeedData } from "@/features/posts/lib/get-post-feed-data";

interface HomePageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { tag } = await searchParams;
  const postFeedResult = await getPostFeedData({ tag });

  if (!postFeedResult.ok) {
    return (
      <PageContainer>
        <section className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <h1 className="text-lg font-semibold">
            게시글을 불러오지 못했습니다.
          </h1>
          <p className="text-sm text-muted-foreground">
            {postFeedResult.message}
          </p>
        </section>
      </PageContainer>
    );
  }

  const activeTag =
    typeof tag === "string" && tag.trim().length > 0 ? tag : undefined;
  const { posts, tags } = postFeedResult.data;

  return (
    <PageContainer>
      <div className="space-y-6">
        <section className="space-y-2">
          <h1 className="text-2xl font-bold md:text-2xl">DEVELOPMENT POSTS</h1>
        </section>

        <TagFilterBar tags={tags} activeTag={activeTag} />
        <PostFeed posts={posts} />
      </div>
    </PageContainer>
  );
}
