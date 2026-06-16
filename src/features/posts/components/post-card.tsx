import Image from "next/image";
import Link from "next/link";

import { Eye, HeartIcon, MessageCircleMore } from "lucide-react";
import { formatTimeAgo } from "@/utils/date";
import type { PostSummary } from "@/types/post";

interface PostCardProps {
  post: PostSummary;
  imagePriority?: boolean;
}

const POST_CARD_THUMBNAIL_SIZES =
  "(min-width: 1280px) 624px, (min-width: 768px) calc((100vw - 4rem) / 2), calc(100vw - 2rem)";

export function PostCard({ post, imagePriority = false }: PostCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      {post.thumbnailUrl && (
        <Link href={`/posts/${post.slug}`} className="block">
          <div className="relative h-60 w-full bg-muted">
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              priority={imagePriority}
              sizes={POST_CARD_THUMBNAIL_SIZES}
              className="object-cover"
            />
          </div>
        </Link>
      )}

      <div className="space-y-3 p-4">
        <Link href={`/posts/${post.slug}`} className="block">
          <h2 className="line-clamp-1 text-lg font-semibold">{post.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        </Link>

        {post.tags.length > 0 ? (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0 pb-2">
            {post.tags.map((tag) => (
              <li key={tag} className="m-0 p-0">
                <Link
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HeartIcon aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">좋아요 </span>
            {post.likesCount}
          </span>
          <span className="flex items-center gap-1">
            <Eye aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">조회수 </span>
            {post.viewsCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircleMore aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">댓글 </span>
            {post.commentsCount}
          </span>
          <span className="flex items-center gap-2">
            {formatTimeAgo(post.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}
