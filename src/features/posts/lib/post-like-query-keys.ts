const POSTS_QUERY_KEY = ["posts"] as const;

export const postLikeQueryKeys = {
  all: POSTS_QUERY_KEY,
  detail: (postId: string) =>
    [...POSTS_QUERY_KEY, "detail", postId, "like"] as const,
  feed: () => [...POSTS_QUERY_KEY, "feed"] as const,
  toggle: (postId: string) =>
    [...POSTS_QUERY_KEY, "detail", postId, "like", "toggle"] as const,
};
