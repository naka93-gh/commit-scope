/** デザインガイドのチャートカラーパレット（ダークモード） */
export const CHART_COLORS = [
  "#C74B8A",
  "#E080B5",
  "#6BA3D4",
  "#80D4A8",
  "#D4C46B",
  "#A880D4",
];

/** Recharts の Tooltip / Grid 共通スタイル */
export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "var(--cs-surface)",
    border: "1px solid var(--cs-border)",
    borderRadius: "10px",
    fontFamily: "'DM Sans', sans-serif",
  },
  labelStyle: {
    color: "var(--cs-text-primary)",
  },
};

export const GRID_STROKE = "var(--cs-border-subtle)";
export const AXIS_STROKE = "var(--cs-text-tertiary)";
