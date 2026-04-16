"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface ImageFilePickerProps {
  id: string;
  name: string;
  buttonLabel: string;
  hintText?: string;
  accept?: string;
  required?: boolean;
  autoSubmitOnSelect?: boolean;
  showImagePreview?: boolean;
  onFileSelected?: (file: File | null) => void;
}

const DEFAULT_ACCEPT = "image/png,image/jpeg,image/webp,image/avif";

export function ImageFileUpload({
  id,
  name,
  buttonLabel,
  accept = DEFAULT_ACCEPT,
  required = false,
  autoSubmitOnSelect = false,
  showImagePreview = false,
  onFileSelected,
}: ImageFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  const handleFileChange = () => {
    const file = inputRef.current?.files?.[0] ?? null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (showImagePreview && file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    onFileSelected?.(file);

    if (autoSubmitOnSelect && file) {
      inputRef.current?.form?.requestSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required}
        className="sr-only"
        onChange={handleFileChange}
      />

      {showImagePreview && previewUrl ? (
        <div className="overflow-hidden rounded-lg border bg-muted/30">
          <Image
            src={previewUrl}
            alt="선택한 썸네일 미리보기"
            width={960}
            height={540}
            unoptimized
            className="h-44 w-full object-cover"
          />
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openFileDialog}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}
