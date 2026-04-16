"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { getAdminSession } from "@/features/auth/lib/admin-access";
import { generateUniquePostSlug } from "@/features/posts/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_TITLE_LENGTH = 150;
const MAX_EXCERPT_LENGTH = 500;
const MAX_CONTENT_LENGTH = 100_000;
const MAX_THUMBNAIL_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const EXPECTED_POST_THUMBNAIL_BUCKET = "post-thumbnails";
const POST_THUMBNAIL_BUCKET =
  process.env.SUPABASE_POST_THUMBNAIL_BUCKET ??
  process.env.NEXT_PUBLIC_SUPABASE_POST_THUMBNAIL_BUCKET ??
  EXPECTED_POST_THUMBNAIL_BUCKET;

const ALLOWED_THUMBNAIL_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const POST_STATUSES = new Set(["draft", "published"] as const);

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validateImageFile(file: FormDataEntryValue | null): file is File {
  return file instanceof File && file.size > 0;
}

type PostStatus = "draft" | "published";

type ThumbnailUploadErrorCode =
  | "thumbnail_missing"
  | "invalid_thumbnail_type"
  | "thumbnail_too_large"
  | "thumbnail_upload_failed";

interface UploadPostThumbnailResult {
  publicUrl: string | null;
  storagePath: string | null;
  errorCode: ThumbnailUploadErrorCode | null;
}

interface UploadPostThumbnailParams {
  supabase: SupabaseClient;
  userId: string;
  postKey: string;
  fileEntry: FormDataEntryValue | null;
}

function getFileExtension(file: File): string {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };

  if (byType[file.type]) {
    return byType[file.type];
  }

  const fromName = file.name.split(".").pop()?.toLowerCase();
  return fromName && fromName.length <= 5 ? fromName : "bin";
}

async function uploadPostThumbnail({
  supabase,
  userId,
  postKey,
  fileEntry,
}: UploadPostThumbnailParams): Promise<UploadPostThumbnailResult> {
  if (!validateImageFile(fileEntry)) {
    return { publicUrl: null, storagePath: null, errorCode: "thumbnail_missing" };
  }

  if (!ALLOWED_THUMBNAIL_TYPES.has(fileEntry.type)) {
    console.warn("[uploadPostThumbnail] invalid file", {
      reason: "invalid_mime_type",
      fileType: fileEntry.type,
    });

    return {
      publicUrl: null,
      storagePath: null,
      errorCode: "invalid_thumbnail_type",
    };
  }

  if (fileEntry.size > MAX_THUMBNAIL_FILE_SIZE_BYTES) {
    console.warn("[uploadPostThumbnail] invalid file", {
      reason: "file_too_large",
      fileSize: fileEntry.size,
    });

    return {
      publicUrl: null,
      storagePath: null,
      errorCode: "thumbnail_too_large",
    };
  }

  if (POST_THUMBNAIL_BUCKET !== EXPECTED_POST_THUMBNAIL_BUCKET) {
    console.error("[uploadPostThumbnail] bucket name mismatch", {
      expected: EXPECTED_POST_THUMBNAIL_BUCKET,
      received: POST_THUMBNAIL_BUCKET,
    });

    return {
      publicUrl: null,
      storagePath: null,
      errorCode: "thumbnail_upload_failed",
    };
  }

  const extension = getFileExtension(fileEntry);
  const safePostKey = postKey.trim() ? postKey : "temp";
  const filePath = `${userId}/${safePostKey}/thumbnail-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(POST_THUMBNAIL_BUCKET)
    .upload(filePath, fileEntry, {
      contentType: fileEntry.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[uploadPostThumbnail] storage upload failed", {
      bucket: POST_THUMBNAIL_BUCKET,
      filePath,
      error: uploadError,
    });

    return {
      publicUrl: null,
      storagePath: filePath,
      errorCode: "thumbnail_upload_failed",
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(POST_THUMBNAIL_BUCKET).getPublicUrl(filePath);

  return {
    publicUrl: publicUrl || null,
    storagePath: filePath,
    errorCode: publicUrl ? null : "thumbnail_upload_failed",
  };
}

function getValidatedStatus(value: string): PostStatus | null {
  if (!value) {
    return "draft";
  }

  return POST_STATUSES.has(value as PostStatus) ? (value as PostStatus) : null;
}

export async function createPostAction(formData: FormData): Promise<void> {
  const adminSession = await getAdminSession();

  if (!adminSession.isAuthenticated) {
    redirect(ROUTES.signIn);
  }

  if (!adminSession.isAdmin) {
    redirect(ROUTES.home);
  }

  const title = getFormString(formData, "title");
  const slugInput = getFormString(formData, "slug");
  const excerptInput = getFormString(formData, "excerpt");
  const contentMd = getFormString(formData, "contentMd");
  const statusValue = getFormString(formData, "status");
  const thumbnailFileEntry = formData.get("thumbnailFile");

  if (!title || !contentMd) {
    console.error("[createPostAction] invalid form data", {
      reason: "missing_required",
      hasTitle: Boolean(title),
      hasContent: Boolean(contentMd),
    });
    redirect(`${ROUTES.newPost}?error=missing_required`);
  }

  const status = getValidatedStatus(statusValue);

  if (!status) {
    console.error("[createPostAction] invalid form data", {
      reason: "invalid_status",
      statusValue,
    });
    redirect(`${ROUTES.newPost}?error=invalid_form_data`);
  }

  if (
    title.length > MAX_TITLE_LENGTH ||
    excerptInput.length > MAX_EXCERPT_LENGTH ||
    contentMd.length > MAX_CONTENT_LENGTH
  ) {
    console.error("[createPostAction] invalid form data", {
      reason: "too_long",
      titleLength: title.length,
      excerptLength: excerptInput.length,
      contentLength: contentMd.length,
    });
    redirect(`${ROUTES.newPost}?error=too_long`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    console.error("[createPostAction] user not found", { error: authError });
    redirect(ROUTES.signIn);
  }

  const authorId = authData.user.id;
  const slug = await generateUniquePostSlug({
    supabase,
    title,
    requestedSlug: slugInput,
  });

  const thumbnailUpload = await uploadPostThumbnail({
    supabase,
    userId: authorId,
    postKey: slug,
    fileEntry: thumbnailFileEntry,
  });

  if (thumbnailUpload.errorCode === "thumbnail_missing") {
    console.warn("[createPostAction] thumbnail file missing");
  } else if (thumbnailUpload.errorCode) {
    console.error("[createPostAction] thumbnail upload failed", {
      code: thumbnailUpload.errorCode,
      storagePath: thumbnailUpload.storagePath,
    });
    redirect(`${ROUTES.newPost}?error=${thumbnailUpload.errorCode}`);
  }

  const excerpt = excerptInput || contentMd.slice(0, 180);
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  const { data: insertedPost, error: insertError } = await supabase
    .from("posts")
    .insert({
      title,
      slug,
      excerpt,
      content_md: contentMd,
      thumbnail_url: thumbnailUpload.publicUrl,
      status,
      author_id: authorId,
      published_at: publishedAt,
    })
    .select("slug")
    .single();

  if (insertError) {
    console.error("[createPostAction] posts insert failed", {
      slug,
      authorId,
      status,
      error: insertError,
    });
    redirect(`${ROUTES.newPost}?error=save_failed`);
  }

  const redirectSlug =
    insertedPost && typeof insertedPost === "object" && "slug" in insertedPost
      ? String((insertedPost as { slug: string }).slug)
      : slug;

  redirect(`/posts/${redirectSlug}`);
}
