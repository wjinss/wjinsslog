"use client";

import { FormProvider, useForm } from "react-hook-form";

import { updatePostAction } from "@/app/edit/[slug]/actions";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/features/posts/components/markdown-editor";

interface EditablePostFormPost {
  slug: string;
  title: string;
  contentMd: string;
  thumbnailUrl: string;
}

interface EditPostFormValues {
  title: string;
  contentMd: string;
  thumbnailUrl: string;
}

interface EditPostFormProps {
  post: EditablePostFormPost;
}

export function EditPostForm({ post }: EditPostFormProps) {
  const formMethods = useForm<EditPostFormValues>({
    defaultValues: {
      title: post.title,
      contentMd: post.contentMd,
      thumbnailUrl: post.thumbnailUrl,
    },
  });

  const { register } = formMethods;

  return (
    <FormProvider {...formMethods}>
      <form action={updatePostAction} className="space-y-5" noValidate>
        <input type="hidden" name="slug" value={post.slug} />

        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium">
            제목
          </label>
          <input
            id="title"
            type="text"
            required
            maxLength={150}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-ring/50"
            {...register("title")}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="thumbnailUrl" className="text-sm font-medium">
            썸네일 URL
          </label>
          <input
            id="thumbnailUrl"
            type="url"
            placeholder="https://example.com/thumbnail.png"
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-ring/50"
            {...register("thumbnailUrl")}
          />
        </div>

        <MarkdownEditor
          label="본문"
          placeholder="수정할 본문을 입력해주세요"
        />

        <Button type="submit" className="h-10 w-full">
          수정 완료
        </Button>
      </form>
    </FormProvider>
  );
}
