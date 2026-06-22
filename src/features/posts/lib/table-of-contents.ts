export interface PostTableOfContentsItem {
  id: string;
  title: string;
  depth: 2 | 3;
}

interface HeadingIdSlugger {
  reserve: (id: string) => void;
  slug: (value: string) => string;
}

const MIN_HEADING_DEPTH = 2;
const MAX_HEADING_DEPTH = 3;
const FALLBACK_HEADING_ID = "section";

function slugifyHeading(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Mark}\p{Number}_\s-]/gu, "")
    .replace(/-/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug.length > 0 ? slug : FALLBACK_HEADING_ID;
}

export function createHeadingIdSlugger(): HeadingIdSlugger {
  const occurrences = new Map<string, number>();

  return {
    reserve(id) {
      if (!occurrences.has(id)) {
        occurrences.set(id, 0);
      }
    },
    slug(value) {
      const originalSlug = slugifyHeading(value);
      const occurrence = occurrences.get(originalSlug);

      if (occurrence === undefined) {
        occurrences.set(originalSlug, 0);
        return originalSlug;
      }

      const nextOccurrence = occurrence + 1;
      occurrences.set(originalSlug, nextOccurrence);
      const uniqueSlug = `${originalSlug}-${nextOccurrence}`;
      occurrences.set(uniqueSlug, 0);

      return uniqueSlug;
    },
  };
}

function stripMarkdownInlineSyntax(value: string): string {
  return value
    .replace(/\s+#+\s*$/g, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/[*_~]/g, "")
    .replace(/\\([\\`*{}\[\]()#+\-.!_>])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function readMarkdownHeading(line: string):
  | {
      depth: number;
      title: string;
    }
  | null {
  const match = /^(#{1,6})[ \t]+(.+?)\s*$/.exec(line.trim());

  if (!match) {
    return null;
  }

  const depth = match[1].length;
  const title = stripMarkdownInlineSyntax(match[2]);

  if (!title) {
    return null;
  }

  return {
    depth,
    title,
  };
}

function isFenceBoundary(line: string): boolean {
  return /^[ \t]{0,3}(`{3,}|~{3,})/.test(line);
}

export function extractPostTableOfContents(
  content: string,
): PostTableOfContentsItem[] {
  const slugger = createHeadingIdSlugger();
  const items: PostTableOfContentsItem[] = [];
  const lines = content.split(/\r?\n/);
  let isInsideCodeFence = false;

  for (const line of lines) {
    if (isFenceBoundary(line)) {
      isInsideCodeFence = !isInsideCodeFence;
      continue;
    }

    if (isInsideCodeFence) {
      continue;
    }

    const heading = readMarkdownHeading(line);

    if (!heading) {
      continue;
    }

    const id = slugger.slug(heading.title);

    if (
      heading.depth < MIN_HEADING_DEPTH ||
      heading.depth > MAX_HEADING_DEPTH
    ) {
      continue;
    }

    const depth = heading.depth as PostTableOfContentsItem["depth"];

    items.push({
      id,
      title: heading.title,
      depth,
    });
  }

  return items;
}
