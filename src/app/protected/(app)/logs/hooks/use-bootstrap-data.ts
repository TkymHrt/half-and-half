import { useEffect, useState } from "react";
import { ensureSeed } from "@/lib/mock";
import { IssueRepository } from "@/lib/mock/repositories/issues";
import { ItemRepository } from "@/lib/mock/repositories/items";
import { TaskRepository } from "@/lib/mock/repositories/tasks";
import type { Issue, Item, Task } from "@/types/app";

export function useBootstrapData() {
  const [items, setItems] = useState<Item[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isBootstrapLoading, setIsBootstrapLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function bootstrap() {
      setIsBootstrapLoading(true);
      setBootstrapError(null);

      try {
        await ensureSeed();
        const [itemList, taskList, issueList] = await Promise.all([
          ItemRepository.list(),
          TaskRepository.list(),
          IssueRepository.list(),
        ]);

        if (!isActive) {
          return;
        }

        setItems(itemList);
        setTasks(taskList);
        setIssues(issueList);
      } catch {
        if (!isActive) {
          return;
        }

        setBootstrapError(
          "データの読み込みに失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        if (isActive) {
          setIsBootstrapLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    items,
    tasks,
    issues,
    setIssues,
    isBootstrapLoading,
    bootstrapError,
  } as const;
}
