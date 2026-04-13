import { NextResponse } from "next/server";

import { ROUTES } from "@/constants/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(nextPath: string | null): string {
  if (!nextPath) return ROUTES.home;
  return nextPath.startsWith("/") ? nextPath : ROUTES.home;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL(ROUTES.signIn, requestUrl.origin));
  }

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  } catch {
    return NextResponse.redirect(new URL(ROUTES.signIn, requestUrl.origin));
  }

  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
