import Link from "next/link";
import { HeaderSearch } from "@/components/layout/header-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ROUTES } from "@/constants/routes";
import { getAuthSession } from "@/features/auth/lib/auth-session";

export async function Header() {
  const { viewer, adminSession } = await getAuthSession();
  const headerActionLinkBaseClass =
    "group/button inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-transparent bg-clip-padding px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5";

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Link
          href={ROUTES.home}
          aria-label="홈으로 이동"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="text-xl font-bold">wjinss.log</span>
        </Link>

        <div className="flex items-center gap-4">
          <HeaderSearch />
          <ThemeToggle />
          {adminSession.isAdmin && (
            <Link
              href={ROUTES.newPost}
              className="rounded-xl border border-gray-500 px-2.5 py-1 text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              새 글 작성
            </Link>
          )}

          {viewer.isAuthenticated ? (
            <Link
              href={ROUTES.profile}
              aria-label="내 프로필"
              title="내 프로필"
              className="inline-flex items-center justify-center rounded-full transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <UserAvatar
                src={viewer.avatarUrl}
                alt="내 프로필 이미지"
                size={32}
              />
            </Link>
          ) : (
            <Link
              href={ROUTES.signIn}
              className={`${headerActionLinkBaseClass} bg-primary text-primary-foreground hover:bg-primary/80`}
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
