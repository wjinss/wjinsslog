import { PageContainer } from "@/components/layout/page-container";
import { PostFeed } from "@/features/posts/components/post-feed";
import { TagFilterBar } from "@/features/posts/components/tag-filter-bar";
import { mockPosts } from "@/features/posts/data/mock-posts";

interface HomePageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { tag } = await searchParams;

  const tags = [...new Set(mockPosts.flatMap((post) => post.tags))].sort();
  const filteredPosts = tag
    ? mockPosts.filter((post) => post.tags.includes(tag))
    : mockPosts;

  return (
    <PageContainer>
      <div className="space-y-6">
        <section className="space-y-2">
          <h1 className="text-2xl font-bold md:text-3xl">
            뭐라고 적을지 고민입니다
          </h1>
          <p className="text-sm text-muted-foreground">뚝딱뚝딱 만들어봅시다</p>
        </section>

        <TagFilterBar tags={tags} activeTag={tag} />
        <PostFeed posts={filteredPosts} />
      </div>
    </PageContainer>
  );
}
