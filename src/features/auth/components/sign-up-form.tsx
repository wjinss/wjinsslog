"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { signUpWithEmailAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useSignUpForm } from "@/features/auth/hooks/use-auth-form-state";

interface SignUpFormValues {
  email: string;
  displayName: string;
  password: string;
  passwordConfirm: string;
}

export function SignUpForm() {
  const status = useSignUpForm((state) => state.status);
  const message = useSignUpForm((state) => state.message);
  const setFeedback = useSignUpForm((state) => state.setFeedback);
  const clearFeedback = useSignUpForm((state) => state.clearFeedback);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    mode: "onTouched",
    defaultValues: {
      email: "",
      displayName: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const passwordValue = useWatch({
    control,
    name: "password",
  });

  useEffect(() => {
    clearFeedback();
  }, [clearFeedback]);

  const onSubmit = async (values: SignUpFormValues) => {
    clearFeedback();

    const result = await signUpWithEmailAction(values);

    if (result.status === "error") {
      setFeedback("error", result.message);
      return;
    }

    setFeedback("success", result.message);
    reset({
      ...values,
      password: "",
      passwordConfirm: "",
    });
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
          placeholder="abc@abc.io"
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
        <label htmlFor="displayName" className="text-sm font-medium">
          이름
        </label>
        <input
          id="displayName"
          type="text"
          autoComplete="name"
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none ring-0 transition focus:border-primary"
          placeholder="이름을 입력해주세요"
          {...register("displayName")}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none ring-0 transition focus:border-primary"
          placeholder="6자 이상 입력해주세요"
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

      <div className="space-y-1.5">
        <label htmlFor="passwordConfirm" className="text-sm font-medium">
          비밀번호 확인
        </label>
        <input
          id="passwordConfirm"
          type="password"
          autoComplete="new-password"
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none ring-0 transition focus:border-primary"
          placeholder="비밀번호를 재입력해주세요"
          {...register("passwordConfirm", {
            required: "비밀번호를 재입력해주세요.",
            validate: (value) =>
              value === passwordValue || "비밀번호가 일치하지 않습니다.",
          })}
        />
        {errors.passwordConfirm ? (
          <p className="text-sm text-destructive">
            {errors.passwordConfirm.message}
          </p>
        ) : null}
      </div>

      {status !== "idle" && message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            status === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
        >
          {message}
        </p>
      ) : null}

      <Button className="w-full h-10" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "가입 중..." : "회원가입"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link
          href={ROUTES.signIn}
          className="font-medium text-foreground underline"
        >
          로그인
        </Link>
      </p>
    </form>
  );
}
