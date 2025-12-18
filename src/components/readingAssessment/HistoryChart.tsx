import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { type AssessmentHistoryItem } from "@/lib/reading-api";
import { TrendingUp, Target, Zap, Award } from "lucide-react";

interface HistoryChartProps {
  history: AssessmentHistoryItem[];
}

export const HistoryChart = ({ history }: HistoryChartProps) => {
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("area");

  // Prepare data for charts (reverse to show oldest first)
  const chartData = [...history].reverse().map((item, index) => {
    const dateStr = item.completedAt || item.createdAt || new Date().toISOString();
    // Helper to normalize scores - convert to percentage if in decimal format
    const normalizeScore = (score: number) => score <= 1 ? Math.round(score * 100) : Math.round(score);
    
    return {
      index: index + 1,
      date: new Date(dateStr).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      wpm: Math.round(item.weightedWPM),
      accuracy: normalizeScore(item.accuracy),
      retention: normalizeScore(item.retention),
      speedLearning: normalizeScore(item.speedLearningScore),
      focusRatio: normalizeScore(item.focusRatio),
      difficulty: item.difficulty,
      title: item.passageTitle || `${item.category} Passage`
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.date}</p>
          <p className="text-xs text-gray-600 mb-2 max-w-xs truncate">{data.title}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              // Check if this is a WPM metric
              const isWPM = entry.dataKey === 'wpm' || entry.name.toLowerCase().includes('wpm') || entry.name.toLowerCase().includes('words per minute');
              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <span className="text-sm" style={{ color: entry.color }}>
                    {entry.name}:
                  </span>
                  <span className="font-semibold" style={{ color: entry.color }}>
                    {entry.value}{isWPM ? ' WPM' : '%'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = (dataKeys: { key: string; name: string; color: string }[]) => {
    const ChartComponent = chartType === "bar" ? BarChart : chartType === "area" ? AreaChart : LineChart;
    
    // Check if this chart is showing WPM data
    const isWPMChart = dataKeys.some(dk => dk.key === 'wpm');
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={isWPMChart ? { value: 'WPM', angle: -90, position: 'insideLeft' } : { value: '%', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          {dataKeys.map(({ key, name, color }) => {
            if (chartType === "bar") {
              return <Bar key={key} dataKey={key} name={name} fill={color} radius={[4, 4, 0, 0]} />;
            } else if (chartType === "area") {
              return (
                <Area 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  name={name} 
                  stroke={color} 
                  fill={color}
                  fillOpacity={0.6}
                />
              );
            } else {
              return (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  name={name} 
                  stroke={color} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              );
            }
          })}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setChartType("line")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            chartType === "line" 
              ? "bg-purple-500 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Line
        </button>
        <button
          onClick={() => setChartType("area")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            chartType === "area" 
              ? "bg-purple-500 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Area
        </button>
        <button
          onClick={() => setChartType("bar")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            chartType === "bar" 
              ? "bg-purple-500 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Bar
        </button>
      </div>

      {/* Tabs for Different Metrics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="speed">Speed</TabsTrigger>
          <TabsTrigger value="comprehension">Comprehension</TabsTrigger>
          <TabsTrigger value="focus">Focus</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Overall Performance Trends
            </h3>
            {renderChart([
              { key: "wpm", name: "Reading Speed (WPM)", color: "#8b5cf6" },
              { key: "accuracy", name: "Accuracy", color: "#3b82f6" },
              { key: "speedLearning", name: "Speed Learning", color: "#10b981" }
            ])}
          </Card>
        </TabsContent>

        <TabsContent value="speed" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Reading Speed Progress
            </h3>
            {renderChart([
              { key: "wpm", name: "Words Per Minute", color: "#8b5cf6" }
            ])}
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Tip:</strong> Consistent practice can help increase your reading speed. 
                Aim for gradual improvements while maintaining comprehension.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="comprehension" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Comprehension & Retention
            </h3>
            {renderChart([
              { key: "accuracy", name: "Accuracy", color: "#3b82f6" },
              { key: "retention", name: "Retention", color: "#06b6d4" }
            ])}
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Tip:</strong> High retention scores indicate strong comprehension. 
                If scores are low, try reading more slowly and taking notes.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="focus" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Focus & Speed Learning
            </h3>
            {renderChart([
              { key: "focusRatio", name: "Focus Ratio", color: "#10b981" },
              { key: "speedLearning", name: "Speed Learning Score", color: "#f59e0b" }
            ])}
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Tip:</strong> Higher focus ratios lead to better learning outcomes. 
                Minimize distractions during assessments for optimal results.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
