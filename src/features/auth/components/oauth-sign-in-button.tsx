import { Button } from "@base-ui/react";
import Image, { type StaticImageData } from "next/image";

interface OAuthSignInButtonProps {
  action: () => Promise<void>;
  icon: StaticImageData;
  label: string;
  iconSize?: number;
}

export function OAuthSignInButton({
  action,
  icon,
  label,
  iconSize = 16,
}: OAuthSignInButtonProps) {
  return (
    <form action={action}>
      <Button
        type="submit"
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[min(var(--radius-md),10px)] border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Image src={icon} alt="" width={iconSize} height={iconSize} />
        {label}
      </Button>
    </form>
  );
}
