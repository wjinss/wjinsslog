import { PageContainer } from "@/components/layout/page-container";
import GitHubSignIn from "@/features/auth/components/github-sign-In";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import GoogleSignIn from "@/features/auth/components/google-sign-in";

export default function SignInPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-md space-y-5 rounded-2xl border p-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">로그인</h1>
        </header>
        <SignInForm />
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t" />
          <span className="text-sm text-muted-foreground">또는</span>
          <div className="flex-1 border-t" />
        </div>
        <GitHubSignIn />
        <GoogleSignIn />
        <p className="text-center text-sm text-muted-foreground">
          아이디가 없으신가요?{" "}
          <Link
            href={ROUTES.signUp}
            className="font-medium text-foreground underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
