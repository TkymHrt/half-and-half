import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  createIssueRepository,
  createLogRepository,
} from "@/lib/repositories/client";
import type { Issue, LogEvent } from "@/types/app";

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
        const issueRepository = await createIssueRepository();
        const logRepository = await createLogRepository();

        const updated = await issueRepository.updateStatus(
          issue.id,
          nextStatus
        );

        if (!updated) {
          throw new Error("ISSUE_UPDATE_FAILED");
        }

        setIssues((prev) =>
          prev.map((entity) => (entity.id === updated.id ? updated : entity))
        );

        const createdLog = await logRepository.create({
          actor: "運営本部",
          type: "issue_status_changed",
          payload: {
            issueId: updated.id,
            itemId: updated.itemId,
            status: updated.status,
            summary: updated.summary,
            previousStatus: issue.status,
          },
        });

        appendLog(createdLog);

        toast.success(
          nextStatus === "resolved"
            ? "問題を解決済みとして記録しました"
            : "問題を対応中に戻しました"
        );
      } catch {
        setIssueActionError(
          "問題ステータスの更新に失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        setUpdatingIssueId(null);
      }
    },
    [appendLog, setIssues, updatingIssueId]
  );

  return {
    handleToggleIssueStatus,
    updatingIssueId,
    issueActionError,
  };
}
