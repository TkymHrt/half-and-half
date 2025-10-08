import { useMemo } from "react";
import type { Issue } from "@/types/app";

const PERCENTAGE_MULTIPLIER = 100;

export function useIssueData(issues: Issue[]) {
  const openIssues = useMemo(
    () => issues.filter((issue) => issue.status === "open"),
    [issues]
  );

  const resolvedIssues = useMemo(
    () => issues.filter((issue) => issue.status === "resolved"),
    [issues]
  );

  const issueStats = useMemo(
    () => ({
      total: issues.length,
      open: openIssues.length,
      resolved: resolvedIssues.length,
      resolvedRate:
        issues.length > 0
          ? (resolvedIssues.length / issues.length) * PERCENTAGE_MULTIPLIER
          : 0,
    }),
    [issues.length, openIssues.length, resolvedIssues.length]
  );

  return {
    openIssues,
    resolvedIssues,
    issueStats,
  };
}
