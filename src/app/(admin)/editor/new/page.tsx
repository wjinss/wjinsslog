import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { ROUTES } from "@/constants/routes";
import { getAdminSession } from "@/features/auth/lib/admin-access";
import { NewPostForm } from "@/features/posts/components/new-post-form";

interface NewPostPageProps {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_required: "제목과 본문은 필수 입력값입니다.",
  too_long: "입력 길이가 너무 깁니다. 제목/본문 길이를 줄여주세요.",
  invalid_thumbnail_type: "썸네일 파일 형식이 올바르지 않습니다.",
  thumbnail_too_large: "썸네일 파일 크기는 5MB 이하여야 합니다.",
  thumbnail_upload_failed: "썸네일 업로드 중 오류가 발생했습니다.",
  save_failed: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  const adminSession = await getAdminSession();

  if (!adminSession.isAuthenticated) {
    redirect(ROUTES.signIn);
  }

  if (!adminSession.isAdmin) {
    redirect(ROUTES.home);
  }

  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  return (
    <PageContainer>
      <section className="mx-auto max-w-4xl space-y-6 rounded-xl border p-6">
        {errorMessage ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <NewPostForm />
      </section>
    </PageContainer>
  );
}
