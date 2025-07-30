"use client";

import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, Loader2 } from "lucide-react";
import TrendPointDetailPanel from "@/components/charts/trend-point-detail-panel";
import { format, parseISO, startOfMinute, startOfHour, startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths, subYears } from "date-fns";

// Import CanvasJS React StockChart dynamically to avoid SSR issues
let CanvasJSStockChart: any;
if (typeof window !== "undefined") {
  const CanvasJSReact = require("@canvasjs/react-stockcharts");
  CanvasJSStockChart = CanvasJSReact.default.CanvasJSStockChart;
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
    else if (r.status.includes("Currently") || r.status === "Currently executing" || r.status === "In Progress" || r.status === "InProgress") entry.active += 1;
    else if (r.status === "Failed") entry.failed += 1;
  });
  
  return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export default function FluxTrendStock({
  fluxId,
  onNavigate,
}: {
  fluxId: string;
  onNavigate: (tab: string, opts?: { date?: string; status?: string }) => void;
}) {
  const [activeTab, setActiveTab] = useState<"fetching" | "processings" | "workflows">("workflows");
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
      let url = "";
      if (activeTab === "fetching") {
        url = `/api/fetching-history/trend?fluxId=${fluxId}`;
      } else if (activeTab === "processings") {
        url = `/api/processing-history/trend?fluxId=${fluxId}`;
      } else {
        url = `/api/workflow-execution-log/trend?fluxId=${fluxId}`;
      }
      const res = await fetch(url);
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

  // Reset chart viewport when range changes
  useEffect(() => {
    if (chartRef.current && chartRef.current.stockChart && data.length > 0) {
      const endDate = new Date();
      let startDate = new Date(data[0].date);
      
      switch (range) {
        case "1D":
          startDate = subDays(endDate, 1);
          break;
        case "1W":
          startDate = subWeeks(endDate, 1);
          break;
        case "2W":
          startDate = subWeeks(endDate, 2);
          break;
        case "1M":
          startDate = subMonths(endDate, 1);
          break;
        case "3M":
          startDate = subMonths(endDate, 3);
          break;
        case "6M":
          startDate = subMonths(endDate, 6);
          break;
        case "1Y":
          startDate = subYears(endDate, 1);
          break;
        case "ALL":
          // Reset to show all data
          chartRef.current.stockChart.charts[0].axisX[0].set("viewportMinimum", null);
          chartRef.current.stockChart.charts[0].axisX[0].set("viewportMaximum", null);
          return;
      }
      
      chartRef.current.stockChart.charts[0].axisX[0].set("viewportMinimum", startDate);
      chartRef.current.stockChart.charts[0].axisX[0].set("viewportMaximum", endDate);
    }
  }, [range, data]);

  const toggleLine = (key: "success" | "active" | "failed") =>
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));

  const historyTab = activeTab === "fetching" ? "fetching-history" : activeTab === "processings" ? "processing-history" : "workflow-execution-log";

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
    theme: "light2",
    backgroundColor: "transparent",
    height: 500,
    exportEnabled: false,
    rangeSelector: {
      enabled: false
    },
    navigator: {
      enabled: true,
      height: 80,
      axisX: {
        labelFontSize: 10,
        labelFontColor: "#6b7280",
        tickColor: "#e5e7eb",
        lineColor: "#e5e7eb"
      },
      slider: {
        maskColor: "#3b82f640",
        maskOpacity: 0.3,
        handleColor: "#3b82f6",
        handleBorderColor: "#2563eb",
        handleBorderThickness: 2,
        handleWidth: 10,
        handleHeight: 25
      },
      data: getChartData()
    },
    charts: [{
      height: 300,
      zoomEnabled: true,
      panEnabled: true,
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
    }]
  };

  const handleDetailPanelNavigate = (tab: string, opts?: { date?: string; status?: string }) => {
    onNavigate(tab, opts);
    setShowDetailPanel(false);
  };

  const handleChartClick = (e: any) => {
    if (e.dataPoint && e.dataPoint.x) {
      const point = data.find(p => p.date.getTime() === e.dataPoint.x.getTime());
      if (point && (point.success > 0 || point.active > 0 || point.failed > 0)) {
        // If user wants to navigate directly without detail panel
        if (e.ctrlKey || e.metaKey) {
          const dateOnly = e.dataPoint.x.toISOString().split('T')[0];
          const seriesName = e.dataSeries.name;
          let statusFilter = '';
          
          if (seriesName === 'Success') {
            statusFilter = 'Success';
          } else if (seriesName === 'Active') {
            statusFilter = 'In Progress';
          } else if (seriesName === 'Failed') {
            statusFilter = 'Failed';
          }
          
          const historyTab = activeTab === "fetching" ? "fetching-history" : 
                           activeTab === "processings" ? "processing-history" : 
                           "workflow-execution-log";
          
          onNavigate(historyTab, { date: dateOnly, status: statusFilter });
        } else {
          // Show detail panel
          setSelectedPoint(point);
          setShowDetailPanel(true);
        }
      }
    }
  };

  // Add click handler to chart data
  const getChartDataWithClick = () => {
    const chartData = getChartData();
    return chartData.map(series => ({
      ...series,
      click: handleChartClick
    }));
  };

  // Update options to use data with click handlers
  // Calculate date range for navigator based on selected range
  const getViewportRange = () => {
    if (data.length === 0) return null;
    
    const endDate = new Date();
    let startDate = new Date(data[0].date);
    
    switch (range) {
      case "1D":
        startDate = subDays(endDate, 1);
        break;
      case "1W":
        startDate = subWeeks(endDate, 1);
        break;
      case "2W":
        startDate = subWeeks(endDate, 2);
        break;
      case "1M":
        startDate = subMonths(endDate, 1);
        break;
      case "3M":
        startDate = subMonths(endDate, 3);
        break;
      case "6M":
        startDate = subMonths(endDate, 6);
        break;
      case "1Y":
        startDate = subYears(endDate, 1);
        break;
      case "ALL":
        return null; // Show full range
    }
    
    return {
      startDate,
      endDate
    };
  };

  const viewportRange = getViewportRange();

  // Update options to use data with click handlers and viewport range
  const optionsWithClick = {
    ...options,
    charts: [{
      ...options.charts[0],
      data: getChartDataWithClick(),
      axisX: {
        ...options.charts[0].axisX,
        ...(viewportRange ? {
          viewportMinimum: viewportRange.startDate,
          viewportMaximum: viewportRange.endDate
        } : {})
      }
    }],
    navigator: {
      ...options.navigator,
      data: getChartData(), // Navigator doesn't need click handlers
      // Navigator should always show full data range
      slider: {
        ...options.navigator.slider,
        // Don't set minimum/maximum on slider, let it show full range
      }
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-200 relative">
        {/* Mobile-first header layout */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-bold pr-2">
              {activeTab === "fetching"
                ? "Flux fetching trend"
                : activeTab === "processings"
                ? "Flux processing trend"
                : "Workflow execution trend"}
            </h3>
            <p className="text-sm text-gray-500">
              {activeTab === "fetching"
                ? "Track how flux fetching evolves over time."
                : activeTab === "processings"
                ? "Track how flux processing evolves over time."
                : "Track how workflow execution evolves over time."}{" "}
              <button
                onClick={() => onNavigate(historyTab)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                {activeTab === "fetching"
                  ? "View all fetching items"
                  : activeTab === "processings"
                  ? "View all processing items"
                  : "View all workflow items"}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </p>
          </div>
          
          {/* Tab Selector */}
          <div className="flex-shrink-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="workflows" className="px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Workflow
                </TabsTrigger>
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

        {/* Legend and Range Selector - Material 3 Design */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Status Buttons */}
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
          
          {/* Range Selector Buttons - Material 3 Style */}
          <div className="flex items-center gap-1 ml-auto bg-gray-100 p-1 rounded-lg">
            {ranges.slice(0, -1).map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r.label)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  range === r.label
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {r.label}
              </button>
            ))}
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button
              onClick={() => setRange("ALL")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                range === "ALL"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              ALL
            </button>
          </div>
        </div>
      
        {/* Help text */}
        <p className="text-xs text-gray-500 mb-2">
          Click legend to toggle lines • Drag on navigator below to zoom
        </p>
        
        <div className="mt-4 relative h-[480px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Loading trend data...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 h-full">
              <TrendingUp className="h-8 w-8 text-gray-300 mb-2" />
              <span>No {activeTab === "workflows" ? "workflow" : activeTab} data in selected period</span>
              <span className="text-xs text-gray-400 mt-1">Try selecting a different time range</span>
            </div>
          ) : !CanvasJSStockChart ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Loading chart...</span>
            </div>
          ) : (
            <CanvasJSStockChart 
              options={optionsWithClick}
              onRef={(ref: any) => chartRef.current = ref}
            />
          )}
        </div>
      </div>

      {/* Interactive Detail Panel */}
      <TrendPointDetailPanel
        isOpen={showDetailPanel}
        onClose={() => setShowDetailPanel(false)}
        point={selectedPoint}
        trendType={activeTab === "fetching" ? "fetching" : activeTab === "processings" ? "processing" : "workflow"}
        onNavigate={handleDetailPanelNavigate}
      />
    </>
  );
}