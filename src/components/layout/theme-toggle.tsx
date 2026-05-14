"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!mounted) {
    return (
      <Button
        aria-label="테마 변경"
        disabled
        size="icon-sm"
        type="button"
        variant="ghost"
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  return (
    <Button
      aria-label={isDark ? "라이트 모드로 변경" : "다크 모드로 변경"}
      size="icon-sm"
      title={isDark ? "라이트 모드로 변경" : "다크 모드로 변경"}
      type="button"
      variant="ghost"
      onClick={() => setTheme(nextTheme)}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
