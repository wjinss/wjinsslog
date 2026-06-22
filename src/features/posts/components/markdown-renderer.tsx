import { createElement, type ComponentProps } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { createHeadingIdSlugger } from "@/features/posts/lib/table-of-contents";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface HastNode {
  type?: string;
  tagName?: string;
  value?: unknown;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function getHastText(node: HastNode): string {
  if (node.type === "text" && typeof node.value === "string") {
    return node.value;
  }

  if (!node.children) {
    return "";
  }

  return node.children.map(getHastText).join("");
}

function visitHastNode(node: HastNode, visitor: (node: HastNode) => void) {
  visitor(node);

  node.children?.forEach((child) => {
    visitHastNode(child, visitor);
  });
}

function rehypeHeadingIds() {
  return function transformer(tree: HastNode) {
    const slugger = createHeadingIdSlugger();

    visitHastNode(tree, (node) => {
      if (
        node.type !== "element" ||
        !/^h[1-6]$/.test(node.tagName ?? "")
      ) {
        return;
      }

      node.properties ??= {};

      const existingId = node.properties.id;

      if (typeof existingId === "string" && existingId.length > 0) {
        slugger.reserve(existingId);
        return;
      }

      node.properties.id = slugger.slug(getHastText(node));
    });
  };
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
          rehypeHeadingIds,
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
