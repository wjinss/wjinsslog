import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { PageContainer } from "@/components/layout/page-container";
import { PostCommentsSection } from "@/features/comments/components/post-comments-section";
import { getPostComments } from "@/features/comments/lib/get-post-comments";
import { LikeButton } from "@/features/posts/components/like-button";
import { incrementPostViews } from "@/features/posts/lib/increment-post-views";
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
  initialIsLiked: boolean;
  commentsCount: number;
  viewerUserId: string | null;
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

async function getPostFromDatabase(
  slug: string,
): Promise<PersistedPost | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const [{ data, error }, { data: authData, error: authError }] =
      await Promise.all([
        supabase
          .from("posts")
          .select(
            "id, slug, title, content_md, created_at, views_count, likes_count, comments_count",
          )
          .eq("slug", slug)
          .maybeSingle(),
        supabase.auth.getUser(),
      ]);

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

    const viewerUserId =
      !authError && typeof authData.user?.id === "string"
        ? authData.user.id
        : null;

    const [loadedTags, incrementedViewsCount, likedRow] = await Promise.all([
      loadPostTagNamesByPostIds({
        supabase,
        postIds: [id],
      }),
      incrementPostViews({
        supabase,
        slug: persistedSlug,
      }),
      viewerUserId
        ? supabase
            .from("post_likes")
            .select("post_id")
            .eq("post_id", id)
            .eq("user_id", viewerUserId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const tags = loadedTags.ok
      ? (loadedTags.tagNamesByPostId.get(id) ?? [])
      : [];
    const tagsLoadError = loadedTags.ok ? null : loadedTags.message;

    if (likedRow.error) {
      console.error("[getPostFromDatabase] post like state query failed", {
        message: likedRow.error.message,
        code: likedRow.error.code,
        postId: id,
        userId: viewerUserId,
      });
    }

    return {
      id,
      slug: persistedSlug,
      title,
      contentMd,
      createdAt: readString(row.created_at),
      viewsCount: incrementedViewsCount ?? readNumber(row.views_count),
      likesCount: readNumber(row.likes_count),
      initialIsLiked: Boolean(likedRow.data),
      commentsCount: readNumber(row.comments_count),
      viewerUserId,
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

  const commentsResult = await getPostComments(persistedPost.id);
  const visibleCommentsCount = commentsResult.errorMessage
    ? persistedPost.commentsCount
    : commentsResult.comments.length;

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
            <span>조회수 {persistedPost.viewsCount}</span>
            <LikeButton
              postId={persistedPost.id}
              initialLikesCount={persistedPost.likesCount}
              initialIsLiked={persistedPost.initialIsLiked}
              viewerUserId={persistedPost.viewerUserId}
            />
            <span>댓글 {visibleCommentsCount}</span>
          </div>
          {persistedPost.tagsLoadError ? (
            <p className="text-sm text-destructive">
              {persistedPost.tagsLoadError}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {persistedPost.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <section className="rounded-xl border p-6">
          <article className="prose max-w-none">
            <ReactMarkdown>{persistedPost.contentMd}</ReactMarkdown>
          </article>
        </section>

        <PostCommentsSection
          postId={persistedPost.id}
          postSlug={persistedPost.slug}
          isAuthenticated={Boolean(persistedPost.viewerUserId)}
          comments={commentsResult.comments}
          count={visibleCommentsCount}
          errorMessage={commentsResult.errorMessage}
        />
      </article>
    </PageContainer>
  );
}
