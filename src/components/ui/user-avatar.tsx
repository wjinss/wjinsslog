"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export const DEFAULT_AVATAR_SRC = "/fallbackImage.webp";
const SUPABASE_HOSTNAME = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }
})();

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
}

export function UserAvatar({ src, alt, size = 32 }: UserAvatarProps) {
  const preferredSrc = useMemo(() => {
    if (!src) return DEFAULT_AVATAR_SRC;

    const normalized = src.trim();

    if (!normalized) {
      return DEFAULT_AVATAR_SRC;
    }

    if (normalized.startsWith("/")) {
      return normalized;
    }

    try {
      const parsed = new URL(normalized);
      if (SUPABASE_HOSTNAME && parsed.hostname === SUPABASE_HOSTNAME) {
        return normalized;
      }
    } catch {
      return DEFAULT_AVATAR_SRC;
    }

    return DEFAULT_AVATAR_SRC;
  }, [src]);

  const [imageSrc, setImageSrc] = useState(preferredSrc);

  useEffect(() => {
    setImageSrc(preferredSrc);
  }, [preferredSrc]);

  return (
    <span
      className="relative inline-flex overflow-hidden rounded-full border border-gray-400"
      style={{ width: size, height: size }}
    >
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => {
          if (imageSrc !== DEFAULT_AVATAR_SRC) {
            setImageSrc(DEFAULT_AVATAR_SRC);
          }
        }}
      />
    </span>
  );
}
