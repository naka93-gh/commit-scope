interface Props {
  message: string;
  onClose?: () => void;
}

export function ErrorBanner({ message, onClose }: Props) {
  return (
    <div className="mb-6 p-4 bg-cs-surface border border-cs-error/40 rounded-lg text-cs-error flex items-start gap-2">
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-cs-error hover:text-cs-error/70 transition-colors"
          title="閉じる"
        >
          &#x2715;
        </button>
      )}
    </div>
  );
}
