"use server";

import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { getAdminSession } from "@/features/auth/lib/admin-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_TITLE_LENGTH = 150;
const MAX_CONTENT_LENGTH = 100_000;

type UpdatePostErrorCode =
  | "missing_required"
  | "too_long"
  | "post_not_found"
  | "save_failed";

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectToEdit(slug: string, errorCode: UpdatePostErrorCode): never {
  redirect(`/edit/${slug}?error=${errorCode}`);
}

export async function updatePostAction(formData: FormData): Promise<void> {
  const adminSession = await getAdminSession();

  if (!adminSession.isAuthenticated) {
    redirect(ROUTES.signIn);
  }

  if (!adminSession.isAdmin) {
    redirect(ROUTES.home);
  }

  const slug = getFormString(formData, "slug");
  const title = getFormString(formData, "title");
  const contentMd = getFormString(formData, "contentMd");
  const thumbnailUrl = getFormString(formData, "thumbnailUrl");

  if (!slug) {
    redirect(ROUTES.home);
  }

  if (!title || !contentMd) {
    redirectToEdit(slug, "missing_required");
  }

  if (title.length > MAX_TITLE_LENGTH || contentMd.length > MAX_CONTENT_LENGTH) {
    redirectToEdit(slug, "too_long");
  }

  const supabase = await createSupabaseServerClient();
  const { data: updatedPost, error } = await supabase
    .from("posts")
    .update({
      title,
      content_md: contentMd,
      thumbnail_url: thumbnailUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug)
    .select("slug")
    .maybeSingle();

  if (error) {
    console.error("[updatePostAction] posts update failed", {
      slug,
      error,
    });
    redirectToEdit(slug, "save_failed");
  }

  if (!updatedPost) {
    redirectToEdit(slug, "post_not_found");
  }

  redirect(`/posts/${slug}`);
}
