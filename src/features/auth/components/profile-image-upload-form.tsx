"use client";

import { useRef } from "react";

import { updateProfileImageAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function ProfileImageUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  const handleFileChange = () => {
    const input = inputRef.current;
    if (!input?.files?.length) {
      return;
    }

    formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} action={updateProfileImageAction} className="space-y-2">
      <input
        ref={inputRef}
        id="avatarFile"
        name="avatarFile"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="sr-only"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openFileDialog}
      >
        프로필 이미지 변경
      </Button>
    </form>
  );
}
