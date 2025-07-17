"use client";

import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, XCircle, Calendar, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ResponsiveContainer,
} from "recharts";
import TrendPointDetailPanel from "@/components/charts/trend-point-detail-panel";

import {
  format,
  parseISO,
  startOfMinute,
  startOfHour,
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  subWeeks,
  subMonths,
  subYears,
} from "date-fns";

interface TrendRow {
  status: string;
  timestamp: string;
}

interface TrendPoint {
  date: Date;
  success: number;
  active: number;
  failed: number;
}

const ranges = [
  { label: "1D", tooltip: "Zoom to one day" },
  { label: "1W", tooltip: "Zoom to one week" },
  { label: "2W", tooltip: "Zoom to two week" },
  { label: "1M", tooltip: "Zoom to one month" },
  { label: "3M", tooltip: "Zoom to three month" },
  { label: "6M", tooltip: "Zoom to six month" },
  { label: "1Y", tooltip: "Zoom to one year" },
  { label: "ALL", tooltip: "Zoom to all period" },
];

function groupData(rows: TrendRow[], range: string): TrendPoint[] {
  const map = new Map<string, TrendPoint>();
  rows.forEach((r) => {
    const d = parseISO(r.timestamp);
    let keyDate: Date = d;
    switch (range) {
      case "1D":
        keyDate = startOfMinute(d);
        break;
      case "1W":
        keyDate = startOfHour(d);
        break;
      case "2W":
        keyDate = startOfHour(d);
        keyDate.setHours(Math.floor(keyDate.getHours() / 2) * 2);
        break;
      case "1M":
        keyDate = startOfDay(d);
        break;
      case "3M":
        keyDate = startOfDay(d);
        keyDate.setDate(Math.floor((keyDate.getDate() - 1) / 3) * 3 + 1);
        break;
      case "6M":
      case "1Y":
        keyDate = startOfWeek(d);
        break;
      case "ALL":
        keyDate = startOfMonth(d);
        break;
      default:
        break;
    }
    const key = keyDate.toISOString();
    if (!map.has(key)) {
      map.set(key, { date: keyDate, success: 0, active: 0, failed: 0 });
    }
    const entry = map.get(key)!;
    if (r.status === "Success") entry.success += 1;
    else if (r.status.includes("Currently")) entry.active += 1;
    else if (r.status === "Failed") entry.failed += 1;
  });
  let arr = Array.from(map.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  if (arr.length === 0) return arr;
  if (range !== "ALL") {
    const end = arr[arr.length - 1].date;
    let start = new Date(end);
    switch (range) {
      case "1D":
        start = subDays(end, 1);
        break;
      case "1W":
        start = subWeeks(end, 1);
        break;
      case "2W":
        start = subWeeks(end, 2);
        break;
      case "1M":
        start = subMonths(end, 1);
        break;
      case "3M":
        start = subMonths(end, 3);
        break;
      case "6M":
        start = subMonths(end, 6);
        break;
      case "1Y":
        start = subYears(end, 1);
        break;
    }
    arr = arr.filter((p) => p.date >= start);
  }
  return arr;

}

export default function FluxTrend({
  fluxId,
  onNavigate,
}: {
  fluxId: string;
  onNavigate: (tab: string, opts?: { date?: string; status?: string }) => void;
}) {
  const [activeTab, setActiveTab] = useState<"fetching" | "processings">(
    "fetching",
  );
  const [range, setRange] = useState("ALL");
  const [data, setData] = useState<TrendPoint[]>([]);
  const [indices, setIndices] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState({
    success: true,
    active: true,
    failed: true,
  });
  const [hoverLine, setHoverLine] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<TrendPoint | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<number | null>(null);

  useEffect(() => {
    const update = () =>
      setWidth(containerRef.current?.offsetWidth || window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const brushHeight = width < 640 ? 60 : width < 768 ? 80 : 120;

  const handleWheel = (e: React.WheelEvent) => {
    if (data.length === 0) return;
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const span = indices.end - indices.start + 1;
    const step = Math.max(1, Math.floor(span * 0.1));
    if (delta > 0) {
      setIndices({
        start: Math.max(0, indices.start - step),
        end: Math.min(data.length - 1, indices.end + step),
      });
    } else if (span > 5) {
      const newStart = Math.min(indices.start + step, indices.end - 2);
      const newEnd = Math.max(indices.end - step, newStart + 2);
      setIndices({ start: newStart, end: newEnd });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    panStart.current = e.clientX;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || panStart.current === null) return;
    const diffPx = e.clientX - panStart.current;
    const pointsPerPx =
      (indices.end - indices.start) /
      Math.max(1, containerRef.current?.offsetWidth || 1);
    const diff = Math.round(-diffPx * pointsPerPx);
    if (diff !== 0) {
      let newStart = indices.start + diff;
      let newEnd = indices.end + diff;
      if (newStart < 0) {
        newEnd -= newStart;
        newStart = 0;
      }
      if (newEnd > data.length - 1) {
        newStart -= newEnd - (data.length - 1);
        newEnd = data.length - 1;
      }
      setIndices({ start: newStart, end: newEnd });
      panStart.current = e.clientX;
    }
  };
  const handleMouseUp = () => {
    setIsPanning(false);
    panStart.current = null;
  };

  const displayData = data.slice(indices.start, indices.end + 1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(
        activeTab === "fetching"
          ? `/api/fetching-history/trend?fluxId=${fluxId}`
          : `/api/processing-history/trend?fluxId=${fluxId}`,
      );
      const json = await res.json();
      if (!json.error) {
        const grouped = groupData(json.data, range);
        setData(grouped);
        setIndices({ start: 0, end: grouped.length - 1 });
      } else {
        setData([]);
        setIndices({ start: 0, end: 0 });
      }
      setLoading(false);
    };
    load();
  }, [activeTab, range, fluxId]);

  const toggleLine = (key: "success" | "active" | "failed") =>
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));

  const historyTab =
    activeTab === "fetching" ? "fetching-history" : "processing-history";


  // Custom dot component for handling clicks
  const createCustomDot = (color: string) => (props: any) => {
    const { cx, cy, payload } = props;
    
    if (!payload || (payload.success === 0 && payload.active === 0 && payload.failed === 0)) {
      return null;
    }
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        stroke={color}
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          if (payload && (payload.success > 0 || payload.active > 0 || payload.failed > 0)) {
            setSelectedPoint(payload);
            setShowDetailPanel(true);
          }
        }}
      />
    );
  };

  // Custom active dot component for handling clicks
  const createCustomActiveDot = (color: string) => (props: any) => {
    const { cx, cy, payload } = props;
    
    if (!payload || (payload.success === 0 && payload.active === 0 && payload.failed === 0)) {
      return null;
    }
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#ffffff"
        stroke={color}
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          if (payload && (payload.success > 0 || payload.active > 0 || payload.failed > 0)) {
            setSelectedPoint(payload);
            setShowDetailPanel(true);
          }
        }}
      />
    );
  };

  // Handle chart area clicks (alternative approach)
  const handleChartClick = (event: any) => {
    if (event && event.activePayload && event.activePayload.length > 0) {
      const payload = event.activePayload[0].payload;
      if (payload && (payload.success > 0 || payload.active > 0 || payload.failed > 0)) {
        setSelectedPoint(payload)
        setShowDetailPanel(true)
      }
    }
  }

  const handleDetailPanelNavigate = (tab: string, opts?: { date?: string; status?: string }) => {
    onNavigate(tab, opts)
    setShowDetailPanel(false)
  }

  return (
    <>
      <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === "fetching"
                  ? "Flux fetching trend"
                  : "Flux processing trend"}
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {activeTab === "fetching"
                ? "Track how flux fetching evolves over time."
                : "Track how flux processing evolves over time."}{" "}
              <button
                onClick={() => onNavigate(historyTab)}
                className="text-blue-600 underline hover:text-blue-500 transition-colors"
              >
                {activeTab === "fetching"
                  ? "View all fetching items"
                  : "View all processing items"}
              </button>
            </p>
          </div>
          
          {/* Time Range Selector - Material 3 Tonal Select */}
          <div className="flex items-center gap-3">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-32 bg-gray-50 border-gray-300">
                <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ranges.map((r) => (
                  <SelectItem key={r.label} value={r.label} title={r.tooltip}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Tab Selector */}
            <div className="flex bg-gray-100 rounded-full p-1">
              <Button
                variant={activeTab === "fetching" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("fetching")}
                className={`px-4 py-2 text-sm rounded-full transition-all ${
                  activeTab === "fetching" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                Fetching
              </Button>
              <Button
                variant={activeTab === "processings" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("processings")}
                className={`px-4 py-2 text-sm rounded-full transition-all ${
                  activeTab === "processings" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                Processing
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          <Badge
            onMouseEnter={() => setHoverLine("success")}
            onMouseLeave={() => setHoverLine(null)}
            onClick={() => toggleLine("success")}
            className={`cursor-pointer transition-all bg-green-600 text-white hover:bg-green-500 ${
              visibleLines.success ? "opacity-100" : "opacity-40"
            }`}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
          <Badge
            onMouseEnter={() => setHoverLine("active")}
            onMouseLeave={() => setHoverLine(null)}
            onClick={() => toggleLine("active")}
            className={`cursor-pointer transition-all bg-blue-600 text-white hover:bg-blue-500 ${
              visibleLines.active ? "opacity-100" : "opacity-40"
            }`}
          >
            <Loader2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
          <Badge
            onMouseEnter={() => setHoverLine("failed")}
            onMouseLeave={() => setHoverLine(null)}
            onClick={() => toggleLine("failed")}
            className={`cursor-pointer transition-all bg-red-600 text-white hover:bg-red-500 ${
              visibleLines.failed ? "opacity-100" : "opacity-40"
            }`}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
          <p className="text-xs text-gray-500 ml-2">
            Click legend to toggle lines • Click chart points for details
          </p>
        </div>
      
      <div
        ref={containerRef}
        className="mt-4 flex relative h-[360px] sm:h-[420px] md:h-[486px]"
      >
        <div
          className="flex-1"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center text-gray-500 h-full">
              No fetching/processing in selected period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={displayData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    if (range === "1D") return format(d, "HH:mm");
                    if (range === "1W" || range === "2W")
                      return format(d, "MMM d");
                    if (range === "ALL") return format(d, "MMM yyyy");
                    return format(d, "MMM d");
                  }}
                  stroke="#505050"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  type="number"
                  domain={[
                    displayData[0].date.getTime(),
                    displayData[displayData.length - 1].date.getTime(),
                  ]}
                  scale="time"
                />
                <YAxis
                  stroke="#505050"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  labelFormatter={(value) => format(new Date(value), "PPpp")}
                  formatter={(val: any, name: string) => [val, name]}
                />
                <Legend />
                {visibleLines.success && (
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#16a34a"
                    strokeWidth={hoverLine === "success" ? 4 : 3}
                    activeDot={createCustomActiveDot("#16a34a")}
                    dot={createCustomDot("#16a34a")}
                  />
                )}
                {visibleLines.active && (
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke="#2563eb"
                    strokeWidth={hoverLine === "active" ? 4 : 3}
                    activeDot={createCustomActiveDot("#2563eb")}
                    dot={createCustomDot("#2563eb")}
                  />
                )}
                {visibleLines.failed && (
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="#dc2626"
                    strokeWidth={hoverLine === "failed" ? 4 : 3}
                    activeDot={createCustomActiveDot("#dc2626")}
                    dot={createCustomDot("#dc2626")}
                  />
                )}
                <Brush
                  dataKey="date"
                  height={brushHeight}
                  travellerWidth={10}
                  startIndex={indices.start}
                  endIndex={indices.end}
                  onChange={(e) =>
                    setIndices({
                      start: e.startIndex ?? 0,
                      end: e.endIndex ?? data.length - 1,
                    })
                  }
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        </div>
      </div>

      {/* Interactive Detail Panel */}
      <TrendPointDetailPanel
        isOpen={showDetailPanel}
        onClose={() => setShowDetailPanel(false)}
        point={selectedPoint}
        trendType={activeTab === "fetching" ? "fetching" : "processing"}
        onNavigate={handleDetailPanelNavigate}
      />
    </>
  );

}
