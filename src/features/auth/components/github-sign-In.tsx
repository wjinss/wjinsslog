import { signInWithGitHubAction } from "@/app/(auth)/actions";
import gitHubLogo from "@/assets/github-mark.svg";
import { OAuthSignInButton } from "@/features/auth/components/oauth-sign-in-button";

export default function GitHubSignIn() {
  return (
    <OAuthSignInButton
      action={signInWithGitHubAction}
      icon={gitHubLogo}
      label="GitHub 로그인"
      iconSize={16}
    />
  );
}
