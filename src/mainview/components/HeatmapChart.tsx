import { useMemo } from "react";
import type { CommitData } from "../../shared/types";
import { aggregateHeatmap } from "../utils/aggregate";

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];
const CELL_SIZE = 28;
const GAP = 2;

interface Props {
  commits: CommitData[];
}

export function HeatmapChart({ commits }: Props) {
  const cells = useMemo(() => aggregateHeatmap(commits), [commits]);
  const maxCount = Math.max(...cells.map((c) => c.count), 1);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">時間帯ヒートマップ</h3>
      <div className="overflow-x-auto">
        <svg
          width={80 + 24 * (CELL_SIZE + GAP)}
          height={30 + 7 * (CELL_SIZE + GAP)}
        >
          {/* 時間ラベル */}
          {Array.from({ length: 24 }, (_, h) => (
            <text
              key={`h-${h}`}
              x={80 + h * (CELL_SIZE + GAP) + CELL_SIZE / 2}
              y={16}
              textAnchor="middle"
              fill="#9ca3af"
              fontSize={10}
            >
              {h}
            </text>
          ))}

          {/* 曜日ラベル + セル */}
          {DAY_LABELS.map((label, day) => (
            <g key={`day-${day}`}>
              <text
                x={60}
                y={30 + day * (CELL_SIZE + GAP) + CELL_SIZE / 2 + 4}
                textAnchor="end"
                fill="#9ca3af"
                fontSize={12}
              >
                {label}
              </text>
              {Array.from({ length: 24 }, (_, hour) => {
                const cell = cells.find(
                  (c) => c.day === day && c.hour === hour,
                );
                const count = cell?.count ?? 0;
                const intensity = count / maxCount;
                return (
                  <rect
                    key={`${day}-${hour}`}
                    x={80 + hour * (CELL_SIZE + GAP)}
                    y={30 + day * (CELL_SIZE + GAP)}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={4}
                    fill={intensityToColor(intensity)}
                  >
                    <title>
                      {label} {hour}時: {count} コミット
                    </title>
                  </rect>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      {/* 凡例 */}
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
        <span>少</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <div
            key={v}
            className="w-4 h-4 rounded"
            style={{ backgroundColor: intensityToColor(v) }}
          />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}

function intensityToColor(intensity: number): string {
  if (intensity === 0) return "#1f2937";
  // 青系のグラデーション
  const r = Math.round(30 + intensity * 29);
  const g = Math.round(41 + intensity * 89);
  const b = Math.round(59 + intensity * 187);
  return `rgb(${r}, ${g}, ${b})`;
}
