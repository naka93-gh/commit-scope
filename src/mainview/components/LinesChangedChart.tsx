import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CommitData } from "../../shared/types";
import { aggregateLinesChanged, type TimeUnit } from "../utils/aggregate";

const UNIT_LABELS: Record<TimeUnit, string> = {
  day: "日",
  week: "週",
  month: "月",
};

interface Props {
  commits: CommitData[];
}

export function LinesChangedChart({ commits }: Props) {
  const [unit, setUnit] = useState<TimeUnit>("week");

  const data = useMemo(
    () => aggregateLinesChanged(commits, unit),
    [commits, unit],
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">変更行数推移</h3>
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
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
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
          <Area
            type="monotone"
            dataKey="additions"
            name="追加"
            stackId="1"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="deletions"
            name="削除"
            stackId="1"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
