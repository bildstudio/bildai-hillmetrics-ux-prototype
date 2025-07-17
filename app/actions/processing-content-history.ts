"use server";

import { createServerClient } from "@/lib/supabase-server-client";
import type { PostgrestError } from "@supabase/supabase-js";

export interface ContentStatusCount {
  status: string;
  count: number;
}

export interface ProcessingStats {
  inserted: number;
  updated: number;
  ignored: number;
  errors: number;
}

export async function getProcessingContentStatusCounts(
  processingId: number,
): Promise<{ data: ContentStatusCount[]; error: PostgrestError | null }> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("processing_content_history")
    .select("status")
    .eq("processingID", processingId);

  if (error) {
    return { data: [], error };
  }

  const counts: Record<string, number> = {};
  (data as { status: string }[]).forEach((row) => {
    counts[row.status] = (counts[row.status] || 0) + 1;
  });

  const statuses = ["Success", "Failed", "Currently processing"];

  const result = statuses.map((status) => ({
    status,
    count: counts[status] || 0,
  }));

  return { data: result, error: null };
}

export async function getProcessingStatistics(
  processingId: number,
): Promise<{ data: ProcessingStats; error: PostgrestError | null }> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("processing_content_history")
    .select("statistics")
    .eq("processingID", processingId);

  if (error) {
    return { data: { inserted: 0, updated: 0, ignored: 0, errors: 0 }, error };
  }

  let inserted = 0;
  let updated = 0;
  let ignored = 0;
  let errorsCount = 0;

  (data as { statistics: any }[]).forEach((row) => {
    const raw = row.statistics;
    if (!raw) return;
    try {
      const stats = typeof raw === "string" ? JSON.parse(raw) : raw;
      inserted += Number(stats.rowsInserted ?? stats.inserted ?? 0);
      updated += Number(stats.rowsUpdated ?? stats.updated ?? 0);
      ignored += Number(stats.rowsIgnored ?? stats.ignored ?? 0);
      errorsCount += Number(stats.errors ?? stats.rowsErrors ?? 0);
    } catch {
      // ignore parse errors
    }
  });

  return {
    data: {
      inserted,
      updated,
      ignored,
      errors: errorsCount,
    },
    error: null,
  };
}

export interface ProcessingItemDetail {
  contentID: number;
  contentName: string | null;
  status: string;
  statistics: any;
}

export interface ProcessingDetails {
  progress: number;
  processingTimeInSeconds: number | null;
  status: string;
  errorMessage: string | null;
  items: ProcessingItemDetail[];
}

export async function fetchProcessingDetails(
  processingId: number,
): Promise<{ data: ProcessingDetails | null; error: PostgrestError | null }> {
  const supabase = await createServerClient();

  const { data: procRow, error: procError } = await supabase
    .from("processinghistory")
    .select(
      "progress, processingTimeInSeconds, fetchingID, status, errorMessage",
    )
    .eq("processingID", processingId)
    .single();

  if (procError || !procRow) {
    return { data: null, error: procError };
  }

  const { data, error } = await supabase
    .from("processing_content_history")
    .select("contentID, status, statistics, content_items(contentName)")
    .eq("processingID", processingId);

  if (error) {
    return { data: null, error };
  }

  let items = (data as any[]).map((row) => ({
    contentID: row.contentID,
    contentName: row.content_items?.contentName ?? null,
    status: row.status,
    statistics: row.statistics,
  }));

  if (!items.length && procRow.status === "Currently processing") {
    const { data: pending, error: pendingError } = await supabase
      .from("fetched_contents_view")
      .select("contentID, contentName")
      .eq("fetchingID", procRow.fetchingID);

    if (!pendingError && Array.isArray(pending)) {
      items = pending.map((row) => ({
        contentID: row.contentID,
        contentName: row.contentName ?? null,
        status: "Currently processing",
        statistics: null,
      }));
    }
  }

  return {
    data: {
      progress: procRow.progress ?? 0,
      processingTimeInSeconds: procRow.processingTimeInSeconds ?? null,
      status: procRow.status,
      errorMessage: procRow.errorMessage ?? null,
      items,
    },
    error: null,
  };
}
