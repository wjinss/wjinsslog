"use client";

import type { ChangeEvent, CompositionEvent, KeyboardEvent } from "react";
import { useEffect, useId, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { useTagInputStore } from "@/features/posts/stores/use-tag-input-store";
import type { NewPostFormValues } from "@/features/posts/types/new-post-form";

type TagInputProps = {
  name?: "tags";
  inputName?: "tagInput";
  id?: string;
  label?: string;
  placeholder?: string;
  maxTags?: number;
  caseSensitiveDuplicate?: boolean;
};

function readIsComposing(nativeEvent: Event): boolean {
  if (!("isComposing" in nativeEvent)) {
    return false;
  }

  const value = (nativeEvent as Event & { isComposing?: unknown }).isComposing;
  return typeof value === "boolean" ? value : false;
}

export function TagInput({
  name = "tags",
  inputName = "tagInput",
  id,
  label = "태그",
  placeholder = "태그를 입력하세요",
  maxTags,
  caseSensitiveDuplicate = false,
}: TagInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [isComposing, setIsComposing] = useState(false);

  const { control, setValue } = useFormContext<NewPostFormValues>();
  const tags = useTagInputStore((state) => state.tags);
  const addTagToStore = useTagInputStore((state) => state.addTag);
  const removeTagFromStore = useTagInputStore((state) => state.removeTag);

  useEffect(() => {
    setValue(name, "[]");
    setValue(inputName, "");
  }, [inputName, name, setValue]);

  useEffect(() => {
    setValue(name, JSON.stringify(tags));
  }, [name, setValue, tags]);

  const addTag = (rawValue: string) => {
    addTagToStore(rawValue, {
      caseSensitiveDuplicate,
      maxTags,
    });
  };

  const removeTag = (tagToRemove: string) => {
    removeTagFromStore(tagToRemove);
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
    setInputValue: (value: string) => void,
  ) => {
    const nextValue = event.target.value;

    if (!nextValue.includes(",")) {
      setInputValue(nextValue);
      return;
    }

    const parts = nextValue.split(",");
    const pendingValue = parts.pop() ?? "";

    for (const part of parts) {
      addTag(part);
    }

    setInputValue(pendingValue);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    inputValue: string,
    setInputValue: (value: string) => void,
  ) => {
    if (isComposing || readIsComposing(event.nativeEvent)) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      addTag(inputValue);
      setInputValue("");
      return;
    }

    if (event.key === "Backspace" && inputValue.length === 0) {
      event.preventDefault();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (
    event: CompositionEvent<HTMLInputElement>,
    setInputValue: (value: string) => void,
  ) => {
    setIsComposing(false);

    const nextValue = event.currentTarget.value;
    if (!nextValue.includes(",")) {
      return;
    }

    const parts = nextValue.split(",");
    const pendingValue = parts.pop() ?? "";

    for (const part of parts) {
      addTag(part);
    }

    setInputValue(pendingValue);
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>

      <Controller
        name={inputName}
        control={control}
        render={({ field }) => (
          <input
            ref={field.ref}
            id={inputId}
            name={field.name}
            type="text"
            value={typeof field.value === "string" ? field.value : ""}
            placeholder={placeholder}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary"
            onBlur={field.onBlur}
            onChange={(event) => {
              if (isComposing || readIsComposing(event.nativeEvent)) {
                field.onChange(event.target.value);
                return;
              }

              handleChange(event, field.onChange);
            }}
            onKeyDown={(event) => {
              const inputValue =
                typeof field.value === "string" ? field.value : "";
              handleKeyDown(event, inputValue, field.onChange);
            }}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={(event) => {
              handleCompositionEnd(event, field.onChange);
            }}
          />
        )}
      />

      <input type="hidden" name={name} value={JSON.stringify(tags)} readOnly />

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-live="polite">
          {tags.map((tag) => (
            <li key={tag} className="m-0 p-0">
              <button
                type="button"
                aria-label={`${tag} 태그 삭제`}
                onClick={() => removeTag(tag)}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs transition hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>{tag}</span>
                <span
                  aria-hidden="true"
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  x
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-xs text-muted-foreground ml-1">
        쉼표(,) 또는 Enter로 태그를 등록할 수 있으며, 등록된 태그를 클릭하면
        삭제됩니다.
      </p>
    </div>
  );
}
