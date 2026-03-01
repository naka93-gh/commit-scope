interface Props {
  streamReceived: number;
  onCancel: () => void;
}

export function LoadingDialog({ streamReceived, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-cs-surface border border-cs-border rounded-[10px] p-8 shadow-xl
                      w-72 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cs-border border-t-cs-primary rounded-full animate-spin shrink-0" />
          <span className="text-sm text-cs-primary font-medium">
            コミットを取得中
            <span className="ml-2 font-mono text-xs">({streamReceived.toLocaleString()} 件)</span>
          </span>
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
