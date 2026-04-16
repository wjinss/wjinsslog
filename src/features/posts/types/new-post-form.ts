export interface NewPostFormValues {
  title: string;
  slug: string;
  excerpt: string;
  contentMd: string;
  status: "draft" | "published";
  tags: string;
  tagInput: string;
}
