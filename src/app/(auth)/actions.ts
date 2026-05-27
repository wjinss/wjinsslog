"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { signInWithOAuth, type SignInWithEmailParams } from "@/api/auth";
import { ROUTES } from "@/constants/routes";
import {
  signInServerflow,
  signUpServerflow,
  type AuthState,
  type SignUpParams,
} from "@/features/auth/lib/auth-server-flows";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionState = AuthState;
export type SignUpWithEmailActionParams = SignUpParams;

function resolveRequestOrigin(headerStore: Headers): string {
  const origin = getUrlOrigin(headerStore.get("origin"));
  if (origin) return origin;

  const refererOrigin = getUrlOrigin(headerStore.get("referer"));
  if (refererOrigin) return refererOrigin;

  const host = (headerStore.get("x-forwarded-host") ?? headerStore.get("host"))
    ?.split(",")[0]
    ?.trim();

  if (!host) {
    const fallbackOrigin = getUrlOrigin(
      process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL,
    );

    if (fallbackOrigin) return fallbackOrigin;

    throw new Error("Unable to resolve request origin for OAuth redirect.");
  }

  const forwardedProtocol = headerStore
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const fallbackProtocol = getUrlProtocol(
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL,
  );

  const protocol = forwardedProtocol ?? fallbackProtocol ?? "https";

  return `${protocol}://${host}`;
}

function getUrlOrigin(url: string | null | undefined): string | null {
  if (!url) return null;

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  try {
    return new URL(normalizedUrl).origin;
  } catch {
    return null;
  }
}

function getUrlProtocol(url: string | null | undefined): string | null {
  if (!url) return null;

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  try {
    return new URL(normalizedUrl).protocol.replace(":", "");
  } catch {
    return null;
  }
}

export async function signInWithEmailAction(
  payload: SignInWithEmailParams,
): Promise<AuthActionState> {
  return signInServerflow(payload);
}

async function signInWithProviderAction(
  provider: "github" | "google",
): Promise<void> {
  const headerStore = await headers();
  const origin = resolveRequestOrigin(headerStore);
  const callbackUrl = new URL(ROUTES.authCallback, origin);

  const { url } = await signInWithOAuth({
    provider,
    redirectTo: callbackUrl.toString(),
  });

  if (!url) {
    redirect(ROUTES.signIn);
  }

  redirect(url);
}

export async function signInWithGitHubAction(): Promise<void> {
  await signInWithProviderAction("github");
}

export async function signInWithGoogleAction(): Promise<void> {
  await signInWithProviderAction("google");
}

export async function signUpWithEmailAction(
  payload: SignUpWithEmailActionParams,
): Promise<AuthActionState> {
  return signUpServerflow(payload);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(ROUTES.home);
}
const AVATAR_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET ?? "avatars";

const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

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

function validateAvatarFile(file: FormDataEntryValue | null): file is File {
  return file instanceof File && file.size > 0;
}

function redirectProfileError(errorCode: string): never {
  const params = new URLSearchParams({ error: errorCode });
  redirect(`${ROUTES.profile}?${params.toString()}`);
}

export async function updateProfileImageAction(
  formData: FormData,
): Promise<void> {
  const avatarFileEntry = formData.get("avatarFile");

  if (!validateAvatarFile(avatarFileEntry)) {
    redirectProfileError("no_file");
  }

  const avatarFile = avatarFileEntry;

  if (!ALLOWED_AVATAR_TYPES.has(avatarFile.type)) {
    redirectProfileError("invalid_file_type");
  }

  if (avatarFile.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    redirectProfileError("file_too_large");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();
  const user = data.user;

  if (userError || !user) {
    redirect(ROUTES.signIn);
  }

  const extension = getFileExtension(avatarFile);
  const filePath = `${user.id}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, avatarFile, {
      contentType: avatarFile.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    redirectProfileError("upload_failed");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

  const avatarUrlWithVersion = `${publicUrl}${
    publicUrl.includes("?") ? "&" : "?"
  }v=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrlWithVersion })
    .eq("id", user.id);

  if (profileError) {
    redirectProfileError("profile_update_failed");
  }

  redirect(`${ROUTES.profile}?updated=1`);
}
