import { redirect } from "next/navigation";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

function decodeTagParam(tagParam: string): string {
  try {
    return decodeURIComponent(tagParam).trim();
  } catch {
    return tagParam.trim();
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeTagParam(tag);
  const target = decodedTag ? `/?tag=${encodeURIComponent(decodedTag)}` : "/";

  redirect(target);
}
