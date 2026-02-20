import { useMemo } from "react";
import type { CommitData } from "../../shared/types";

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
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">フィルター</h3>

      <div className="flex gap-6 flex-wrap">
        {/* 期間指定 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">期間:</label>
          <input
            type="date"
            value={filter.dateFrom}
            onChange={(e) => onChange({ ...filter, dateFrom: e.target.value })}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white
                       focus:outline-none focus:border-blue-500"
          />
          <span className="text-gray-500">〜</span>
          <input
            type="date"
            value={filter.dateTo}
            onChange={(e) => onChange({ ...filter, dateTo: e.target.value })}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white
                       focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* コミッター選択 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <label className="text-sm text-gray-400 mr-1">コミッター:</label>
            <button
              onClick={selectAll}
              className={`px-2 py-0.5 text-xs rounded ${
                allSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
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
                  className={`px-2 py-0.5 text-xs rounded truncate max-w-[160px] ${
                    selected
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                  title={`${author} (${count})`}
                >
                  {author}
                  <span className="ml-1 opacity-60">{count}</span>
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
