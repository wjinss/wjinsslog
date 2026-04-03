import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ROUTES } from "@/constants/routes";
import { getAuthViewer } from "@/features/auth/lib/get-auth-viewer";
import { SearchIcon, Sun } from "lucide-react";

export async function Header() {
  const viewer = await getAuthViewer();
  const headerActionLinkBaseClass =
    "group/button inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-transparent bg-clip-padding px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5";

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href={ROUTES.home} className="flex items-center gap-2">
          <div className="grid h-8 px-4 place-items-center rounded-md bg-primary font-bold text-primary-foreground text-sm">
            wjinss.Log
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.search}
            aria-label="검색"
            title="검색"
            className={`${headerActionLinkBaseClass} text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50`}
          >
            <SearchIcon />
          </Link>
          <Button variant="ghost" size="sm" type="button">
            <Sun />
          </Button>
          {viewer.isAuthenticated ? (
            <Link
              href={ROUTES.profile}
              aria-label="내 프로필"
              title="내 프로필"
              className="inline-flex items-center justify-center transition hover:opacity-80"
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
