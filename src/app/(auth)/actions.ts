"use server";

import { redirect } from "next/navigation";

import type { SignInWithEmailParams } from "@/api/auth";
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

export async function signInWithEmailAction(
  payload: SignInWithEmailParams,
): Promise<AuthActionState> {
  return signInServerflow(payload);
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

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (profileError) {
    redirectProfileError("profile_update_failed");
  }

  redirect(`${ROUTES.profile}?updated=1`);
}
