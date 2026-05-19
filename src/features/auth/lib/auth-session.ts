import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthViewer {
  isAuthenticated: boolean;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface AdminSession {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId: string | null;
}

export interface AuthSession {
  viewer: AuthViewer;
  adminSession: AdminSession;
}

const LOGGED_OUT_VIEWER: AuthViewer = {
  isAuthenticated: false,
  email: null,
  displayName: null,
  avatarUrl: null,
};

const LOGGED_OUT_ADMIN_SESSION: AdminSession = {
  isAuthenticated: false,
  isAdmin: false,
  userId: null,
};

const LOGGED_OUT_AUTH_SESSION: AuthSession = {
  viewer: LOGGED_OUT_VIEWER,
  adminSession: LOGGED_OUT_ADMIN_SESSION,
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

function readStringValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function getAuthSession(): Promise<AuthSession> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return LOGGED_OUT_AUTH_SESSION;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("avatar_url, role")
      .eq("id", data.user.id)
      .maybeSingle();

    const profile =
      profileData && typeof profileData === "object"
        ? (profileData as Record<string, unknown>)
        : null;
    const profileAvatarUrl = readStringValue(profile?.avatar_url);
    const profileRole = readStringValue(profile?.role);

    return {
      viewer: {
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
      },
      adminSession: {
        isAuthenticated: true,
        isAdmin: profileRole === "admin",
        userId: data.user.id,
      },
    };
  } catch {
    return LOGGED_OUT_AUTH_SESSION;
  }
}
