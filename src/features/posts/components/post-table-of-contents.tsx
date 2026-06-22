"use client";

import { type MouseEvent, useEffect, useMemo, useState } from "react";

import type { PostTableOfContentsItem } from "@/features/posts/lib/table-of-contents";
import { cn } from "@/lib/utils";

interface PostTableOfContentsProps {
  items: PostTableOfContentsItem[];
}

const MIN_VISIBLE_ITEMS = 2;
const ACTIVE_OFFSET_PX = 104;

export function PostTableOfContents({ items }: PostTableOfContentsProps) {
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const [activeId, setActiveId] = useState(itemIds[0] ?? "");

  useEffect(() => {
    if (itemIds.length < MIN_VISIBLE_ITEMS) {
      return;
    }

    const headings = itemIds
      .map((id) => document.getElementById(id))
      .filter((heading): heading is HTMLElement => Boolean(heading));

    if (headings.length === 0) {
      return;
    }

    let animationFrameId = 0;

    const updateActiveHeading = () => {
      window.cancelAnimationFrame(animationFrameId);

      animationFrameId = window.requestAnimationFrame(() => {
        const currentHeading =
          headings.findLast(
            (heading) =>
              heading.getBoundingClientRect().top <= ACTIVE_OFFSET_PX,
          ) ?? headings[0];

        setActiveId(currentHeading.id);
      });
    };

    const observer = new IntersectionObserver(updateActiveHeading, {
      rootMargin: `-${ACTIVE_OFFSET_PX}px 0px -65% 0px`,
      threshold: [0, 1],
    });

    headings.forEach((heading) => {
      observer.observe(heading);
    });

    updateActiveHeading();
    window.addEventListener("resize", updateActiveHeading);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener("resize", updateActiveHeading);
    };
  }, [itemIds]);

  if (items.length < MIN_VISIBLE_ITEMS) {
    return null;
  }

  const handleLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    itemId: string,
  ) => {
    const heading = document.getElementById(itemId);

    if (!heading) {
      return;
    }

    event.preventDefault();
    heading.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(itemId);

    const nextUrl = new URL(window.location.href);
    nextUrl.hash = itemId;
    window.history.pushState(null, "", nextUrl);
  };

  return (
    <aside className="post-detail-toc absolute top-0 left-[calc(100%+1.5rem)] h-full w-48">
      <nav
        aria-label="게시글 목차"
        className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto py-1"
      >
        <ul className="m-0 list-none space-y-1 border-l border-border p-0">
          {items.map((item) => {
            const isActive = activeId === item.id;

            return (
              <li key={item.id} className="m-0 p-0">
                <a
                  href={`#${item.id}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={(event) => {
                    handleLinkClick(event, item.id);
                  }}
                  className={cn(
                    "-ml-px block border-l py-1.5 pr-2 text-xs leading-5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background",
                    item.depth === 3 ? "pl-6" : "pl-3",
                    isActive
                      ? "border-primary font-semibold text-foreground"
                      : "border-transparent text-muted-foreground",
                  )}
                >
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
