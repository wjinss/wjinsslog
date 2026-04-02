"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { signInWithEmailAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useSignInForm } from "@/features/auth/hooks/use-auth-form-state";

interface SignInFormValues {
  email: string;
  password: string;
}

export function SignInForm() {
  const router = useRouter();
  const status = useSignInForm((state) => state.status);
  const message = useSignInForm((state) => state.message);
  const setFeedback = useSignInForm((state) => state.setFeedback);
  const clearFeedback = useSignInForm((state) => state.clearFeedback);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    clearFeedback();
  }, [clearFeedback]);

  const onSubmit = async (values: SignInFormValues) => {
    clearFeedback();

    const result = await signInWithEmailAction(values);

    if (result.status === "error") {
      setFeedback("error", result.message);
      return;
    }

    router.push(ROUTES.home);
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          이메일
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none ring-0 transition focus:border-primary"
          placeholder="you@example.com"
          {...register("email", {
            required: "이메일을 입력해주세요.",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "올바른 이메일 형식이 아닙니다.",
            },
          })}
        />
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none ring-0 transition focus:border-primary"
          placeholder="비밀번호를 입력해주세요"
          {...register("password", {
            required: "비밀번호를 입력해주세요.",
            minLength: {
              value: 6,
              message: "비밀번호는 최소 6자 이상이어야 합니다.",
            },
          })}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      {status === "error" && message ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <Button className="w-full h-10" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "로그인 중..." : "로그인"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        아이디가 없으신가요?{" "}
        <Link
          href={ROUTES.signUp}
          className="font-medium text-foreground underline"
        >
          회원가입
        </Link>
      </p>
    </form>
  );
}
