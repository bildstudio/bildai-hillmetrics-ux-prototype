"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProcessingDetails as Details } from "@/app/actions/processing-content-history";

interface ProcessingDetailsProps {
  processingId: number;
  onPreview: (file: { id: string; name: string }) => void;
  onComplete?: () => void;
  hideHeader?: boolean;
}

export default function ProcessingDetails({
  processingId,
  onPreview,
  onComplete,
  hideHeader = false,
}: ProcessingDetailsProps) {
  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [maxLabelWidth, setMaxLabelWidth] = useState(0);
  const [dynamicProgress, setDynamicProgress] = useState<Record<number, number>>({});
  const [elapsedTime, setElapsedTime] = useState<Record<number, number>>({});
  const [ellipsisStep, setEllipsisStep] = useState(0);
  const [showSegments, setShowSegments] = useState<Record<number, boolean>>({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(
        `/api/processing-content-history/details?processingId=${processingId}`,
      );
      const json = await res.json();
      if (!json.error) setDetails(json.data);
      setLoading(false);
    };
    load();
  }, [processingId]);

  useEffect(() => {
    if (!details) return;
    const width = Math.max(
      0,
      ...labelRefs.current.map((el) => el?.offsetWidth || 0),
    );
    setMaxLabelWidth(width);
  }, [details]);

  useEffect(() => {
    if (!details) return;
    const items = details.items.length ? details.items : [];
    const prog: Record<number, number> = {};
    const time: Record<number, number> = {};
    items.forEach((item) => {
      if (item.status === "Currently processing") {
        prog[item.contentID] = 0;
        time[item.contentID] = 0;
      }
    });
    setDynamicProgress(prog);
    setElapsedTime(time);
  }, [details]);

  useEffect(() => {
    if (!details) return;
    const interval = setInterval(() => {
      if (completed) return;
      setDynamicProgress((prev) => {
        const next = { ...prev };
        let didComplete = false;
        details.items.forEach((item) => {
          if (item.status === "Currently processing") {
            const id = item.contentID;
            const current = next[id] ?? 0;
            const updated = current >= 100 ? 100 : current + 2;
            next[id] = updated;
            if (updated >= 100 && current < 100) {
              didComplete = true;
            }
          }
        });
        if (didComplete) {
          setCompleted(true);
          onComplete?.();
        }
        return next;
      });
      setElapsedTime((prev) => {
        const next = { ...prev };
        details.items.forEach((item) => {
          if (item.status === "Currently processing") {
            const id = item.contentID;
            const curr = next[id] ?? 0;
            if ((dynamicProgress[id] ?? 0) < 100) {
              next[id] = curr + 1;
            } else {
              next[id] = curr;
            }
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [details, completed]);

  useEffect(() => {
    const elInterval = setInterval(() => {
      setEllipsisStep((e) => (e + 1) % 3);
    }, 250);
    return () => clearInterval(elInterval);
  }, []);

  useEffect(() => {
    const updated: Record<number, boolean> = {};
    Object.entries(dynamicProgress).forEach(([id, val]) => {
      const num = Number(id);
      if (val >= 100) updated[num] = true;
    });
    if (Object.keys(updated).length) {
      setShowSegments((prev) => ({ ...prev, ...updated }));
    }
  }, [dynamicProgress]);

  const distributeProgress = (total: number, count: number) => {
    if (count === 0) return [];
    const randoms = Array.from(
      { length: count },
      () => 0.9 + Math.random() * 0.2,
    );
    const sum = randoms.reduce((a, b) => a + b, 0);
    const raw = randoms.map((r) => Math.round((r / sum) * total));
    const diff = total - raw.reduce((a, b) => a + b, 0);
    raw[raw.length - 1] += diff;
    return raw;
  };

  const getRunningStatus = (progress: number) => {
    const dots = ".".repeat(ellipsisStep + 1);
    if (progress >= 100) return "Success – Final result of the processing.";
    if (progress >= 95) return "Completed – Step finished successfully.";
    if (progress >= 40) return `InProgress – Current step running${dots}`;
    if (progress >= 5) return `Processing – Data processing underway${dots}`;
    return `Created – Workflow initialized${dots}`;
  };

  const progressParts = useMemo(() => {
    if (!details) return [];
    return distributeProgress(
      Math.round(details.progress || 0),
      details.items.length,
    );
  }, [details]);


  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl p-6 shadow h-[200px] flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (!details) {
    return null;
  }

  const totalMinutes = (details.processingTimeInSeconds ?? 0) / 60;
  const totalSeconds = details.processingTimeInSeconds ?? 0;
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const minPart = mins > 0 ? `${mins} min` : "";
    const secPart = `${secs} sec`;
    return minPart ? `${minPart} ${secPart}` : secPart;
  };

  const statusColor = (status: string, dynamicComplete: boolean) => {
    if (dynamicComplete) return "#10B981";
    switch (status) {
      case "Success":
        return "#10B981";
      case "Currently processing":
        return "#3B82F6";
      case "Failed":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const statusLabel = (status: string, dynamicComplete: boolean) => {
    if (dynamicComplete) return "Success";
    return status === "Currently processing" ? "In progress" : status;
  };

  return (
    <div className="w-full bg-white rounded-xl p-6 shadow">
      {!hideHeader && (
        <div className="space-y-1 mb-4">
          <h3 className="text-lg font-bold">Processing details</h3>
          <p className="text-sm text-gray-500">
            Instant progress overview for every content item.
          </p>
        </div>
      )}
      <div className="space-y-2">
        {details.items.map((item, idx) => {
          const baseProg = item.status === "Success" ? 100 : progressParts[idx] || 0;
          const dynamicProg = dynamicProgress[item.contentID] ?? 0;
          const itemProg =
            item.status === "Currently processing" ? dynamicProg : baseProg;
          const durationStr = formatDuration(
            Math.floor(elapsedTime[item.contentID] ?? 0),
          );

          const stats = item.statistics
            ? typeof item.statistics === "string"
              ? JSON.parse(item.statistics)
              : item.statistics
            : {};
          const inserted = Number(stats.inserted ?? stats.rowsInserted ?? 0);
          const updated = Number(stats.updated ?? stats.rowsUpdated ?? 0);
          const ignored = Number(stats.ignored ?? stats.rowsIgnored ?? 0);
          const errors = Number(stats.errors ?? stats.rowsErrors ?? 0);
          const hasStats = inserted + updated + ignored + errors > 0;
          const totalRows = hasStats ? inserted + updated + ignored + errors : 1;
          const segments = hasStats
            ? [
                { label: "Inserted", value: inserted, color: "#34D399" },
                { label: "Updated", value: updated, color: "#FBBF24" },
                { label: "Ignored", value: ignored, color: "#9CA3AF" },
                { label: "Errors", value: errors, color: "#EF4444" },
              ]
            : [{ label: "Progress", value: 1, color: "#3B82F6" }];
          const isDynamicComplete =
            item.status === "Currently processing" && showSegments[item.contentID];
          const isSuccess = item.status === "Success" || isDynamicComplete;
          const isError = item.status === "Failed";
          const barColor =
            isSuccess ? "bg-green-500" : isError ? "bg-gray-300" : "bg-blue-500";

          return (
            <div
              key={item.contentID}
              tabIndex={0}
              onClick={() =>
                onPreview({
                  id: String(item.contentID),
                  name: item.contentName || String(item.contentID),
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onPreview({
                    id: String(item.contentID),
                    name: item.contentName || String(item.contentID),
                  });
                }
              }}
              className="p-2 rounded hover:bg-gray-50 focus:bg-gray-50 outline-none"
            >
              <div className="text-sm font-medium mb-1">
                Content ID: {item.contentID} – {item.contentName || "Unknown"} –
                Processing duration: {durationStr}
              </div>
              <div className="flex items-center gap-2">
                <span
                  ref={(el) => (labelRefs.current[idx] = el)}
                  className="text-xs font-semibold inline-block"
                  style={{
                    color: statusColor(item.status, isDynamicComplete),
                    width: maxLabelWidth ? `${maxLabelWidth}px` : undefined,
                  }}
                >
                  {statusLabel(item.status, isDynamicComplete)}
                  {errors > 0 && <span className="ml-1 text-red-600">❗</span>}
                </span>
                <TooltipProvider>
                  <Tooltip>
                  <TooltipTrigger asChild>
                    {item.status === "Currently processing" ? (
                      <div className="flex-1 h-6 rounded bg-muted overflow-hidden flex cursor-pointer relative">
                        <div
                          className={`absolute inset-0 ${barColor} flex items-center justify-center text-white text-xs transition-all duration-500 ${isDynamicComplete ? 'opacity-0' : 'opacity-100'}`}
                          style={{ width: `${itemProg}%` }}
                        >
                          {`${Math.round(itemProg)}%`}
                        </div>
                        <div
                          className={`absolute inset-0 flex transition-all duration-500 ${isDynamicComplete ? 'opacity-100' : 'opacity-0'}`}
                          style={{ width: `${itemProg}%` }}
                        >
                          {segments.map((seg) => {
                            const pct = Math.round((seg.value / totalRows) * 100);
                            const segWidth = (pct * itemProg) / 100;
                            return (
                              <div
                                key={seg.label}
                                style={{
                                  width: `${segWidth}%`,
                                  backgroundColor: seg.color,
                                }}
                                className="h-full flex items-center justify-center text-white text-xs"
                              >
                                {segWidth >= 10 ? `${Math.round(segWidth)}%` : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 h-6 rounded bg-muted overflow-hidden flex cursor-pointer relative">
                        <div
                          className="absolute inset-0 flex"
                          style={{ width: `${itemProg}%` }}
                        >
                          {segments.map((seg) => {
                            const pct = Math.round((seg.value / totalRows) * 100);
                            const segWidth = (pct * itemProg) / 100;
                            return (
                              <div
                                key={seg.label}
                                style={{
                                  width: `${segWidth}%`,
                                  backgroundColor: seg.color,
                                }}
                                className="h-full flex items-center justify-center text-white text-xs"
                              >
                                {segWidth >= 10 ? `${Math.round(segWidth)}%` : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1">
                          <span
                            className="inline-block w-3 h-3 rounded-sm"
                            style={{ backgroundColor: "#34D399" }}
                          />
                          Inserted: {inserted}
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className="inline-block w-3 h-3 rounded-sm"
                            style={{ backgroundColor: "#FBBF24" }}
                          />
                          Updated: {updated}
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className="inline-block w-3 h-3 rounded-sm"
                            style={{ backgroundColor: "#9CA3AF" }}
                          />
                          Ignored: {ignored}
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className="inline-block w-3 h-3 rounded-sm"
                            style={{ backgroundColor: "#EF4444" }}
                          />
                          Errors: {errors}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {item.status === "Currently processing" && (
                <div className="text-xs text-gray-500 mt-1">
                  {getRunningStatus(dynamicProg)}
                </div>
              )}
              {details.status === "Failed" &&
                item.status === "Failed" &&
                details.errorMessage && (
                  <div className="text-xs text-red-600 mt-1">
                    {details.errorMessage}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
