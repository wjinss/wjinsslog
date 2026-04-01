import { PostCard } from "@/features/posts/components/post-card";
import type { PostSummary } from "@/types/post";

interface PostFeedProps {
  posts: PostSummary[];
}

export function PostFeed({ posts }: PostFeedProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        포스트가 없습니다.
      </div>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  );
}
