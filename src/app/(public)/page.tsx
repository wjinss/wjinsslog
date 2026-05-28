import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { SITE_CONFIG } from "@/constants/site";
import { PostFeed } from "@/features/posts/components/post-feed";
import { TagFilterBar } from "@/features/posts/components/tag-filter-bar";
import { getPostFeedData } from "@/features/posts/lib/get-post-feed-data";

export const metadata: Metadata = {
  title: {
    absolute: SITE_CONFIG.title,
  },
  description: SITE_CONFIG.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    url: "/",
    siteName: SITE_CONFIG.name,
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.ogImage],
  },
};

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
    <PageContainer className="max-w-none">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,42rem)_minmax(0,1fr)] xl:items-start">
        <section className="space-y-2 xl:col-start-2">
          <h1 className="text-2xl font-bold md:text-2xl">DEVELOPMENT POSTS</h1>
        </section>

        <div className="min-w-0 xl:hidden">
          <TagFilterBar
            tags={tags}
            activeTag={activeTag}
            variant="horizontal"
          />
        </div>

        <aside className="hidden min-w-0 xl:col-start-1 xl:row-start-2 xl:block xl:w-55 xl:justify-self-end xl:sticky xl:top-20">
          <TagFilterBar tags={tags} activeTag={activeTag} variant="sidebar" />
        </aside>

        <main className="min-w-0 xl:col-start-2 xl:row-start-2">
          <PostFeed posts={posts} />
        </main>
      </div>
    </PageContainer>
  );
}
