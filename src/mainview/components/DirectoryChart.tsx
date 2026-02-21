import { useMemo } from "react";
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
import { aggregateDirectories } from "../utils/aggregate";
import { TOOLTIP_STYLE, GRID_STROKE, AXIS_STROKE } from "../theme";

const TOP_N = 15;

interface Props {
  commits: CommitData[];
}

export function DirectoryChart({ commits }: Props) {
  const data = useMemo(
    () => aggregateDirectories(commits).slice(0, TOP_N),
    [commits],
  );

  return (
    <div className="bg-cs-surface border border-cs-border rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4">
        ファイル集中度（上位 {Math.min(TOP_N, data.length)} ディレクトリ）
      </h3>

      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 32)}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis type="number" stroke={AXIS_STROKE} fontSize={12} />
          <YAxis
            type="category"
            dataKey="directory"
            stroke={AXIS_STROKE}
            fontSize={11}
            width={140}
            tick={{ fill: "var(--cs-text-secondary)" }}
          />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend />
          <Bar dataKey="commits" name="コミット数" fill="var(--cs-primary)" isAnimationActive={false} />
          <Bar dataKey="additions" name="追加行" fill="var(--cs-success)" isAnimationActive={false} />
          <Bar dataKey="deletions" name="削除行" fill="var(--cs-error)" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
