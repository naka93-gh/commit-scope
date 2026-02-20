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
import { TOOLTIP_STYLE, GRID_STROKE, AXIS_STROKE } from "../theme";

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
    <div className="bg-cs-surface border border-cs-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">変更行数推移</h3>
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
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis dataKey="date" stroke={AXIS_STROKE} fontSize={12} />
          <YAxis stroke={AXIS_STROKE} fontSize={12} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend />
          <Area
            type="monotone"
            dataKey="additions"
            name="追加"
            stackId="1"
            stroke="var(--cs-success)"
            fill="var(--cs-success)"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="deletions"
            name="削除"
            stackId="1"
            stroke="var(--cs-error)"
            fill="var(--cs-error)"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
