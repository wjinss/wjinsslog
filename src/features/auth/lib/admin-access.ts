import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminSession {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId: string | null;
}

const LOGGED_OUT_ADMIN_SESSION: AdminSession = {
  isAuthenticated: false,
  isAdmin: false,
  userId: null,
};

function readStringValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function getAdminSession(): Promise<AdminSession> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return LOGGED_OUT_ADMIN_SESSION;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    const profileRole =
      profileData && typeof profileData === "object"
        ? readStringValue((profileData as Record<string, unknown>).role)
        : null;

    return {
      isAuthenticated: true,
      isAdmin: profileRole === "admin",
      userId: data.user.id,
    };
  } catch {
    return LOGGED_OUT_ADMIN_SESSION;
  }
}
