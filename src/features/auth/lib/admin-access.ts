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

const ADMIN_ROLES = new Set(["admin", "super_admin", "owner"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function readStringValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readBooleanValue(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return false;
}

function readRole(metadata: unknown): string | null {
  const record = asRecord(metadata);
  if (!record) return null;

  return readStringValue(record.role) ?? readStringValue(record.user_role);
}

function hasAdminRole(...roles: Array<string | null>): boolean {
  return roles.some((role) => role && ADMIN_ROLES.has(role.toLowerCase()));
}

export async function getAdminSession(): Promise<AdminSession> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return LOGGED_OUT_ADMIN_SESSION;
    }

    const userMetadata = asRecord(data.user.user_metadata);
    const appMetadata = asRecord(data.user.app_metadata);

    const metadataAdminFlag =
      readBooleanValue(userMetadata?.is_admin) ||
      readBooleanValue(appMetadata?.is_admin);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    const profileRole =
      profileData && typeof profileData === "object"
        ? readStringValue((profileData as Record<string, unknown>).role)
        : null;

    const profileAdminFlag = hasAdminRole(profileRole);

    const isAdmin =
      metadataAdminFlag ||
      profileAdminFlag ||
      hasAdminRole(readRole(appMetadata), readRole(userMetadata));

    return {
      isAuthenticated: true,
      isAdmin,
      userId: data.user.id,
    };
  } catch {
    return LOGGED_OUT_ADMIN_SESSION;
  }
}
