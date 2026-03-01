import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CommitData } from "../../../shared/types";
import { AXIS_STROKE, GRID_STROKE, TOOLTIP_STYLE } from "../../../theme";
import { aggregateBusFactor } from "../../../utils/aggregate";

const DEPTH_OPTIONS = [2, 3, 4] as const;
const COLOR_SAFE = "#30d158";
const COLOR_WARN = "#ff453a";

interface Props {
  commits: CommitData[];
}

export function BusFactorCard({ commits }: Props) {
  const [depth, setDepth] = useState<number>(3);

  const entries = useMemo(() => aggregateBusFactor(commits, depth), [commits, depth]);

  const chartData = useMemo(
    () => entries.map((e) => ({ directory: e.directory, busFactor: e.contributors.length })),
    [entries],
  );

  return (
    <div className="bg-cs-surface border border-cs-border rounded-[10px] p-4">
      <h3 className="text-lg font-semibold mb-3">バスファクター</h3>

      {/* depth 切り替え */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-cs-text-secondary">階層:</span>
        {DEPTH_OPTIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDepth(d)}
            className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
              depth === d
                ? "bg-cs-primary text-white"
                : "bg-cs-surface-2 text-cs-text-secondary border border-cs-border-subtle hover:bg-cs-primary-subtle"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* 横棒グラフ */}
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 32)}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis type="number" stroke={AXIS_STROKE} fontSize={12} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="directory"
              stroke={AXIS_STROKE}
              fontSize={11}
              width={160}
              tick={{ fill: "var(--cs-text-secondary)" }}
            />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="busFactor" name="コントリビューター数" isAnimationActive={false}>
              {chartData.map((entry) => (
                <Cell key={entry.directory} fill={entry.busFactor === 1 ? COLOR_WARN : COLOR_SAFE} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* テーブル */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cs-border text-cs-text-secondary text-left">
              <th className="py-2 px-3 font-medium">ディレクトリ</th>
              <th className="py-2 px-3 font-medium w-16 text-center">BF</th>
              <th className="py-2 px-3 font-medium w-20 text-right">コミット</th>
              <th className="py-2 px-3 font-medium">コントリビューター</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isWarn = entry.contributors.length === 1;
              return (
                <tr
                  key={entry.directory}
                  className={`border-b border-cs-border-subtle ${isWarn ? "bg-red-500/10" : ""}`}
                >
                  <td className="py-2 px-3 font-mono text-xs">{entry.directory}</td>
                  <td className={`py-2 px-3 text-center font-semibold ${isWarn ? "text-[#ff453a]" : ""}`}>
                    {entry.contributors.length}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">{entry.commitCount}</td>
                  <td className="py-2 px-3 text-cs-text-secondary">{entry.contributors.join(", ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
