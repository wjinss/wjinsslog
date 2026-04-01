import type { PostSummary } from "@/types/post";

export const mockPosts: PostSummary[] = [
  {
    id: "post-1",
    slug: "nextjs-app-router-start",
    title: "Next.js App Router 시작하기",
    excerpt:
      "App Router 기반으로 프로젝트를 깔끔하게 시작하는 방법을 정리했습니다.",
    thumbnailUrl: "/globe.svg",
    likesCount: 12,
    viewsCount: 184,
    commentsCount: 4,
    createdAt: "2026-03-31T06:10:00.000Z",
    tags: ["nextjs", "app-router", "typescript"],
  },
  {
    id: "post-2",
    slug: "supabase-rls-guide",
    title: "Supabase RLS 정책 기초 가이드",
    excerpt:
      "개인 블로그 프로젝트에 맞춘 RLS 정책 작성 패턴을 예제로 설명합니다.",
    thumbnailUrl: "/window.svg",
    likesCount: 27,
    viewsCount: 392,
    commentsCount: 11,
    createdAt: "2026-03-28T11:30:00.000Z",
    tags: ["supabase", "postgres", "security"],
  },
  {
    id: "post-3",
    slug: "tailwind-shadcn-setup",
    title: "Tailwind + shadcn/ui 초기 세팅 메모",
    excerpt:
      "초기 스타일 시스템을 단순하게 잡고 확장하기 위한 최소 구성을 다룹니다.",
    thumbnailUrl: "/file.svg",
    likesCount: 8,
    viewsCount: 93,
    commentsCount: 1,
    createdAt: "2026-03-30T02:15:00.000Z",
    tags: ["tailwindcss", "shadcn", "ui"],
  },
];
