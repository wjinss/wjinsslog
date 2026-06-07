"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deletePostAction,
  type DeletePostErrorCode,
} from "@/features/posts/actions/delete-post";

interface DeletePostButtonProps {
  postId: string;
  slug: string;
  title: string;
}

const DELETE_ERROR_MESSAGES: Record<DeletePostErrorCode, string> = {
  missing_identifier: "삭제할 포스트 정보를 찾지 못했습니다.",
  post_not_found: "이미 삭제되었거나 존재하지 않는 포스트입니다.",
  soft_delete_column_missing:
    "posts 테이블에 deleted_at 컬럼이 없어 삭제 처리할 수 없습니다.",
  delete_failed: "포스트를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

export function DeletePostButton({
  postId,
  slug,
  title,
}: DeletePostButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDeleteClick() {
    if (isPending) {
      return;
    }

    const confirmed = window.confirm(
      `포스트를 정말 삭제하시겠습니까?\n삭제 후 메인 페이지로 이동합니다.`,
    );

    if (!confirmed) {
      return;
    }

    const formData = new FormData();
    formData.set("postId", postId);
    formData.set("slug", slug);

    startTransition(() => {
      void (async () => {
        try {
          const result = await deletePostAction(formData);
          window.alert(DELETE_ERROR_MESSAGES[result.errorCode]);
        } catch (error: unknown) {
          console.error("[DeletePostButton] delete failed", error);
          window.alert("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      })();
    });
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDeleteClick}
      disabled={isPending}
      aria-busy={isPending}
      aria-label={`${title} 삭제하기`}
    >
      <Trash2 aria-hidden="true" />
      {isPending ? "삭제 중" : "삭제"}
    </Button>
  );
}
