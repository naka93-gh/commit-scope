const LOADING_STEPS = [
  { label: "コミットを取得中" },
  { label: "フィルターを集計中" },
  { label: "コミット頻度を集計中" },
  { label: "ヒートマップを集計中" },
  { label: "活動カレンダーを集計中" },
  { label: "変更行数を集計中" },
  { label: "担当領域を集計中" },
] as const;

export const STEPS_COUNT = LOADING_STEPS.length - 1;

interface Props {
  currentStep: number;
  streamReceived: number;
  onCancel: () => void;
}

export function LoadingDialog({ currentStep, streamReceived, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-cs-surface border border-cs-border rounded-2xl p-8 shadow-xl
                      w-80 space-y-5"
      >
        <div className="space-y-2">
          {LOADING_STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div key={step.label} className="flex items-center gap-3 text-sm">
                {isDone ? (
                  <span className="text-cs-success shrink-0">{"\u2713"}</span>
                ) : isActive ? (
                  <div className="w-4 h-4 border-2 border-cs-border border-t-cs-primary rounded-full animate-spin shrink-0" />
                ) : (
                  <span className="text-cs-text-tertiary shrink-0">{"\u25CB"}</span>
                )}
                <span
                  className={
                    isDone
                      ? "text-cs-text-secondary"
                      : isActive
                        ? "text-cs-primary font-medium"
                        : "text-cs-text-tertiary"
                  }
                >
                  {step.label}
                  {i === 0 && (isDone || isActive) && (
                    <span className="ml-2 font-mono text-xs">({streamReceived.toLocaleString()} 件)</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-cs-text-secondary hover:text-cs-text-primary
                       bg-cs-surface-2 border border-cs-border rounded-lg
                       hover:bg-cs-border transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
