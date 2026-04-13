import { signInWithGoogleAction } from "@/app/(auth)/actions";
import googleLogo from "@/assets/google-mark.svg";
import { OAuthSignInButton } from "@/features/auth/components/oauth-sign-in-button";

export default function GoogleSignIn() {
  return (
    <OAuthSignInButton
      action={signInWithGoogleAction}
      icon={googleLogo}
      label="Google 로그인"
      iconSize={20}
    />
  );
}
