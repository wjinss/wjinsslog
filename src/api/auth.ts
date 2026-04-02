import "server-only";

import type {
  AuthResponse,
  AuthTokenResponsePassword,
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
