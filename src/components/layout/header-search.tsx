"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function HeaderSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();
  }, [isOpen]);

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    router.push(`${ROUTES.search}?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      closeSearch();
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        type="button"
        aria-label="검색 열기"
        title="검색"
        onClick={() => setIsOpen(true)}
      >
        <SearchIcon />
      </Button>
    );
  }

  return (
    <form
      role="search"
      aria-label="포스트 검색"
      className={cn(
        "absolute inset-x-4 top-3 z-40 flex h-10 items-center gap-1 rounded-lg border bg-background p-1 shadow-sm",
        "sm:static sm:h-auto sm:min-w-0 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none",
      )}
      onSubmit={handleSubmit}
    >
      <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none md:w-64">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="검색어 입력"
          className={cn(
            "h-8 w-full rounded-lg border border-input bg-background pr-8 pl-8 text-sm outline-none transition",
            "placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          )}
        />
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        type="button"
        aria-label="검색 닫기"
        title="닫기"
        onClick={closeSearch}
      >
        <X />
      </Button>
    </form>
  );
}
