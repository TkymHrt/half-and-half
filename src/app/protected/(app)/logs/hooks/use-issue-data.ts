import { useMemo } from "react";
import type { Issue, Item } from "@/types/app";
import type { IssueListEntry } from "../types";
import { buildIssueStats } from "../utils";

export function useIssueData(issues: Issue[], itemsById: Map<string, Item>) {
  const issueStats = useMemo(() => buildIssueStats(issues), [issues]);

  const issueEntries = useMemo<IssueListEntry[]>(() => {
    if (issues.length === 0) {
      return [];
    }

    return issues
      .slice()
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "open" ? -1 : 1;
        }
        return a.at < b.at ? 1 : -1;
      })
      .map((issue) => ({
        issue,
        item: issue.itemId ? itemsById.get(issue.itemId) : undefined,
      }));
  }, [issues, itemsById]);

  return { issueStats, issueEntries } as const;
}
