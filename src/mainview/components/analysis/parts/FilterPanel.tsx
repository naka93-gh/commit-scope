import { useMemo } from "react";
import type { CommitData } from "../../../shared/types";

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  selectedAuthors: Set<string>;
}

interface Props {
  commits: CommitData[];
  filter: FilterState;
  onChange: (filter: FilterState) => void;
}

export function FilterPanel({ commits, filter, onChange }: Props) {
  const authors = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of commits) {
      map.set(c.author, (map.get(c.author) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [commits]);

  const allSelected = filter.selectedAuthors.size === 0;

  const toggleAuthor = (author: string) => {
    const next = new Set(filter.selectedAuthors);
    if (next.has(author)) {
      next.delete(author);
    } else {
      next.add(author);
    }
    onChange({ ...filter, selectedAuthors: next });
  };

  const selectAll = () => {
    onChange({ ...filter, selectedAuthors: new Set() });
  };

  return (
    <div className="bg-cs-surface border border-cs-border rounded-xl p-4 mb-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-cs-primary mb-3">
        フィルター
      </h3>

      <div className="flex gap-6 flex-wrap">
        {/* 期間指定 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-cs-text-secondary">期間:</label>
          <input
            type="date"
            value={filter.dateFrom}
            onChange={(e) => onChange({ ...filter, dateFrom: e.target.value })}
            className="px-2 py-1 bg-cs-surface-2 border border-cs-border rounded-lg text-sm
                       text-cs-text-primary focus:outline-none focus:border-cs-primary transition-colors"
          />
          <span className="text-cs-text-tertiary">〜</span>
          <input
            type="date"
            value={filter.dateTo}
            onChange={(e) => onChange({ ...filter, dateTo: e.target.value })}
            className="px-2 py-1 bg-cs-surface-2 border border-cs-border rounded-lg text-sm
                       text-cs-text-primary focus:outline-none focus:border-cs-primary transition-colors"
          />
        </div>

        {/* コミッター選択 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <label className="text-sm text-cs-text-secondary mr-1">
              コミッター:
            </label>
            <button
              onClick={selectAll}
              className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
                allSelected
                  ? "bg-cs-primary text-white"
                  : "bg-cs-surface-2 text-cs-text-secondary border border-cs-border-subtle hover:bg-cs-primary-subtle"
              }`}
            >
              全員
            </button>
            {authors.map(([author, count]) => {
              const selected = allSelected || filter.selectedAuthors.has(author);
              return (
                <button
                  key={author}
                  onClick={() => toggleAuthor(author)}
                  className={`px-2 py-0.5 text-xs rounded-lg truncate max-w-[160px] transition-colors ${
                    selected
                      ? "bg-cs-primary text-white"
                      : "bg-cs-surface-2 text-cs-text-secondary border border-cs-border-subtle hover:bg-cs-primary-subtle"
                  }`}
                  title={`${author} (${count})`}
                >
                  {author}
                  <span className="ml-1 opacity-60 font-mono">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** フィルタを適用してコミットを絞り込む */
export function applyFilter(
  commits: CommitData[],
  filter: FilterState,
): CommitData[] {
  return commits.filter((c) => {
    if (filter.dateFrom && c.date < filter.dateFrom) return false;
    if (filter.dateTo && c.date.slice(0, 10) > filter.dateTo) return false;
    if (
      filter.selectedAuthors.size > 0 &&
      !filter.selectedAuthors.has(c.author)
    ) {
      return false;
    }
    return true;
  });
}
