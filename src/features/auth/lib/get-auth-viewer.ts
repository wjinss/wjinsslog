import "server-only";

import {
  getAuthSession,
  type AuthViewer,
} from "@/features/auth/lib/auth-session";

export type { AuthViewer };

export async function getAuthViewer(): Promise<AuthViewer> {
  const { viewer } = await getAuthSession();
  return viewer;
}
