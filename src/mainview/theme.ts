/** Readout アクセントパレットに基づくチャートカラー */
export const CHART_COLORS = ["#5ac8fa", "#30d158", "#ff9f0a", "#bf5af2", "#ffd60a", "#ff453a"];

/** Recharts の Tooltip / Grid 共通スタイル */
export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "var(--cs-surface)",
    border: "1px solid var(--cs-border)",
    borderRadius: "10px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
  },
  labelStyle: {
    color: "var(--cs-text-primary)",
  },
  wrapperStyle: {
    zIndex: 10,
  },
};

export const GRID_STROKE = "var(--cs-border-subtle)";
export const AXIS_STROKE = "var(--cs-text-tertiary)";
