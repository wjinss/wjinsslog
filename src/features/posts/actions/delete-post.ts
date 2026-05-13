"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { getAdminSession } from "@/features/auth/lib/admin-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeletePostErrorCode =
  | "missing_identifier"
  | "post_not_found"
  | "soft_delete_column_missing"
  | "delete_failed";

export type DeletePostActionResult = {
  ok: false;
  errorCode: DeletePostErrorCode;
};

interface DeletePostTarget {
  id: string | null;
  slug: string | null;
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getDeletePostTarget(formData: FormData): DeletePostTarget {
  return {
    id:
      getFormString(formData, "postId") ||
      getFormString(formData, "id") ||
      null,
    slug: getFormString(formData, "slug") || null,
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readId(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function readPostRow(value: unknown): { id: string; slug: string } | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = readId(row.id);
  const slug = readString(row.slug);

  if (!id || !slug) {
    return null;
  }

  return { id, slug };
}

function isMissingDeletedAtColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as Record<string, unknown>;
  const code = readString(record.code);
  const message = readString(record.message)?.toLowerCase() ?? "";

  return (
    code === "42703" ||
    code === "PGRST204" ||
    (message.includes("deleted_at") && message.includes("column"))
  );
}

function createDeleteErrorResult(
  errorCode: DeletePostErrorCode,
): DeletePostActionResult {
  return {
    ok: false,
    errorCode,
  };
}

export async function deletePostAction(
  formData: FormData,
): Promise<DeletePostActionResult> {
  const adminSession = await getAdminSession();

  if (!adminSession.isAuthenticated) {
    redirect(ROUTES.signIn);
  }

  if (!adminSession.isAdmin) {
    redirect(ROUTES.home);
  }

  const target = getDeletePostTarget(formData);

  if (!target.id && !target.slug) {
    return createDeleteErrorResult("missing_identifier");
  }

  const supabase = await createSupabaseServerClient();
  let selectPostQuery = supabase.from("posts").select("id, slug").limit(1);

  if (target.id) {
    selectPostQuery = selectPostQuery.eq("id", target.id);
  }

  if (target.slug) {
    selectPostQuery = selectPostQuery.eq("slug", target.slug);
  }

  const { data: postData, error: postError } =
    await selectPostQuery.maybeSingle();
  const post = readPostRow(postData);

  if (postError) {
    console.error("[deletePostAction] posts select failed", {
      target,
      error: postError,
    });
    return createDeleteErrorResult("delete_failed");
  }

  if (!post) {
    return createDeleteErrorResult("post_not_found");
  }

  const now = new Date().toISOString();
  const { data: deletedPostData, error: deleteError } = await supabase
    .from("posts")
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", post.id)
    .is("deleted_at", null)
    .select("id, slug")
    .maybeSingle();

  if (deleteError) {
    const errorCode: DeletePostErrorCode = isMissingDeletedAtColumnError(
      deleteError,
    )
      ? "soft_delete_column_missing"
      : "delete_failed";

    console.error("[deletePostAction] posts soft delete failed", {
      postId: post.id,
      slug: post.slug,
      errorCode,
      error: deleteError,
    });
    return createDeleteErrorResult(errorCode);
  }

  if (!deletedPostData) {
    console.error("[deletePostAction] posts soft delete returned no row", {
      postId: post.id,
      slug: post.slug,
    });
    return createDeleteErrorResult("post_not_found");
  }

  revalidatePath(ROUTES.home);
  revalidatePath(`/posts/${post.slug}`);
  revalidatePath(`/edit/${post.slug}`);

  redirect(ROUTES.home);
}
