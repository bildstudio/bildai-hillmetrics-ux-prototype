"use client";

import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, Loader2 } from "lucide-react";
import TrendPointDetailPanel from "@/components/charts/trend-point-detail-panel";
import { format, parseISO, startOfMinute, startOfHour, startOfDay, startOfWeek, startOfMonth } from "date-fns";

// Import CanvasJS React dynamically to avoid SSR issues
let CanvasJSChart: any;
if (typeof window !== "undefined") {
  const CanvasJSReact = require("@canvasjs/react-charts");
  CanvasJSChart = CanvasJSReact.default.CanvasJSChart;
}

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
  { label: "2W", tooltip: "Zoom to two weeks" },
  { label: "1M", tooltip: "Zoom to one month" },
  { label: "3M", tooltip: "Zoom to three months" },
  { label: "6M", tooltip: "Zoom to six months" },
  { label: "1Y", tooltip: "Zoom to one year" },
  { label: "ALL", tooltip: "Show all data" },
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
      case "2W":
        keyDate = startOfHour(d);
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
  
  return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export default function FluxTrendCanvas({
  fluxId,
  onNavigate,
}: {
  fluxId: string;
  onNavigate: (tab: string, opts?: { date?: string; status?: string }) => void;
}) {
  const [activeTab, setActiveTab] = useState<"fetching" | "processings">("fetching");
  const [range, setRange] = useState("ALL");
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState({
    success: true,
    active: true,
    failed: true,
  });
  const [selectedPoint, setSelectedPoint] = useState<TrendPoint | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);
  const chartRef = useRef<any>(null);

  // Force re-render when component mounts on client
  useEffect(() => {
    if (typeof window !== "undefined" && !chartLoaded) {
      setChartLoaded(true);
    }
  }, [chartLoaded]);

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
      } else {
        setData([]);
      }
      setLoading(false);
    };
    load();
  }, [activeTab, range, fluxId]);

  const toggleLine = (key: "success" | "active" | "failed") =>
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));

  const historyTab = activeTab === "fetching" ? "fetching-history" : "processing-history";

  // Prepare data for CanvasJS
  const getChartData = () => {
    const successData = data.map(point => ({ x: point.date, y: point.success }));
    const activeData = data.map(point => ({ x: point.date, y: point.active }));
    const failedData = data.map(point => ({ x: point.date, y: point.failed }));

    const chartData = [];
    
    if (visibleLines.success) {
      chartData.push({
        type: "line",
        name: "Success",
        color: "#16a34a",
        markerSize: 6,
        lineThickness: 3,
        showInLegend: false,
        dataPoints: successData,
        click: (e: any) => {
          const point = data.find(p => p.date.getTime() === e.dataPoint.x.getTime());
          if (point) {
            setSelectedPoint(point);
            setShowDetailPanel(true);
          }
        }
      });
    }
    
    if (visibleLines.active) {
      chartData.push({
        type: "line",
        name: "Active",
        color: "#2563eb",
        markerSize: 6,
        lineThickness: 3,
        showInLegend: false,
        dataPoints: activeData,
        click: (e: any) => {
          const point = data.find(p => p.date.getTime() === e.dataPoint.x.getTime());
          if (point) {
            setSelectedPoint(point);
            setShowDetailPanel(true);
          }
        }
      });
    }
    
    if (visibleLines.failed) {
      chartData.push({
        type: "line",
        name: "Failed",
        color: "#dc2626",
        markerSize: 6,
        lineThickness: 3,
        showInLegend: false,
        dataPoints: failedData,
        click: (e: any) => {
          const point = data.find(p => p.date.getTime() === e.dataPoint.x.getTime());
          if (point) {
            setSelectedPoint(point);
            setShowDetailPanel(true);
          }
        }
      });
    }
    
    return chartData;
  };

  const getAxisXFormatString = () => {
    switch (range) {
      case "1D": return "HH:mm";
      case "1W":
      case "2W":
      case "1M":
      case "3M": return "DD MMM";
      case "6M":
      case "1Y":
      case "ALL": return "MMM YYYY";
      default: return "DD MMM";
    }
  };

  const options = {
    animationEnabled: true,
    zoomEnabled: true,
    zoomType: "x",
    theme: "light2",
    backgroundColor: "transparent",
    height: 460,
    navigator: {
      enabled: true,
      height: 60,
      axisX: {
        labelFontSize: 10,
        labelFontColor: "#6b7280",
        tickColor: "#e5e7eb",
        lineColor: "#e5e7eb"
      },
      data: getChartData(),
      slider: {
        minimum: data.length > 0 ? data[0].date : new Date(),
        maximum: data.length > 0 ? data[data.length - 1].date : new Date(),
        handleColor: "#3b82f6",
        handleBorderColor: "#3b82f6",
        handleBorderThickness: 2
      }
    },
    axisX: {
      valueFormatString: getAxisXFormatString(),
      crosshair: {
        enabled: true,
        snapToDataPoint: true,
        valueFormatString: getAxisXFormatString()
      },
      labelFontSize: 12,
      labelFontColor: "#505050",
      lineColor: "#e5e7eb",
      tickColor: "#e5e7eb",
      gridColor: "#f3f4f6",
      gridThickness: 1
    },
    axisY: {
      includeZero: true,
      crosshair: {
        enabled: true
      },
      labelFontSize: 12,
      labelFontColor: "#505050",
      lineColor: "#e5e7eb",
      tickColor: "#e5e7eb",
      gridColor: "#f3f4f6",
      gridThickness: 1
    },
    toolTip: {
      shared: true,
      content: function(e: any) {
        const date = e.entries[0].dataPoint.x;
        let content = `<div style="padding: 8px; font-size: 14px;">`;
        content += `<strong>${format(date, "PPp")}</strong><br/>`;
        
        e.entries.forEach((entry: any) => {
          content += `<span style="color: ${entry.dataSeries.color};">●</span> ${entry.dataSeries.name}: <strong>${entry.dataPoint.y}</strong><br/>`;
        });
        
        content += `</div>`;
        return content;
      }
    },
    data: getChartData()
  };

  const handleDetailPanelNavigate = (tab: string, opts?: { date?: string; status?: string }) => {
    onNavigate(tab, opts);
    setShowDetailPanel(false);
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.chart.options.axisX[0].viewportMinimum = null;
      chartRef.current.chart.options.axisX[0].viewportMaximum = null;
      chartRef.current.chart.render();
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-200 relative">
        {/* Mobile-first header layout */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold pr-2">
                {activeTab === "fetching"
                  ? "Flux fetching trend"
                  : "Flux processing trend"}
              </h3>
            </div>
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
            Drag on chart to zoom • Use navigator below to select time range
          </p>
        </div>
      
        <div className="mt-4 relative h-[480px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Loading trend data...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 h-full">
              <TrendingUp className="h-8 w-8 text-gray-300 mb-2" />
              <span>No {activeTab} data in selected period</span>
              <span className="text-xs text-gray-400 mt-1">Try selecting a different time range</span>
            </div>
          ) : !CanvasJSChart ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Loading chart...</span>
            </div>
          ) : (
            <>
              <CanvasJSChart 
                options={options}
                onRef={(ref: any) => chartRef.current = ref}
              />
              {/* Chart control buttons */}
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={handleResetZoom}
                  className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Reset Zoom
                </button>
                <button
                  onClick={() => {
                    if (chartRef.current) {
                      chartRef.current.chart.exportChart({ format: "png" });
                    }
                  }}
                  className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Export
                </button>
              </div>
            </>
          )}
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