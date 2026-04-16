"use client";

import { FormProvider, useForm } from "react-hook-form";

import { createPostAction } from "@/app/(admin)/editor/new/actions";
import { Button } from "@/components/ui/button";
import { ImageFileUpload } from "@/components/ui/image-file-upload";
import { MarkdownEditor } from "@/features/posts/components/markdown-editor";
import { TagInput } from "@/features/posts/components/tag-input";
import type { NewPostFormValues } from "@/features/posts/types/new-post-form";

export function NewPostForm() {
  const formMethods = useForm<NewPostFormValues>({
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      contentMd: "",
      status: "draft",
      tags: "[]",
      tagInput: "",
    },
  });

  const { register } = formMethods;

  return (
    <FormProvider {...formMethods}>
      <form
        action={createPostAction}
        className="space-y-5"
        noValidate
      >
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
          <label htmlFor="slug" className="text-sm font-medium">
            슬러그 (선택)
          </label>
          <input
            id="slug"
            type="text"
            maxLength={150}
            placeholder="예: nextjs-supabase-guide"
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary"
            {...register("slug")}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            상태
          </label>
          <select
            id="status"
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary"
            {...register("status")}
          >
            <option value="draft">임시저장</option>
            <option value="published">출간하기</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="excerpt" className="text-sm font-medium">
            요약 (선택)
          </label>
          <textarea
            id="excerpt"
            rows={3}
            maxLength={500}
            placeholder="목록/미리보기에 노출할 요약을 입력해주세요"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
            {...register("excerpt")}
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

        <MarkdownEditor />

        <Button type="submit" className="h-10 w-full">
          포스트 저장
        </Button>
      </form>
    </FormProvider>
  );
}
