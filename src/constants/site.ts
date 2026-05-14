export const SITE_CONFIG = {
  name: "wjinsslog",
  title: "wjinsslog | Personal Dev Blog",
  description: "프론트엔드와 웹 개발 경험을 기록하는 개인 개발 블로그",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ogImage: "/og-image.png",
} as const;
