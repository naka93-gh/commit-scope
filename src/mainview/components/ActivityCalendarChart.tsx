import { useMemo } from "react";
import type { CommitData } from "../../shared/types";
import {
  aggregateActivityCalendar,
  type ActivityCalendarDay,
} from "../utils/aggregate";

const CELL_SIZE = 14;
const GAP = 3;
const WEEKS = 53;
const DAYS = 7;
const DAY_LABEL_WIDTH = 30;
const MONTH_LABEL_HEIGHT = 18;
const DAY_LABELS = ["", "月", "", "水", "", "金", ""] as const;
const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

interface Props {
  commits: CommitData[];
}

export function ActivityCalendarChart({ commits }: Props) {
  const days = useMemo(() => aggregateActivityCalendar(commits), [commits]);

  const maxCount = useMemo(() => {
    let max = 1;
    for (const d of days) {
      if (d.count > max) max = d.count;
    }
    return max;
  }, [days]);

  const monthLabels = useMemo(() => computeMonthLabels(days), [days]);

  if (days.length === 0) return null;

  const svgWidth = DAY_LABEL_WIDTH + WEEKS * (CELL_SIZE + GAP);
  const svgHeight = MONTH_LABEL_HEIGHT + DAYS * (CELL_SIZE + GAP);

  return (
    <div className="bg-cs-surface border border-cs-border rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4">活動カレンダー</h3>
      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight}>
          {/* 月ラベル */}
          {monthLabels.map(({ month, week }) => (
            <text
              key={`m-${month}-${week}`}
              x={DAY_LABEL_WIDTH + week * (CELL_SIZE + GAP)}
              y={12}
              fill="var(--cs-text-tertiary)"
              fontSize={10}
              fontFamily="'DM Sans', sans-serif"
            >
              {MONTH_NAMES[month]}
            </text>
          ))}

          {/* 曜日ラベル */}
          {DAY_LABELS.map((label, i) =>
            label ? (
              <text
                key={`d-${i}`}
                x={DAY_LABEL_WIDTH - 6}
                y={MONTH_LABEL_HEIGHT + i * (CELL_SIZE + GAP) + CELL_SIZE / 2 + 4}
                textAnchor="end"
                fill="var(--cs-text-tertiary)"
                fontSize={10}
                fontFamily="'DM Sans', sans-serif"
              >
                {label}
              </text>
            ) : null,
          )}

          {/* セル */}
          {days.map((day, i) => {
            const week = Math.floor(i / 7);
            const dow = i % 7;
            const intensity = day.count / maxCount;
            return (
              <rect
                key={day.date}
                x={DAY_LABEL_WIDTH + week * (CELL_SIZE + GAP)}
                y={MONTH_LABEL_HEIGHT + dow * (CELL_SIZE + GAP)}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={3}
                fill={intensityToColor(intensity)}
              >
                <title>
                  {day.date}: {day.count} コミット
                </title>
              </rect>
            );
          })}
        </svg>
      </div>

      {/* 凡例 */}
      <div className="flex items-center gap-2 mt-3 text-xs text-cs-text-tertiary">
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

/** 月ラベルの表示位置を算出する */
function computeMonthLabels(days: ActivityCalendarDay[]): { month: number; week: number }[] {
  const labels: { month: number; week: number }[] = [];
  let prevMonth = -1;

  for (let i = 0; i < days.length; i++) {
    // 各週の日曜日（i % 7 === 0）の月を見る
    if (i % 7 !== 0) continue;
    const month = parseInt(days[i].date.slice(5, 7), 10) - 1;
    if (month !== prevMonth) {
      labels.push({ month, week: Math.floor(i / 7) });
      prevMonth = month;
    }
  }

  return labels;
}

/** CSS変数ベースのグラデーション（テーマ自動対応） */
function intensityToColor(intensity: number): string {
  if (intensity === 0) return "var(--cs-surface-2)";
  const pct = Math.round(20 + intensity * 80);
  return `color-mix(in srgb, var(--cs-primary) ${pct}%, var(--cs-surface-2))`;
}
