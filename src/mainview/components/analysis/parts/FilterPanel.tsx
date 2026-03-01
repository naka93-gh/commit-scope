import { useEffect, useMemo, useRef, useState } from "react";
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
    <div className="bg-cs-surface border border-cs-border rounded-[10px] p-4 mb-6">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.6px] text-cs-text-section mb-3">フィルター</h3>

      <div className="flex gap-6 flex-wrap">
        {/* 期間指定 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-cs-text-secondary">期間:</span>
          <label>
            <span className="sr-only">開始日</span>
            <input
              type="date"
              value={filter.dateFrom}
              onChange={(e) => onChange({ ...filter, dateFrom: e.target.value })}
              className="px-2 py-1 bg-cs-surface-2 border border-cs-border rounded-lg text-sm
                         text-cs-text-primary focus:outline-none focus:border-cs-primary transition-colors"
            />
          </label>
          <span className="text-cs-text-tertiary">〜</span>
          <label>
            <span className="sr-only">終了日</span>
            <input
              type="date"
              value={filter.dateTo}
              onChange={(e) => onChange({ ...filter, dateTo: e.target.value })}
              className="px-2 py-1 bg-cs-surface-2 border border-cs-border rounded-lg text-sm
                         text-cs-text-primary focus:outline-none focus:border-cs-primary transition-colors"
            />
          </label>
        </div>

        {/* コミッター選択 */}
        <CommitterPopover
          authors={authors}
          allSelected={allSelected}
          selectedAuthors={filter.selectedAuthors}
          onToggle={toggleAuthor}
          onSelectAll={selectAll}
        />
      </div>
    </div>
  );
}

function CommitterPopover({
  authors,
  allSelected,
  selectedAuthors,
  onToggle,
  onSelectAll,
}: {
  authors: [string, number][];
  allSelected: boolean;
  selectedAuthors: Set<string>;
  onToggle: (author: string) => void;
  onSelectAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = query ? authors.filter(([name]) => name.toLowerCase().includes(query.toLowerCase())) : authors;

  const selectedCount = allSelected ? authors.length : selectedAuthors.size;
  const label =
    allSelected || selectedCount === authors.length ? `全員 (${authors.length}名)` : `${selectedCount}名選択中`;

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-cs-text-secondary">コミッター:</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1 text-sm rounded-lg border border-cs-border bg-cs-surface-2
                     text-cs-text-primary hover:bg-cs-primary-subtle transition-colors
                     flex items-center gap-1"
        >
          {label}
          <span className="text-[10px] text-cs-text-tertiary ml-0.5">▼</span>
        </button>
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-cs-surface border border-cs-border rounded-lg shadow-lg">
          <div className="p-2 border-b border-cs-border">
            <input
              ref={searchRef}
              type="text"
              placeholder="検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-2 py-1 text-sm bg-cs-surface-2 border border-cs-border rounded
                         text-cs-text-primary placeholder:text-cs-text-tertiary
                         focus:outline-none focus:border-cs-primary transition-colors"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {!query && (
              <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-cs-surface-2 cursor-pointer border-b border-cs-border">
                <input type="checkbox" checked={allSelected} onChange={onSelectAll} className="accent-cs-primary" />
                <span className="text-sm text-cs-text-primary font-medium">全員</span>
              </label>
            )}
            {filtered.map(([author, count]) => {
              const checked = allSelected || selectedAuthors.has(author);
              return (
                <label
                  key={author}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-cs-surface-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(author)}
                    className="accent-cs-primary"
                  />
                  <span className="text-sm text-cs-text-primary truncate flex-1">{author}</span>
                  <span className="text-xs text-cs-text-tertiary font-mono tabular-nums">{count}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** フィルタを適用してコミットを絞り込む */
export function applyFilter(commits: CommitData[], filter: FilterState): CommitData[] {
  return commits.filter((c) => {
    if (filter.dateFrom && c.date < filter.dateFrom) return false;
    if (filter.dateTo && c.date.slice(0, 10) > filter.dateTo) return false;
    if (filter.selectedAuthors.size > 0 && !filter.selectedAuthors.has(c.author)) {
      return false;
    }
    return true;
  });
}
