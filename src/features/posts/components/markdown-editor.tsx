"use client";

import "@toast-ui/editor/dist/toastui-editor.css";

import type Editor from "@toast-ui/editor";
import { useCallback, useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  uploadPostContentImage,
  type UploadPostContentImageParams,
} from "@/features/posts/lib/upload-post-content-image";
import type { NewPostFormValues } from "@/features/posts/types/new-post-form";

interface MarkdownEditorProps {
  name?: "contentMd";
  label?: string;
  placeholder?: string;
  height?: string;
  postId?: UploadPostContentImageParams["postId"];
}

const DEFAULT_ALT_TEXT = "uploaded image";

type AddImageBlobHook = (
  blob: Blob | File,
  callback: (url: string, altText: string) => void,
) => Promise<void>;

export function MarkdownEditor({
  name = "contentMd",
  label = "본문 (Markdown)",
  placeholder = "오늘의 포스팅을 작성해주세요",
  height = "520px",
  postId,
}: MarkdownEditorProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const initialValueRef = useRef<string>("");

  const { control, setValue } = useFormContext<NewPostFormValues>();
  const contentMd = useWatch({ control, name });

  if (initialValueRef.current.length === 0 && typeof contentMd === "string") {
    initialValueRef.current = contentMd;
  }

  const syncMarkdownFromEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const markdown = editor.getMarkdown();
    setValue(name, markdown, {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [name, setValue]);

  const handleInsertMarkdownImage = useCallback<AddImageBlobHook>(
    async (blob, callback) => {
      try {
        const file =
          blob instanceof File
            ? blob
            : new File([blob], `image-${Date.now()}.png`, {
                type: blob.type || "image/png",
              });

        const { publicUrl } = await uploadPostContentImage({
          file,
          postId,
        });

        callback(publicUrl, DEFAULT_ALT_TEXT);

        setTimeout(() => {
          syncMarkdownFromEditor();
        }, 0);
      } catch (error) {
        console.error("[MarkdownEditor] failed to insert uploaded image", {
          error,
        });
      }
    },
    [postId, syncMarkdownFromEditor],
  );

  useEffect(() => {
    let isUnmounted = false;

    const initializeEditor = async () => {
      if (!rootRef.current) {
        return;
      }

      const { default: ToastEditor } = await import("@toast-ui/editor");

      if (isUnmounted || !rootRef.current) {
        return;
      }

      const editor = new ToastEditor({
        el: rootRef.current,
        initialEditType: "markdown",
        previewStyle: "vertical",
        height,
        initialValue: initialValueRef.current,
        placeholder,
        hooks: {
          addImageBlobHook: handleInsertMarkdownImage,
        },
      });

      editor.on("change", syncMarkdownFromEditor);
      editorRef.current = editor;
      syncMarkdownFromEditor();
    };

    initializeEditor().catch((error) => {
      console.error("[MarkdownEditor] failed to initialize editor", { error });
    });

    return () => {
      isUnmounted = true;

      if (editorRef.current) {
        editorRef.current.off("change", syncMarkdownFromEditor);
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [handleInsertMarkdownImage, height, placeholder, syncMarkdownFromEditor]);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="overflow-hidden rounded-lg border bg-background">
        <div ref={rootRef} />
      </div>
      <input
        type="hidden"
        name={name}
        value={typeof contentMd === "string" ? contentMd : ""}
        readOnly
      />
    </div>
  );
}
