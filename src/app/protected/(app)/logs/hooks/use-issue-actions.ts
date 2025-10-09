import { useCallback, useState } from "react";
import { toast } from "sonner";
import { IssueRepository } from "@/lib/mock/repositories/issues";
import { LogRepository } from "@/lib/mock/repositories/logs";
import type { Issue, LogEvent } from "@/types/app";
import { LOG_ID_RADIX } from "../constants";

export function useIssueActions(
  appendLog: (log: LogEvent) => void,
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>
) {
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);
  const [issueActionError, setIssueActionError] = useState<string | null>(null);

  const handleToggleIssueStatus = useCallback(
    async (issue: Issue) => {
      if (updatingIssueId && updatingIssueId !== issue.id) {
        return;
      }

      const nextStatus = issue.status === "open" ? "resolved" : "open";
      setUpdatingIssueId(issue.id);
      setIssueActionError(null);

      try {
        const updated = await IssueRepository.update(issue.id, {
          status: nextStatus,
        });

        if (!updated) {
          throw new Error("ISSUE_UPDATE_FAILED");
        }

        setIssues((prev) =>
          prev.map((entity) => (entity.id === updated.id ? updated : entity))
        );

        const logEvent: LogEvent = {
          id: `log-${Date.now().toString(LOG_ID_RADIX)}`,
          at: new Date().toISOString(),
          actor: "運営本部",
          type: "issue_status_changed",
          payload: {
            issueId: updated.id,
            itemId: updated.itemId,
            status: updated.status,
            summary: updated.summary,
            previousStatus: issue.status,
          },
        } satisfies LogEvent;

        await LogRepository.add(logEvent);
        appendLog(logEvent);

        toast.success(
          nextStatus === "resolved"
            ? "問題を解決済みとして記録しました"
            : "問題を対応中に戻しました"
        );
      } catch {
        setIssueActionError(
          "問題のステータス更新に失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        setUpdatingIssueId(null);
      }
    },
    [appendLog, setIssues, updatingIssueId]
  );

  return {
    updatingIssueId,
    issueActionError,
    handleToggleIssueStatus,
  } as const;
}
