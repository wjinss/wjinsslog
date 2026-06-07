import type { Metadata } from "next";
import { cache, createElement, type ComponentProps } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Pencil } from "lucide-react";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { AppQueryProvider } from "@/components/providers/app-query-provider";
import { SITE_CONFIG } from "@/constants/site";
import { PostCommentsSection } from "@/features/comments/components/post-comments-section";
import { getPostComments } from "@/features/comments/lib/get-post-comments";
import { DeletePostButton } from "@/features/posts/components/delete-post-button";
import { LikeButton } from "@/features/posts/components/like-button";
import { PostViewTracker } from "@/features/posts/components/post-view-tracker";
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
  isAdmin: boolean;
  tags: string[];
  tagsLoadError: string | null;
}

interface PostDetailPageProps {
  params: Promise<{ slug: string }>;
}

interface PostDetailSource {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  description: string;
  thumbnailUrl: string | null;
  contentMd: string;
  createdAt: string | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
}

function MarkdownImage({
  alt = "",
  loading = "lazy",
  decoding = "async",
  ...props
}: ComponentProps<"img">) {
  return createElement("img", {
    ...props,
    alt,
    loading,
    decoding,
  });
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

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function isMissingDeletedAtColumnError(error: PostgrestError): boolean {
  const message = error.message.toLowerCase();

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    (message.includes("deleted_at") && message.includes("column"))
  );
}

async function selectPostBySlug({
  supabase,
  slug,
  excludeDeleted,
}: {
  supabase: SupabaseClient;
  slug: string;
  excludeDeleted: boolean;
}): Promise<{ data: unknown; error: PostgrestError | null }> {
  let postQuery = supabase
    .from("posts")
    .select(
      "id, slug, title, excerpt, thumbnail_url, content_md, created_at, views_count, likes_count, comments_count",
    )
    .eq("slug", slug);

  if (excludeDeleted) {
    postQuery = postQuery.is("deleted_at", null);
  }

  const { data, error } = await postQuery.maybeSingle();
  return { data, error };
}

async function loadPostBySlug({
  supabase,
  slug,
}: {
  supabase: SupabaseClient;
  slug: string;
}): Promise<{ data: unknown; error: PostgrestError | null }> {
  const softDeleteAwareResult = await selectPostBySlug({
    supabase,
    slug,
    excludeDeleted: true,
  });

  if (
    softDeleteAwareResult.error &&
    isMissingDeletedAtColumnError(softDeleteAwareResult.error)
  ) {
    return selectPostBySlug({
      supabase,
      slug,
      excludeDeleted: false,
    });
  }

  return softDeleteAwareResult;
}

function createPostDescription({
  excerpt,
  title,
}: {
  excerpt: string | null;
  title: string;
}): string {
  const fallback = `${title} 글을 ${SITE_CONFIG.name}에서 읽어보세요.`;
  const description = excerpt ?? fallback;

  return description.length > 155
    ? `${description.slice(0, 152).trimEnd()}...`
    : description;
}

function mapPostDetailSource(data: unknown): PostDetailSource | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const row = data as Record<string, unknown>;
  const id = readId(row.id);
  const slug = readString(row.slug);
  const title = readString(row.title);
  const contentMd = readString(row.content_md);

  if (!id || !slug || !title || !contentMd) {
    return null;
  }

  const excerpt = readString(row.excerpt);

  return {
    id,
    slug,
    title,
    excerpt,
    description: createPostDescription({
      excerpt,
      title,
    }),
    thumbnailUrl: readString(row.thumbnail_url),
    contentMd,
    createdAt: readString(row.created_at),
    viewsCount: readNumber(row.views_count),
    likesCount: readNumber(row.likes_count),
    commentsCount: readNumber(row.comments_count),
  };
}

const getPostDetailSource = cache(async (slug: string) => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await loadPostBySlug({ supabase, slug });

    if (error) {
      return null;
    }

    return mapPostDetailSource(data);
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: PostDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostDetailSource(slug);

  if (!post) {
    return {
      title: "포스트를 찾을 수 없습니다",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const postUrl = `/posts/${post.slug}`;
  const imageUrl = post.thumbnailUrl ?? SITE_CONFIG.ogImage;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: postUrl,
      siteName: SITE_CONFIG.name,
      locale: "ko_KR",
      type: "article",
      publishedTime: post.createdAt ?? undefined,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [imageUrl],
    },
  };
}

async function getPostFromDatabase(
  slug: string,
): Promise<PersistedPost | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const [post, { data: authData, error: authError }] = await Promise.all([
      getPostDetailSource(slug),
      supabase.auth.getUser(),
    ]);

    if (!post) {
      return null;
    }

    const viewerUserId =
      !authError && typeof authData.user?.id === "string"
        ? authData.user.id
        : null;

    const [loadedTags, likedRow, profileRow] = await Promise.all([
      loadPostTagNamesByPostIds({
        supabase,
        postIds: [post.id],
      }),
      viewerUserId
        ? supabase
            .from("post_likes")
            .select("post_id")
            .eq("post_id", post.id)
            .eq("user_id", viewerUserId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      viewerUserId
        ? supabase
            .from("profiles")
            .select("role")
            .eq("id", viewerUserId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const tags = loadedTags.ok
      ? (loadedTags.tagNamesByPostId.get(post.id) ?? [])
      : [];
    const tagsLoadError = loadedTags.ok ? null : loadedTags.message;
    const profile =
      profileRow.data && typeof profileRow.data === "object"
        ? (profileRow.data as Record<string, unknown>)
        : null;
    const isAdmin = readTrimmedString(profile?.role) === "admin";

    if (likedRow.error) {
      console.error("[getPostFromDatabase] post like state query failed", {
        message: likedRow.error.message,
        code: likedRow.error.code,
        postId: post.id,
        userId: viewerUserId,
      });
    }

    if (profileRow.error) {
      console.error("[getPostFromDatabase] profile role query failed", {
        message: profileRow.error.message,
        code: profileRow.error.code,
        userId: viewerUserId,
      });
    }

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      contentMd: post.contentMd,
      createdAt: post.createdAt,
      viewsCount: post.viewsCount,
      likesCount: post.likesCount,
      initialIsLiked: Boolean(likedRow.data),
      commentsCount: post.commentsCount,
      viewerUserId,
      isAdmin,
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
    : commentsResult.comments.reduce(
        (count, comment) => count + 1 + comment.replies.length,
        0,
      );

  return (
    <PageContainer>
      <PostViewTracker postId={persistedPost.id} />
      <article className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-3 border-b pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-3xl font-bold">{persistedPost.title}</h1>
            {persistedPost.isAdmin ? (
              <div className="flex flex-wrap items-start gap-2 self-start">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={
                    <Link
                      href={`/edit/${persistedPost.slug}`}
                      aria-label={`${persistedPost.title} 수정하기`}
                    />
                  }
                >
                  <Pencil aria-hidden="true" />
                  수정
                </Button>
                <DeletePostButton
                  postId={persistedPost.id}
                  slug={persistedPost.slug}
                  title={persistedPost.title}
                />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>
              {persistedPost.createdAt
                ? formatTimeAgo(persistedPost.createdAt)
                : "-"}
            </span>
            <span>조회수 {persistedPost.viewsCount}</span>
            <AppQueryProvider>
              <LikeButton
                postId={persistedPost.id}
                initialLikesCount={persistedPost.likesCount}
                initialIsLiked={persistedPost.initialIsLiked}
                viewerUserId={persistedPost.viewerUserId}
              />
            </AppQueryProvider>
            <span>댓글 {visibleCommentsCount}</span>
          </div>
          {persistedPost.tagsLoadError ? (
            <p className="text-sm text-destructive">
              {persistedPost.tagsLoadError}
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {persistedPost.tags.map((tag) => (
                <li key={tag} className="m-0 p-0">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                    {tag}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </header>

        <section aria-label="본문" className="rounded-xl border p-6">
          <div className="markdown-body prose max-w-none">
            <ReactMarkdown components={{ img: MarkdownImage }}>
              {persistedPost.contentMd}
            </ReactMarkdown>
          </div>
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
