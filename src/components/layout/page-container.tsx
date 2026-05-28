import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-2xl px-4 py-8 md:px-6", className)}
    >
      {children}
    </div>
  );
}
