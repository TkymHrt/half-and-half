'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListTodo, Map, ListChecks } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const tabs = [
    { href: '/protected/home', label: 'ホーム', icon: Home },
    { href: '/protected/tasks', label: 'タスク', icon: ListTodo },
    { href: '/protected/map', label: 'マップ', icon: Map },
    { href: '/protected/logs', label: 'ログ', icon: ListChecks },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur-sm">
      <ul className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon size={20} />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}