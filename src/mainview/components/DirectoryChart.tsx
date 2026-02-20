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
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">
        ファイル集中度（上位 {Math.min(TOP_N, data.length)} ディレクトリ）
      </h3>

      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 32)}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9ca3af" fontSize={12} />
          <YAxis
            type="category"
            dataKey="directory"
            stroke="#9ca3af"
            fontSize={11}
            width={140}
            tick={{ fill: "#d1d5db" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#e5e7eb" }}
          />
          <Legend />
          <Bar dataKey="commits" name="コミット数" fill="#3b82f6" />
          <Bar dataKey="additions" name="追加行" fill="#22c55e" />
          <Bar dataKey="deletions" name="削除行" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
