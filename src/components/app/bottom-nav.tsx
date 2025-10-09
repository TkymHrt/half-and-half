"use client";

import type { LucideIcon } from "lucide-react";
import { Home, ListTodo, Map as MapIcon, NotebookPen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type BottomNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const NAV_ITEMS: BottomNavItem[] = [
  {
    href: "/protected/home",
    label: "ホーム",
    icon: Home,
  },
  {
    href: "/protected/tasks",
    label: "タスク",
    icon: ListTodo,
  },
  {
    href: "/protected/map",
    label: "マップ",
    icon: MapIcon,
  },
  {
    href: "/protected/logs",
    label: "ログ",
    icon: NotebookPen,
  },
];

export function BottomNav({ items = NAV_ITEMS }: { items?: BottomNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="主要画面のナビゲーション"
      className="fixed inset-x-0 bottom-0 z-40 border-border/80 border-t bg-background/90 backdrop-blur"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li className="contents" key={item.href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 font-medium text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                href={item.href}
              >
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-full"
                >
                  <Icon
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.75}
                  />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
