"use client";

import { FormProvider, useForm } from "react-hook-form";

import { createPostAction } from "@/app/(admin)/editor/new/actions";
import { Button } from "@/components/ui/button";
import { ImageFileUpload } from "@/components/ui/image-file-upload";
import { TagInput } from "@/features/posts/components/tag-input";
import type { NewPostFormValues } from "@/features/posts/types/new-post-form";

export function NewPostForm() {
  const formMethods = useForm<NewPostFormValues>({
    defaultValues: {
      title: "",
      bodyMarkdown: "",
      tags: "[]",
      tagInput: "",
    },
  });

  const { register } = formMethods;

  return (
    <FormProvider {...formMethods}>
      <form action={createPostAction} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium">
            제목
          </label>
          <input
            id="title"
            type="text"
            required
            maxLength={150}
            placeholder="제목을 입력해주세요"
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary"
            {...register("title")}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="thumbnailFile" className="text-sm font-medium">
            썸네일 이미지
          </label>
          <ImageFileUpload
            id="thumbnailFile"
            name="thumbnailFile"
            buttonLabel="썸네일 이미지 선택"
            hintText="PNG/JPG/WEBP/AVIF, 최대 5MB"
            showImagePreview
          />
        </div>

        <TagInput
          name="tags"
          label="태그"
          placeholder="태그를 입력하세요"
          inputName="tagInput"
        />

        <div className="space-y-1.5">
          <label htmlFor="bodyMarkdown" className="text-sm font-medium">
            본문 (Markdown)
          </label>
          <textarea
            id="bodyMarkdown"
            required
            rows={16}
            placeholder="오늘의 포스팅을 작성해주세요"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
            {...register("bodyMarkdown")}
          />
        </div>

        <Button type="submit" className="h-10 w-full">
          포스트 저장
        </Button>
      </form>
    </FormProvider>
  );
}
