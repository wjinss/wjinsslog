"use server";

import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { getAdminSession } from "@/features/auth/lib/admin-access";
import { generateUniquePostSlug } from "@/features/posts/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_TITLE_LENGTH = 150;
const MAX_BODY_LENGTH = 100_000;
const MAX_TAG_LENGTH = 30;
const MAX_TAG_COUNT = 10;
const MAX_THUMBNAIL_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const POST_THUMBNAIL_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_POST_THUMBNAIL_BUCKET ?? "post-thumbnails";

const ALLOWED_THUMBNAIL_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getTagCandidates(rawTags: string): string[] {
  if (!rawTags) {
    return [];
  }

  const trimmed = rawTags.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((tag): tag is string => typeof tag === "string");
      }
    } catch {
      return trimmed.split(",");
    }
  }

  return trimmed.split(",");
}

function parseTags(rawTags: string): string[] {
  const unique = new Set<string>();

  for (const tag of getTagCandidates(rawTags)) {
    const normalized = tag.trim().toLowerCase();
    if (!normalized) continue;

    const sanitized = normalized.replace(/\s+/g, "-").slice(0, MAX_TAG_LENGTH);
    if (sanitized) {
      unique.add(sanitized);
    }

    if (unique.size >= MAX_TAG_COUNT) {
      break;
    }
  }

  return [...unique];
}

function validateImageFile(file: FormDataEntryValue | null): file is File {
  return file instanceof File && file.size > 0;
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

export async function createPostAction(formData: FormData): Promise<void> {
  const adminSession = await getAdminSession();

  if (!adminSession.isAuthenticated) {
    redirect(ROUTES.signIn);
  }

  if (!adminSession.isAdmin) {
    redirect(ROUTES.home);
  }

  if (!adminSession.userId) {
    redirect(ROUTES.signIn);
  }

  const title = getFormString(formData, "title");
  const bodyMarkdown = getFormString(formData, "bodyMarkdown");
  const thumbnailFileEntry = formData.get("thumbnailFile");
  const tagsRaw = getFormString(formData, "tags");

  if (!title || !bodyMarkdown) {
    redirect(`${ROUTES.newPost}?error=missing_required`);
  }

  if (title.length > MAX_TITLE_LENGTH || bodyMarkdown.length > MAX_BODY_LENGTH) {
    redirect(`${ROUTES.newPost}?error=too_long`);
  }

  const tags = parseTags(tagsRaw);
  const supabase = await createSupabaseServerClient();
  const slug = await generateUniquePostSlug({ supabase, title });
  let thumbnailUrl: string | null = null;

  if (validateImageFile(thumbnailFileEntry)) {
    if (!ALLOWED_THUMBNAIL_TYPES.has(thumbnailFileEntry.type)) {
      redirect(`${ROUTES.newPost}?error=invalid_thumbnail_type`);
    }

    if (thumbnailFileEntry.size > MAX_THUMBNAIL_FILE_SIZE_BYTES) {
      redirect(`${ROUTES.newPost}?error=thumbnail_too_large`);
    }

    const extension = getFileExtension(thumbnailFileEntry);
    const filePath = `${adminSession.userId}/posts/${slug}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(POST_THUMBNAIL_BUCKET)
      .upload(filePath, thumbnailFileEntry, {
        contentType: thumbnailFileEntry.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[createPostAction] Thumbnail upload failed", uploadError);
      redirect(`${ROUTES.newPost}?error=thumbnail_upload_failed`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(POST_THUMBNAIL_BUCKET).getPublicUrl(filePath);

    thumbnailUrl = publicUrl;
  }

  const { error } = await supabase.from("posts").insert({
    title,
    slug,
    body_markdown: bodyMarkdown,
    thumbnail_url: thumbnailUrl,
    tags,
  });

  if (error) {
    console.error("[createPostAction] Failed to save post", error);
    redirect(`${ROUTES.newPost}?error=save_failed`);
  }

  redirect(`/posts/${slug}`);
}
