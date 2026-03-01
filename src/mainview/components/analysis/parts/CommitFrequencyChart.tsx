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
import type { CommitData } from "../../../shared/types";
import { aggregateFrequency, type TimeUnit } from "../../../utils/aggregate";
import { CHART_COLORS, TOOLTIP_STYLE, GRID_STROKE, AXIS_STROKE } from "../../../theme";

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
    <div className="bg-cs-surface border border-cs-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">コミット頻度</h3>
        <div className="flex gap-1">
          {(["day", "week", "month"] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                unit === u
                  ? "bg-cs-primary text-white"
                  : "bg-cs-surface-2 text-cs-text-secondary hover:bg-cs-primary-subtle"
              }`}
            >
              {UNIT_LABELS[u]}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis
            dataKey="date"
            stroke={AXIS_STROKE}
            fontSize={12}
            tickFormatter={(v) => formatDateLabel(v, unit)}
          />
          <YAxis stroke={AXIS_STROKE} fontSize={12} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend />
          {authors.map((author, i) => (
            <Bar
              key={author}
              dataKey={author}
              stackId="commits"
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDateLabel(value: string, unit: TimeUnit): string {
  if (unit === "month") return value;
  const parts = value.split("-");
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}
