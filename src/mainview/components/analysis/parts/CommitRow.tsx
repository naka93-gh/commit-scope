import type { CommitData } from "../../../shared/types";

interface Props {
  commit: CommitData;
}

export function CommitRow({ commit }: Props) {
  const date = new Date(commit.date);
  const additions = commit.files.reduce((s, f) => s + f.additions, 0);
  const deletions = commit.files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="p-3 bg-cs-surface border border-cs-border rounded-xl flex items-center gap-4">
      <div className="min-w-0" style={{ flex: "1 1 0", maxWidth: "calc(100% - 280px)" }}>
        <div className="text-sm truncate">{commit.message}</div>
        <div className="text-xs text-cs-text-tertiary mt-1">
          {commit.author} &middot; {date.toLocaleDateString("ja-JP")}
        </div>
      </div>
      <div className="flex gap-3 text-xs font-mono shrink-0">
        <span className="text-cs-success w-16 text-right">+{additions}</span>
        <span className="text-cs-error w-16 text-right">-{deletions}</span>
        <span className="text-cs-text-tertiary w-20 text-right">{commit.files.length} files</span>
      </div>
      <code className="text-xs text-cs-text-tertiary font-mono shrink-0">{commit.hash.slice(0, 7)}</code>
    </div>
  );
}
