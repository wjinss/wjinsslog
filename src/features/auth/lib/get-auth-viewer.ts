import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthViewer {
  isAuthenticated: boolean;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

const LOGGED_OUT_VIEWER: AuthViewer = {
  isAuthenticated: false,
  email: null,
  displayName: null,
  avatarUrl: null,
};

function readMetadataValue(
  metadata: unknown,
  keys: string[],
): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  for (const key of keys) {
    const value = (metadata as Record<string, unknown>)[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

export async function getAuthViewer(): Promise<AuthViewer> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return LOGGED_OUT_VIEWER;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", data.user.id)
      .maybeSingle();

    const profileAvatarUrl =
      profileData &&
      typeof profileData.avatar_url === "string" &&
      profileData.avatar_url.length > 0
        ? profileData.avatar_url
        : null;

    return {
      isAuthenticated: true,
      email: data.user.email ?? null,
      displayName: readMetadataValue(data.user.user_metadata, [
        "display_name",
        "name",
        "full_name",
      ]),
      avatarUrl:
        profileAvatarUrl ??
        readMetadataValue(data.user.user_metadata, [
          "avatar_url",
          "picture",
          "profile_image",
        ]),
    };
  } catch {
    return LOGGED_OUT_VIEWER;
  }
}
