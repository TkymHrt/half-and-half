import { format } from "date-fns";
import type { Issue, LogEvent } from "@/types/app";
import {
  DATE_INPUT_SEGMENT_COUNT,
  END_OF_DAY_BOUNDARY,
  START_OF_DAY_BOUNDARY,
} from "./constants";
import type { IssueStats, ResolvedLogQuery } from "./types";

export function toIsoDateBoundary(value: string, mode: "start" | "end") {
  if (value.length === 0) {
    return;
  }

  const segments = value.split("-");
  if (segments.length !== DATE_INPUT_SEGMENT_COUNT) {
    return;
  }

  const [yearPart, monthPart, dayPart] = segments;
  const year = Number(yearPart);
  if (!Number.isInteger(year)) {
    return;
  }

  const month = Number(monthPart);
  if (!Number.isInteger(month)) {
    return;
  }

  const day = Number(dayPart);
  if (!Number.isInteger(day)) {
    return;
  }

  const boundary =
    mode === "start" ? START_OF_DAY_BOUNDARY : END_OF_DAY_BOUNDARY;

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      boundary.hour,
      boundary.minute,
      boundary.second,
      boundary.millisecond
    )
  );

  if (Number.isNaN(date.getTime())) {
    return;
  }

  if (date.getUTCFullYear() !== year) {
    return;
  }

  if (date.getUTCMonth() + 1 !== month) {
    return;
  }

  if (date.getUTCDate() !== day) {
    return;
  }

  return date.toISOString();
}

export function doesLogMatchFilters(log: LogEvent, query: ResolvedLogQuery) {
  if (query.type && log.type !== query.type) {
    return false;
  }

  const occurredTime = Date.parse(log.at);
  if (
    query.startTime !== undefined &&
    Number.isFinite(occurredTime) &&
    occurredTime < query.startTime
  ) {
    return false;
  }

  if (
    query.endTime !== undefined &&
    Number.isFinite(occurredTime) &&
    occurredTime > query.endTime
  ) {
    return false;
  }

  if (!query.keyword) {
    return true;
  }

  const candidateTexts = [log.actor, log.id, JSON.stringify(log.payload)];
  for (const text of candidateTexts) {
    if (text.length === 0) {
      continue;
    }

    if (text.toLowerCase().includes(query.keyword)) {
      return true;
    }
  }

  return false;
}

export function formatIssueDate(value: string) {
  try {
    return format(new Date(value), "yyyy/MM/dd HH:mm");
  } catch {
    return value;
  }
}

export function buildIssueStats(source: Issue[]): IssueStats {
  let openCount = 0;
  let resolvedCount = 0;

  for (const issue of source) {
    if (issue.status === "open") {
      openCount += 1;
      continue;
    }
    resolvedCount += 1;
  }

  return {
    total: source.length,
    open: openCount,
    resolved: resolvedCount,
  } satisfies IssueStats;
}
