"use server";

import {
  getAuthErrorMessage,
  signInWithEmail,
  signUpWithEmail,
  type SignInWithEmailParams,
  type SignUpWithEmailParams,
} from "@/api/auth";

export interface AuthActionState {
  status: "error" | "success";
  message: string;
}

export interface SignUpWithEmailActionParams extends SignUpWithEmailParams {
  passwordConfirm: string;
}

function normalizeText(value: string): string {
  return value.trim();
}

function normalizeSignInPayload(
  payload: SignInWithEmailParams,
): SignInWithEmailParams {
  return {
    email: normalizeText(payload.email),
    password: normalizeText(payload.password),
  };
}

function normalizeSignUpPayload(
  payload: SignUpWithEmailActionParams,
): SignUpWithEmailActionParams {
  return {
    email: normalizeText(payload.email),
    password: normalizeText(payload.password),
    passwordConfirm: normalizeText(payload.passwordConfirm),
    displayName: normalizeText(payload.displayName ?? ""),
  };
}

export async function signInWithEmailAction(
  payload: SignInWithEmailParams,
): Promise<AuthActionState> {
  const normalizedPayload = normalizeSignInPayload(payload);

  if (!normalizedPayload.email || !normalizedPayload.password) {
    return {
      status: "error",
      message: "이메일과 비밀번호를 입력해주세요.",
    };
  }

  try {
    await signInWithEmail(normalizedPayload);
  } catch (error) {
    return {
      status: "error",
      message: getAuthErrorMessage(error, "로그인에 실패했습니다."),
    };
  }

  return {
    status: "success",
    message: "로그인되었습니다.",
  };
}

export async function signUpWithEmailAction(
  payload: SignUpWithEmailActionParams,
): Promise<AuthActionState> {
  const normalizedPayload = normalizeSignUpPayload(payload);

  if (
    !normalizedPayload.email ||
    !normalizedPayload.password ||
    !normalizedPayload.passwordConfirm
  ) {
    return {
      status: "error",
      message: "이메일, 아이디, 비밀번호는 필수입니다.",
    };
  }

  if (normalizedPayload.password.length < 6) {
    return {
      status: "error",
      message: "비밀번호는 최소 6자 이상이어야 합니다.",
    };
  }

  if (normalizedPayload.password !== normalizedPayload.passwordConfirm) {
    return {
      status: "error",
      message: "비밀번호가 일치하지 않습니다.",
    };
  }

  try {
    const data = await signUpWithEmail({
      email: normalizedPayload.email,
      password: normalizedPayload.password,
      displayName: normalizedPayload.displayName,
    });

    if (data.session) {
      return {
        status: "success",
        message: "회원가입과 동시에 로그인이 완료되었습니다.",
      };
    }
  } catch (error) {
    return {
      status: "error",
      message: getAuthErrorMessage(error, "회원가입에 실패했습니다."),
    };
  }

  return {
    status: "success",
    message: "회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.",
  };
}
