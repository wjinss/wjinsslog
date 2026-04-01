export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  thumbnailUrl: string;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  createdAt: string;
  tags: string[];
}
