import { createElement, type ComponentProps } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function MarkdownImage({
  alt = "",
  loading = "lazy",
  decoding = "async",
  ...props
}: ComponentProps<"img">) {
  return createElement("img", {
    ...props,
    alt,
    loading,
    decoding,
  });
}

const markdownComponents: Components = {
  img: MarkdownImage,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto">
      <table>{children}</table>
    </div>
  ),
};

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-body prose max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          rehypeHighlight,
        ]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
