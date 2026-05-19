import "server-only";

import {
  getAuthSession,
  type AdminSession,
} from "@/features/auth/lib/auth-session";

export type { AdminSession };

export async function getAdminSession(): Promise<AdminSession> {
  const { adminSession } = await getAuthSession();
  return adminSession;
}
