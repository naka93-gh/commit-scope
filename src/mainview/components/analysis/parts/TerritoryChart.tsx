import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CommitData } from "../../../shared/types";
import { AXIS_STROKE, CHART_COLORS, GRID_STROKE, TOOLTIP_STYLE } from "../../../theme";
import { aggregateTerritory } from "../../../utils/aggregate";
import { DirTreeSelector } from "./DirTreeSelector";

interface Props {
  commits: CommitData[];
}

export function TerritoryChart({ commits }: Props) {
  const [selectedDirs, setSelectedDirs] = useState<Set<string>>(new Set());

  const { data, authors, allDirs, dirCounts } = useMemo(
    () => aggregateTerritory(commits, 3, selectedDirs),
    [commits, selectedDirs],
  );

  const allSelected = selectedDirs.size === 0;

  const selectAll = () => {
    setSelectedDirs(new Set());
  };

  return (
    <div className="bg-cs-surface border border-cs-border rounded-[10px] p-4">
      <h3 className="text-lg font-semibold mb-3">
        担当領域{allSelected ? `（上位 ${data.length} ディレクトリ）` : `（${data.length} ディレクトリ選択中）`}
      </h3>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-cs-text-secondary">ディレクトリ:</span>
          <button
            type="button"
            onClick={selectAll}
            className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
              allSelected
                ? "bg-cs-primary text-white"
                : "bg-cs-surface-2 text-cs-text-secondary border border-cs-border-subtle hover:bg-cs-primary-subtle"
            }`}
          >
            全て
          </button>
        </div>
        <DirTreeSelector
          allDirs={allDirs}
          dirCounts={dirCounts}
          selectedDirs={selectedDirs}
          onSelectionChange={setSelectedDirs}
        />
      </div>

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
          {authors.map((author, i) => (
            <Bar
              key={author}
              dataKey={author}
              stackId="territory"
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
