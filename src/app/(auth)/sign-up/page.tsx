import { PageContainer } from "@/components/layout/page-container";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export default function SignUpPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-md space-y-5 rounded-2xl border p-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">회원가입</h1>
        </header>
        <SignUpForm />
      </div>
    </PageContainer>
  );
}
