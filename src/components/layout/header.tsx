import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { SearchIcon, Sun } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href={ROUTES.home} className="flex items-center gap-2">
          <div className="grid h-8 px-4 place-items-center rounded-md bg-primary font-bold text-primary-foreground text-sm">
            wjinss.Log
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Link href={ROUTES.search}>
              <SearchIcon />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" type="button">
            <Sun />
          </Button>
          <Button size="sm">
            <Link href={ROUTES.login}>로그인</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
