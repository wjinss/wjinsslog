import { Button } from "@base-ui/react";
import Image from "next/image";

import { signInWithGitHubAction } from "@/app/(auth)/actions";
import gitHubLogo from "@/assets/github-mark.svg";

export default function GitHubSignIn() {
  return (
    <form action={signInWithGitHubAction}>
      <Button
        type="submit"
        className="inline-flex h-10 w-full items-center rounded-[min(var(--radius-md),10px)] justify-center gap-2 border px-4 text-sm font-medium"
      >
        <Image src={gitHubLogo} alt="" width={16} height={16} />
        깃허브로 로그인
      </Button>
    </form>
  );
}
