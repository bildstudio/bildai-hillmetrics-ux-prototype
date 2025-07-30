"use client";

import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, XCircle, Calendar } from "lucide-react";
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
        // Always show full range when changing time period
        setIndices({ start: 0, end: Math.max(0, grouped.length - 1) });
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
        key={`dot-${payload?.date}-${color}`}
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
        key={`active-dot-${payload?.date}-${color}`}
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
      <div className="w-full bg-white rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-200 relative">
        {/* Mobile-first header layout */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-bold pr-2">
              {activeTab === "fetching"
                ? "Flux fetching trend"
                : "Flux processing trend"}
            </h3>
            <p className="text-sm text-gray-500">
              {activeTab === "fetching"
                ? "Track how flux fetching evolves over time."
                : "Track how flux processing evolves over time."}{" "}
              <button
                onClick={() => onNavigate(historyTab)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                {activeTab === "fetching"
                  ? "View all fetching items"
                  : "View all processing items"}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </p>
          </div>
          
          {/* Controls positioned below title on mobile, to the right on larger screens */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-24 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 shadow-sm rounded-lg">
                <Calendar className="h-4 w-4 text-gray-600" />
                <SelectValue className="font-medium text-gray-900" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                {ranges.map((r) => (
                  <SelectItem 
                    key={r.label} 
                    value={r.label} 
                    title={r.tooltip}
                    className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer transition-colors font-medium"
                  >
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Tab Selector */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="fetching" className="px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Fetching
                </TabsTrigger>
                <TabsTrigger value="processings" className="px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Processing
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Legend - Material 3 Design */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onMouseEnter={() => setHoverLine("success")}
            onMouseLeave={() => setHoverLine(null)}
            onClick={() => toggleLine("success")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              visibleLines.success 
                ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100" 
                : "bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <div className={`w-3 h-3 rounded-full transition-colors ${
              visibleLines.success ? "bg-green-500" : "bg-gray-300"
            }`} />
            Success
          </button>
          <button
            onMouseEnter={() => setHoverLine("active")}
            onMouseLeave={() => setHoverLine(null)}
            onClick={() => toggleLine("active")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              visibleLines.active 
                ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100" 
                : "bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <div className={`w-3 h-3 rounded-full transition-colors ${
              visibleLines.active ? "bg-blue-500" : "bg-gray-300"
            }`} />
            Active
          </button>
          <button
            onMouseEnter={() => setHoverLine("failed")}
            onMouseLeave={() => setHoverLine(null)}
            onClick={() => toggleLine("failed")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              visibleLines.failed 
                ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" 
                : "bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <div className={`w-3 h-3 rounded-full transition-colors ${
              visibleLines.failed ? "bg-red-500" : "bg-gray-300"
            }`} />
            Failed
          </button>
          <p className="text-xs text-gray-500 ml-auto">
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
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Loading trend data...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 h-full">
              <span>No {activeTab} data in selected period</span>
              <span className="text-xs text-gray-400 mt-1">Try selecting a different time range</span>
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
                    if (range === "1M" || range === "3M")
                      return format(d, "MMM d");
                    if (range === "6M" || range === "1Y")
                      return format(d, "MMM yyyy");
                    if (range === "ALL") return format(d, "MMM yyyy");
                    return format(d, "MMM d");
                  }}
                  stroke="#505050"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  type="number"
                  domain={displayData.length > 0 ? [
                    displayData[0].date.getTime(),
                    displayData[displayData.length - 1].date.getTime(),
                  ] : [0, 1]}
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
                {data.length > 10 && (
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
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      if (range === "1D") return format(d, "HH:mm");
                      if (range === "ALL") return format(d, "MMM yy");
                      return format(d, "MMM d");
                    }}
                  />
                )}
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
