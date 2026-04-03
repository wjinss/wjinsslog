import "server-only";

import {
  getAuthErrorMessage,
  signInWithEmail,
  signUpWithEmail,
  type SignInWithEmailParams,
  type SignUpWithEmailParams,
} from "@/api/auth";

export interface AuthState {
  status: "error" | "success";
  message: string;
}

export interface SignUpParams extends SignUpWithEmailParams {
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

function normalizeSignUpPayload(payload: SignUpParams): SignUpParams {
  return {
    email: normalizeText(payload.email),
    password: normalizeText(payload.password),
    passwordConfirm: normalizeText(payload.passwordConfirm),
    displayName: normalizeText(payload.displayName ?? ""),
  };
}

function hasAuthCode(error: unknown, code: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  if (!("code" in error)) return false;
  return (error as { code?: string }).code === code;
}

function includesMessage(errorMessage: string, token: string): boolean {
  return errorMessage.toLowerCase().includes(token.toLowerCase());
}

function getSignInErrorMessage(error: unknown): string {
  const fallback = getAuthErrorMessage(error, "로그인에 실패했습니다.");

  if (
    hasAuthCode(error, "invalid_credentials") ||
    includesMessage(fallback, "invalid login credentials")
  ) {
    return "가입되지 않았거나 이메일/비밀번호가 올바르지 않습니다.";
  }

  if (
    hasAuthCode(error, "email_not_confirmed") ||
    includesMessage(fallback, "email not confirmed")
  ) {
    return "이메일 인증 후 로그인해주세요.";
  }

  return fallback;
}

function getSignUpErrorMessage(error: unknown): string {
  const fallback = getAuthErrorMessage(error, "회원가입에 실패했습니다.");

  if (
    hasAuthCode(error, "user_already_exists") ||
    includesMessage(fallback, "already registered") ||
    includesMessage(fallback, "already been registered")
  ) {
    return "이미 가입된 이메일입니다. 로그인해주세요.";
  }

  return fallback;
}

export async function signInServerflow(
  payload: SignInWithEmailParams,
): Promise<AuthState> {
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
      message: getSignInErrorMessage(error),
    };
  }

  return {
    status: "success",
    message: "로그인되었습니다.",
  };
}

export async function signUpServerflow(
  payload: SignUpParams,
): Promise<AuthState> {
  const normalizedPayload = normalizeSignUpPayload(payload);

  if (
    !normalizedPayload.email ||
    !normalizedPayload.password ||
    !normalizedPayload.passwordConfirm
  ) {
    return {
      status: "error",
      message: "이메일, 비밀번호는 필수입니다.",
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
      message: getSignUpErrorMessage(error),
    };
  }

  return {
    status: "success",
    message: "회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.",
  };
}
