import Link from "next/link";

import { cn } from "@/lib/utils";

type TagFilterItem =
  | string
  | {
      id?: string | number;
      name: string;
      slug?: string;
      count?: number;
    };

interface TagFilterBarProps {
  tags: TagFilterItem[];
  activeTag?: string;
  variant?: "horizontal" | "sidebar";
}

export function TagFilterBar({
  tags,
  activeTag,
  variant = "horizontal",
}: TagFilterBarProps) {
  const containerClassName =
    variant === "sidebar"
      ? "flex gap-4 overflow-x-auto xl:max-h-[calc(100vh-7rem)] xl:flex-col xl:items-start xl:overflow-x-visible xl:overflow-y-auto xl:bg-card xl:px-5"
      : "space-y-2";
  const listClassName =
    variant === "sidebar"
      ? "m-0 flex list-none gap-4 overflow-x-auto p-0 xl:flex-col xl:items-start xl:overflow-x-visible"
      : "m-0 flex list-none gap-2 overflow-x-auto p-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
  const titleClassName =
    variant === "sidebar"
      ? "w-full border-b pb-3 text-lg font-semibold"
      : "hidden";
  const linkClassName =
    variant === "sidebar"
      ? "inline-flex w-fit max-w-full min-w-0 shrink-0 items-center gap-3 rounded-full px-3 py-1 text-xs transition-colors hover:bg-[oklch(0.922_0_0)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-[oklch(0.205_0_0)]"
      : "inline-flex max-w-[75vw] min-w-0 shrink-0 items-center gap-3 rounded-full px-3 py-1 text-xs transition-colors hover:bg-[oklch(0.922_0_0)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-[oklch(0.205_0_0)] sm:max-w-xs";

  return (
    <nav aria-label="태그 필터" className={containerClassName}>
      <span className={titleClassName}>태그목록</span>
      <ul className={listClassName}>
        <li className="m-0 p-0">
          <Link
            href="/"
            aria-current={!activeTag ? "page" : undefined}
            className={cn(
              linkClassName,
              !activeTag
                ? "bg-primary font-semibold text-primary-foreground hover:bg-[oklch(0.145_0_0)] dark:hover:bg-[oklch(0.8_0_0)]"
                : "bg-secondary",
            )}
          >
            <span className="min-w-0 truncate">전체</span>
          </Link>
        </li>
        {tags.map((tagItem) => {
          const tag = typeof tagItem === "string" ? tagItem : tagItem.name;
          const count = typeof tagItem === "string" ? undefined : tagItem.count;
          const isActive = activeTag === tag;

          return (
            <li key={tag} className="m-0 p-0">
              <Link
                href={`/?tag=${encodeURIComponent(tag)}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  linkClassName,
                  isActive
                    ? "bg-primary font-semibold text-primary-foreground hover:bg-[oklch(0.145_0_0)] dark:hover:bg-[oklch(0.8_0_0)]"
                    : "bg-secondary",
                )}
              >
                <span className="min-w-0 max-w-30 truncate" title={tag}>
                  {tag}
                </span>
                {typeof count === "number" ? (
                  <span
                    className={cn(
                      "shrink-0 text-xs",
                      isActive
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {count}개
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
