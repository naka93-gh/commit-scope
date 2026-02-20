import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CommitData } from "../../shared/types";
import { aggregateFrequency, type TimeUnit } from "../utils/aggregate";

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
];

const UNIT_LABELS: Record<TimeUnit, string> = {
  day: "日",
  week: "週",
  month: "月",
};

interface Props {
  commits: CommitData[];
}

export function CommitFrequencyChart({ commits }: Props) {
  const [unit, setUnit] = useState<TimeUnit>("week");

  const { data, authors } = useMemo(
    () => aggregateFrequency(commits, unit),
    [commits, unit],
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">コミット頻度</h3>
        <div className="flex gap-1">
          {(["day", "week", "month"] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-1 text-sm rounded ${
                unit === u
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              {UNIT_LABELS[u]}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={(v) => formatDateLabel(v, unit)}
          />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#e5e7eb" }}
          />
          <Legend />
          {authors.map((author, i) => (
            <Bar
              key={author}
              dataKey={author}
              stackId="commits"
              fill={COLORS[i % COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDateLabel(value: string, unit: TimeUnit): string {
  if (unit === "month") return value;
  // "2024-01-15" → "1/15"
  const parts = value.split("-");
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}
