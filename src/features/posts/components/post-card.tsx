import Image from "next/image";
import Link from "next/link";

import { Eye, HeartIcon, MessageCircleMore } from "lucide-react";
import { formatTimeAgo } from "@/utils/date";
import type { PostSummary } from "@/types/post";

interface PostCardProps {
  post: PostSummary;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <Link href={`/posts/${post.slug}`} className="block">
        <div className="relative h-44 w-full bg-muted">
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            className="object-contain p-8"
          />
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <Link href={`/posts/${post.slug}`} className="block">
          <h2 className="line-clamp-1 text-lg font-semibold">{post.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        </Link>

        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/?tag=${tag}`}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
            >
              #{tag}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HeartIcon className="h-4 w-4" />
            {post.likesCount}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" /> {post.viewsCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircleMore className="h-4 w-4" /> {post.commentsCount}
          </span>
          <span className="flex items-center gap-2">
            {formatTimeAgo(post.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}
