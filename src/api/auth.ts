import "server-only";

import type {
  AuthError,
  AuthResponse,
  AuthTokenResponsePassword,
  Provider,
} from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SignUpWithEmailParams {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInWithEmailParams {
  email: string;
  password: string;
}

export async function signUpWithEmail(
  params: SignUpWithEmailParams,
): Promise<AuthResponse["data"]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        display_name: params.displayName,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithEmail(
  params: SignInWithEmailParams,
): Promise<AuthTokenResponsePassword["data"]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (error) {
    throw error;
  }

  return data;
}
export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as AuthError).message === "string"
  ) {
    return (error as AuthError).message;
  }

  return fallback;
}

export async function signInWithGitHubOAuth(
  provider: Provider,
  redirectTo?: string,
) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: redirectTo
      ? {
          redirectTo,
        }
      : undefined,
  });

  if (error) throw error;
  return data;
}
