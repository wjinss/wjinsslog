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
