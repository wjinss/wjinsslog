import { notFound, redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getAdminSession } from "@/features/auth/lib/admin-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { updatePostAction } from "./actions";

interface EditPostPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}

interface EditablePost {
  slug: string;
  title: string;
  contentMd: string;
  thumbnailUrl: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_required: "제목과 본문은 최소 1자 이상 입력해야 합니다.",
  too_long: "입력 길이가 너무 깁니다. 제목 또는 본문 길이를 줄여주세요.",
  post_not_found: "수정할 포스트를 찾을 수 없습니다.",
  save_failed: "수정 내용을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
};

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function getEditablePost(slug: string): Promise<EditablePost | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("posts")
      .select("slug, title, content_md, thumbnail_url")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data || typeof data !== "object") {
      return null;
    }

    const row = data as Record<string, unknown>;
    const persistedSlug = readString(row.slug);
    const title = readString(row.title);
    const contentMd = readString(row.content_md);

    if (!persistedSlug || !title || !contentMd) {
      return null;
    }

    return {
      slug: persistedSlug,
      title,
      contentMd,
      thumbnailUrl: readString(row.thumbnail_url),
    };
  } catch {
    return null;
  }
}

export default async function EditPostPage({
  params,
  searchParams,
}: EditPostPageProps) {
  const adminSession = await getAdminSession();

  if (!adminSession.isAuthenticated) {
    redirect(ROUTES.signIn);
  }

  if (!adminSession.isAdmin) {
    redirect(ROUTES.home);
  }

  const { slug } = await params;
  const post = await getEditablePost(slug);

  if (!post) {
    notFound();
  }

  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  return (
    <PageContainer>
      <section className="mx-auto max-w-4xl space-y-6 rounded-xl border p-6">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">포스트 수정</p>
          <h1 className="text-2xl font-bold">{post.title}</h1>
        </header>

        {errorMessage ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <form action={updatePostAction} className="space-y-5" noValidate>
          <input type="hidden" name="slug" value={post.slug} />

          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              제목
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={150}
              defaultValue={post.title}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="thumbnailUrl" className="text-sm font-medium">
              썸네일 URL
            </label>
            <input
              id="thumbnailUrl"
              name="thumbnailUrl"
              type="url"
              defaultValue={post.thumbnailUrl}
              placeholder="https://example.com/thumbnail.png"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contentMd" className="text-sm font-medium">
              본문
            </label>
            <textarea
              id="contentMd"
              name="contentMd"
              required
              rows={18}
              defaultValue={post.contentMd}
              className="min-h-[420px] w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm outline-none transition focus:border-primary"
            />
          </div>

          <Button type="submit" className="h-10 w-full">
            수정 완료
          </Button>
        </form>
      </section>
    </PageContainer>
  );
}
