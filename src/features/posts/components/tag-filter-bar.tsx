import Link from "next/link";

interface TagFilterBarProps {
  tags: string[];
  activeTag?: string;
}

export function TagFilterBar({ tags, activeTag }: TagFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/"
        className={`rounded-full px-3 py-1 text-sm ${
          !activeTag ? "bg-primary text-primary-foreground" : "bg-secondary"
        }`}
      >
        전체
      </Link>
      {tags.map((tag) => {
        const isActive = activeTag === tag;

        return (
          <Link
            key={tag}
            href={`/?tag=${encodeURIComponent(tag)}`}
            className={`rounded-full px-3 py-1 text-sm ${
              isActive ? "bg-primary text-primary-foreground" : "bg-secondary"
            }`}
          >
            {tag}
          </Link>
        );
      })}
    </div>
  );
}
