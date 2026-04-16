"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const EXPECTED_POST_CONTENT_IMAGE_BUCKET = "post-images";
const POST_CONTENT_IMAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_POST_CONTENT_IMAGE_BUCKET ??
  EXPECTED_POST_CONTENT_IMAGE_BUCKET;
const MAX_POST_CONTENT_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_POST_CONTENT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

function getFileExtension(file: File): string {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
  };

  if (byType[file.type]) {
    return byType[file.type];
  }

  const fromName = file.name
    .split(".")
    .pop()
    ?.toLowerCase()
    ?.replace(/[^a-z0-9]/g, "");

  return fromName && fromName.length <= 5 ? fromName : "bin";
}

function sanitizeFileName(file: File): string {
  const extension = getFileExtension(file);
  const fromName = file.name.includes(".")
    ? file.name.slice(0, file.name.lastIndexOf("."))
    : file.name;

  const safeBase = fromName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  const fallbackBase = `image-${Date.now()}`;
  return `${safeBase || fallbackBase}.${extension}`;
}

function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .slice(0, 120);
}

function validatePostContentImageFile(file: File): boolean {
  if (!(file instanceof File) || file.size <= 0) {
    console.error("[uploadPostContentImage] invalid file", {
      reason: "missing_or_empty",
    });
    return false;
  }

  if (!ALLOWED_POST_CONTENT_IMAGE_TYPES.has(file.type)) {
    console.error("[uploadPostContentImage] invalid file", {
      reason: "invalid_mime_type",
      fileType: file.type,
    });
    return false;
  }

  if (file.size > MAX_POST_CONTENT_IMAGE_FILE_SIZE_BYTES) {
    console.error("[uploadPostContentImage] invalid file", {
      reason: "file_too_large",
      fileSize: file.size,
      maxFileSize: MAX_POST_CONTENT_IMAGE_FILE_SIZE_BYTES,
    });
    return false;
  }

  return true;
}

export interface UploadPostContentImageParams {
  file: File;
  postId?: string;
}

export interface UploadPostContentImageResult {
  publicUrl: string;
  storagePath: string;
}

export async function uploadPostContentImage({
  file,
  postId,
}: UploadPostContentImageParams): Promise<UploadPostContentImageResult> {
  if (!validatePostContentImageFile(file)) {
    throw new Error("invalid_file");
  }

  const supabase = createSupabaseBrowserClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    console.error("[uploadPostContentImage] user not found", { error: authError });
    throw new Error("user_not_found");
  }

  const userId = authData.user.id;
  const safeFileName = sanitizeFileName(file);
  const safePostId = sanitizePathSegment(postId ?? "");
  const basePath = safePostId
    ? `${userId}/${safePostId}/content`
    : `${userId}/temp`;
  const storagePath = `${basePath}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(POST_CONTENT_IMAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[uploadPostContentImage] storage upload failed", {
      bucket: POST_CONTENT_IMAGE_BUCKET,
      storagePath,
      error: uploadError,
    });
    throw new Error("storage_upload_failed");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(POST_CONTENT_IMAGE_BUCKET).getPublicUrl(storagePath);

  if (!publicUrl) {
    console.error("[uploadPostContentImage] public url not found", {
      bucket: POST_CONTENT_IMAGE_BUCKET,
      storagePath,
    });
    throw new Error("public_url_not_found");
  }

  return { publicUrl, storagePath };
}
