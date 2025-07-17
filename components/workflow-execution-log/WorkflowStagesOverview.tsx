"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import FetchingDetails from "../fetching-history/FetchingDetails";
import ProcessingDetails from "../processing-history/ProcessingDetails";
import type { StageStatusResult } from "@/app/actions/workflow-stage-statuses";
import type { WorkflowExecutionLogData } from "@/app/actions/workflow-execution-log";
import { RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";

interface WorkflowStagesOverviewProps {
  item: WorkflowExecutionLogData;
  onViewFetching?: (id: number, fluxId?: number, fluxName?: string) => void;
  onViewProcessing?: (id: number, fluxId?: number, fluxName?: string) => void;
  onViewNormalization?: (
    id: number,
    fluxId?: number,
    fluxName?: string,
  ) => void;
  onViewRefinement?: (id: number, fluxId?: number, fluxName?: string) => void;
  onViewCalculation?: (id: number, fluxId?: number, fluxName?: string) => void;
  onPreviewFile?: (file: { id: string; name: string }) => void;
}

export default function WorkflowStagesOverview({
  item,
  onViewFetching,
  onViewProcessing,
  onViewNormalization,
  onViewRefinement,
  onViewCalculation,
  onPreviewFile,
}: WorkflowStagesOverviewProps) {
  const [statuses, setStatuses] = useState<StageStatusResult>({});
  const [loading, setLoading] = useState(true);
  const [ellipsisStep, setEllipsisStep] = useState(0);
  const [fetchingLoaded, setFetchingLoaded] = useState(false);

  useEffect(() => {
    setFetchingLoaded(false);
    setLoading(true);
    setStatuses({});
    const params = new URLSearchParams();
    if (item.fetching_id) params.set("fetchingId", String(item.fetching_id));
    if (item.processing_id) params.set("processingId", String(item.processing_id));
    if (item.normalization_id)
      params.set("normalizationId", String(item.normalization_id));
    if (item.refinement_id) params.set("refinementId", String(item.refinement_id));
    if (item.calculation_id) params.set("calculationId", String(item.calculation_id));
    fetch(`/api/workflow-stage-statuses?${params.toString()}`)
      .then((r) => r.json())
      .then((res: { data: StageStatusResult; error: unknown }) => {
        if (!res.error) setStatuses(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [item]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setEllipsisStep((e) => (e + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  const getIcon = useCallback(
    (
      stage:
        | "fetching"
        | "processing"
        | "normalization"
        | "refinement"
        | "calculation",
      status?: string | null,
    ) => {
      if (loading)
        return <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />;
      if (!status) return <Clock className="w-4 h-4 text-gray-500" />;
      const s = status.toLowerCase();
      if (s.includes("success"))
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      if (s.includes("currently") || s.includes("progress")) {
        const color =
          stage === "processing" ? "text-orange-500" : "text-blue-500";
        return <RefreshCw className={`w-4 h-4 ${color} animate-spin`} />;
      }
      if (s.includes("failed") || s.includes("error"))
        return <XCircle className="w-4 h-4 text-red-500" />;
      if (s.includes("not started"))
        return <Clock className="w-4 h-4 text-gray-500" />;
      return <Clock className="w-4 h-4 text-gray-500" />;
    },
    [loading],
  );

  const headerColor = (status?: string | null) =>
    loading || !status || status.toLowerCase().includes("not started")
      ? "text-gray-500"
      : "";

  const renderPlaceholder = (text: string) => (
    <div className="min-h-[110px] flex items-center justify-center text-sm text-gray-500">
      {text}
    </div>
  );

  return (
    <Accordion
      type="multiple"
      defaultValue={["fetching"]}
      className="w-full rounded-md shadow-md bg-white"
    >
      <AccordionItem
        value="fetching"
        className="first:rounded-t-md last:rounded-b-md overflow-hidden"
      >
        <AccordionTrigger className="px-6 py-4 flex items-center gap-2 bg-white">
          {getIcon("fetching", statuses.fetching)}
          <span
            className={`flex-1 text-lg font-light text-left ${headerColor(statuses.fetching)}`}
          >
            Fetching work stage status –{" "}
            {loading
              ? `Loading${".".repeat(ellipsisStep)}`
              : (statuses.fetching ?? "Not started")}
          </span>
          {item.fetching_id && (
            <Badge
              onClick={(e) => {
                e.stopPropagation();
                onViewFetching?.(
                  item.fetching_id!,
                  item.flux_id,
                  item.flux_name || `Flux ${item.flux_id}`,
                );
              }}
              className="cursor-pointer"
            >
              ID:{item.fetching_id}
            </Badge>
          )}
        </AccordionTrigger>
        <AccordionContent className="p-0">
          <ScrollArea
            className={`max-h-[240px] min-h-[110px] thin-gray-scrollbar ${
              fetchingLoaded ? "" : "h-[110px]"
            }`}
          >
            {item.fetching_id ? (
              <FetchingDetails
                fetchingId={item.fetching_id}
                onPreviewFile={onPreviewFile}
                hideHeader
                onLoaded={() => setFetchingLoaded(true)}
                loadingHeight={110}
              />
            ) : (
              renderPlaceholder("No fetching data for this workflow.")
            )}
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem
        value="processing"
        className="first:rounded-t-md last:rounded-b-md overflow-hidden"
      >
        <AccordionTrigger className="px-6 py-4 flex items-center gap-2 bg-white">
          {getIcon("processing", statuses.processing)}
          <span
            className={`flex-1 text-lg font-light text-left ${headerColor(statuses.processing)}`}
          >
            Processing work stage status –{" "}
            {loading
              ? `Loading${".".repeat(ellipsisStep)}`
              : (statuses.processing ?? "Not started")}
          </span>
          {item.processing_id && (
            <Badge
              onClick={(e) => {
                e.stopPropagation();
                onViewProcessing?.(
                  item.processing_id!,
                  item.flux_id,
                  item.flux_name || `Flux ${item.flux_id}`,
                );
              }}
              className="cursor-pointer"
            >
              ID:{item.processing_id}
            </Badge>
          )}
        </AccordionTrigger>
        <AccordionContent className="p-0">
          <ScrollArea className="max-h-[240px] min-h-[110px] thin-gray-scrollbar">
            {item.processing_id ? (
              <ProcessingDetails
                processingId={item.processing_id}
                onPreview={onPreviewFile ?? (() => {})}
                hideHeader
              />
            ) : (
              renderPlaceholder("Data not available for this stage.")
            )}
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem
        value="normalization"
        className="first:rounded-t-md last:rounded-b-md overflow-hidden"
      >
        <AccordionTrigger className="px-6 py-4 flex items-center gap-2 bg-white">
          {getIcon("normalization", statuses.normalization)}
          <span
            className={`flex-1 text-lg font-light text-left ${headerColor(statuses.normalization)}`}
          >
            Normalization work stage status –{" "}
            {loading
              ? `Loading${".".repeat(ellipsisStep)}`
              : (statuses.normalization ?? "Not started")}
          </span>
          {item.normalization_id && (
            <Badge
              onClick={(e) => {
                e.stopPropagation();
                onViewNormalization?.(
                  item.normalization_id!,
                  item.flux_id,
                  item.flux_name || `Flux ${item.flux_id}`,
                );
              }}
              className="cursor-pointer"
            >
              ID:{item.normalization_id}
            </Badge>
          )}
        </AccordionTrigger>
        <AccordionContent className="p-0">
          <ScrollArea className="max-h-[240px] min-h-[110px] thin-gray-scrollbar">
            {item.normalization_id
              ? renderPlaceholder("Data not available for this stage.")
              : renderPlaceholder("Data not available for this stage.")}
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem
        value="refinement"
        className="first:rounded-t-md last:rounded-b-md overflow-hidden"
      >
        <AccordionTrigger className="px-6 py-4 flex items-center gap-2 bg-white">
          {getIcon("refinement", statuses.refinement)}
          <span
            className={`flex-1 text-lg font-light text-left ${headerColor(statuses.refinement)}`}
          >
            Refinement work stage status –{" "}
            {loading
              ? `Loading${".".repeat(ellipsisStep)}`
              : (statuses.refinement ?? "Not started")}
          </span>
          {item.refinement_id && (
            <Badge
              onClick={(e) => {
                e.stopPropagation();
                onViewRefinement?.(
                  item.refinement_id!,
                  item.flux_id,
                  item.flux_name || `Flux ${item.flux_id}`,
                );
              }}
              className="cursor-pointer"
            >
              ID:{item.refinement_id}
            </Badge>
          )}
        </AccordionTrigger>
        <AccordionContent className="p-0">
          <ScrollArea className="max-h-[240px] min-h-[110px] thin-gray-scrollbar">
            {item.refinement_id
              ? renderPlaceholder("Data not available for this stage.")
              : renderPlaceholder("Data not available for this stage.")}
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem
        value="calculation"
        className="first:rounded-t-md last:rounded-b-md overflow-hidden"
      >
        <AccordionTrigger className="px-6 py-4 flex items-center gap-2 bg-white">
          {getIcon("calculation", statuses.calculation)}
          <span
            className={`flex-1 text-lg font-light text-left ${headerColor(statuses.calculation)}`}
          >
            Calculation work stage status –{" "}
            {loading
              ? `Loading${".".repeat(ellipsisStep)}`
              : (statuses.calculation ?? "Not started")}
          </span>
          {item.calculation_id && (
            <Badge
              onClick={(e) => {
                e.stopPropagation();
                onViewCalculation?.(
                  item.calculation_id!,
                  item.flux_id,
                  item.flux_name || `Flux ${item.flux_id}`,
                );
              }}
              className="cursor-pointer"
            >
              ID:{item.calculation_id}
            </Badge>
          )}
        </AccordionTrigger>
        <AccordionContent className="p-0">
          <ScrollArea className="max-h-[240px] min-h-[110px] thin-gray-scrollbar">
            {item.calculation_id
              ? renderPlaceholder("Data not available for this stage.")
              : renderPlaceholder("Data not available for this stage.")}
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
