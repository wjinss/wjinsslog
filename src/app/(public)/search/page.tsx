import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { SITE_CONFIG } from "@/constants/site";
import { PostFeed } from "@/features/posts/components/post-feed";
import { searchPosts } from "@/features/posts/lib/search-posts";

export const metadata: Metadata = {
  title: "검색 결과",
  description: "게시글 제목과 태그로 포스트를 검색합니다.",
  alternates: {
    canonical: "/search",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: `검색 결과 | ${SITE_CONFIG.name}`,
    description: "게시글 제목과 태그로 포스트를 검색합니다.",
    url: "/search",
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
    title: `검색 결과 | ${SITE_CONFIG.name}`,
    description: "게시글 제목과 태그로 포스트를 검색합니다.",
    images: [SITE_CONFIG.ogImage],
  },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

function readSearchQuery(value?: string | string[]): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = readSearchQuery(q);
  const posts = query ? await searchPosts(query) : [];

  return (
    <PageContainer>
      <div className="space-y-6">
        <section className="space-y-2">
          <h1 className="text-2xl font-bold">검색 결과</h1>
          {query ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{query}</span>
              {" "}검색 결과 {posts.length}개
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              검색어를 입력하면 제목과 태그가 일치하는 포스트를 보여줍니다.
            </p>
          )}
        </section>

        {!query ? (
          <section className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            검색어가 없습니다. 주소에{" "}
            <span className="font-medium text-foreground">?q=검색어</span>를
            붙여 검색해 주세요.
          </section>
        ) : posts.length > 0 ? (
          <PostFeed posts={posts} />
        ) : (
          <section className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{query}</span>에 대한
            검색 결과가 없습니다.
          </section>
        )}
      </div>
    </PageContainer>
  );
}
