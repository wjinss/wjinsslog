"use server";

import type { SignInWithEmailParams } from "@/api/auth";
import {
  signInServerflow,
  signUpServerflow,
  type AuthState,
  type SignUpParams,
} from "@/features/auth/lib/auth-server-flows";

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
