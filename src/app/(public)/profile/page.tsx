import { signOutAction } from "@/app/(auth)/actions";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ProfileImageUploadForm } from "@/features/auth/components/profile-image-upload-form";
import { getAuthViewer } from "@/features/auth/lib/get-auth-viewer";

export default async function ProfilePage() {
  const viewer = await getAuthViewer();

  return (
    <PageContainer>
      <div className="mx-auto max-w-md flex flex-col gap-10">
        <section className="space-y-4 rounded-2xl border p-6">
          <h1 className="text-xl font-bold">내 프로필</h1>
          <div className="flex gap-3">
            <UserAvatar
              src={viewer.avatarUrl}
              alt="내 프로필 이미지"
              size={100}
            />
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">이름</p>
              <p className="font-medium">
                {viewer.displayName ?? "이름 미설정"}
              </p>
            </div>
          </div>

          <ProfileImageUploadForm />
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">이메일</dt>
              <dd className="font-medium">{viewer.email ?? "-"}</dd>
            </div>
          </dl>
        </section>
        <form action={signOutAction} className="w-full">
          <Button type="submit" size="sm" className="w-full h-10 rounded-xl ">
            로그아웃
          </Button>
        </form>
      </div>
    </PageContainer>
  );
}
