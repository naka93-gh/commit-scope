import { useMemo } from "react";
import type { CommitData } from "../../shared/types";
import { aggregateWords } from "../utils/aggregate";

interface Props {
  commits: CommitData[];
}

export function MessageAnalysis({ commits }: Props) {
  const words = useMemo(() => aggregateWords(commits, 30), [commits]);
  const maxCount = words[0]?.count ?? 1;

  return (
    <div className="bg-cs-surface border border-cs-border rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4">コミットメッセージ頻出語</h3>

      {words.length === 0 ? (
        <p className="text-cs-text-tertiary text-sm">データがありません</p>
      ) : (
        <div className="space-y-1.5">
          {words.map(({ word, count }) => (
            <div key={word} className="flex items-center gap-3">
              <code className="text-sm text-cs-text-secondary font-mono w-32 truncate shrink-0">
                {word}
              </code>
              <div className="flex-1 h-5 bg-cs-surface-2 rounded overflow-hidden">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: "var(--cs-primary)",
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="text-xs text-cs-text-tertiary font-mono w-10 text-right shrink-0">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
