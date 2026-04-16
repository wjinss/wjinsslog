"use client";

import { updateProfileImageAction } from "@/app/(auth)/actions";
import { ImageFileUpload } from "@/components/ui/image-file-upload";

export function ProfileImageUploadForm() {
  return (
    <form action={updateProfileImageAction} className="space-y-2">
      <ImageFileUpload
        id="avatarFile"
        name="avatarFile"
        buttonLabel="프로필 이미지 변경"
        autoSubmitOnSelect
      />
    </form>
  );
}
