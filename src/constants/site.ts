export const SITE_CONFIG = {
  name: "wjinss.log",
  title: "wjinss.log",
  description: "개발 학습 기록과 기술 내용을 정리하는 개인 개발 블로그",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://wjinsslog.vercel.app",
  ogImage: "/og-image.png",
} as const;
