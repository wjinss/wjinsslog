import { PageContainer } from "@/components/layout/page-container";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export default function SignInPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-md space-y-5 rounded-2xl border p-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">로그인</h1>
        </header>
        <SignInForm />
      </div>
    </PageContainer>
  );
}
