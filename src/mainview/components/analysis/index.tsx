import { useCallback, useMemo, useState } from "react";
import { MAX_DISPLAY_COMMITS } from "../../../shared/config";
import { useCommitAnalysis } from "../../hooks/useCommitAnalysis";
import { ErrorBanner } from "../ErrorBanner";
import { ActivityCalendarChart } from "./parts/ActivityCalendarChart";
import { BranchOverviewCard } from "./parts/BranchOverviewCard";
import { CommitFrequencyChart } from "./parts/CommitFrequencyChart";
import { CommitRow } from "./parts/CommitRow";
import { applyFilter, FilterPanel, type FilterState } from "./parts/FilterPanel";
import { HeatmapChart } from "./parts/HeatmapChart";
import { LinesChangedChart } from "./parts/LinesChangedChart";
import { LoadingDialog } from "./parts/LoadingDialog";
import { SummaryCard } from "./parts/SummaryCard";
import { TerritoryChart } from "./parts/TerritoryChart";

const INITIAL_FILTER: FilterState = {
  dateFrom: "",
  dateTo: "",
  selectedAuthors: new Set(),
};

type SectionKey = "overview" | "frequency" | "heatmap" | "activity" | "lines" | "territory" | "commits";

interface NavItem {
  key: SectionKey;
  label: string;
  color: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "概要",
    items: [{ key: "overview", label: "ブランチ概況", color: "#bf5af2" }],
  },
  {
    title: "分析",
    items: [
      { key: "frequency", label: "コミット頻度", color: "#5ac8fa" },
      { key: "heatmap", label: "ヒートマップ", color: "#ff9f0a" },
      { key: "activity", label: "アクティビティ", color: "#30d158" },
      { key: "lines", label: "変更行数", color: "#ffd60a" },
      { key: "territory", label: "担当領域", color: "#ff453a" },
    ],
  },
  {
    title: "データ",
    items: [{ key: "commits", label: "コミット一覧", color: "#8e8e93" }],
  },
];

interface Props {
  repoPath: string;
  onClose: () => void;
}

export function AnalysisPage({ repoPath, onClose }: Props) {
  const { commits, error, clearError, loading, streamReceived, reset } = useCommitAnalysis(repoPath);
  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");

  const filtered = useMemo(() => applyFilter(commits, filter), [commits, filter]);

  const handleCancel = useCallback(() => {
    reset();
    setFilter(INITIAL_FILTER);
    onClose();
  }, [reset, onClose]);

  const ready = commits.length > 0 && !loading;

  return (
    <>
      <div className="flex min-h-0 flex-1">
        {/* サイドバー */}
        <aside
          className="w-[260px] shrink-0 border-r border-cs-border bg-cs-sidebar
                     backdrop-blur-xl flex flex-col"
        >
          <nav className="flex-1 py-5 overflow-y-auto space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="px-3">
                <div className="px-3 mb-1 text-[11px] font-medium uppercase tracking-[0.6px] text-cs-text-section">
                  {group.title}
                </div>
                <div className="flex flex-col gap-px">
                  {group.items.map(({ key, label, color }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveSection(key)}
                      disabled={!ready}
                      className={`w-full text-left flex items-center gap-2.5
                        px-3 py-[7px] rounded-md text-[13px] transition-[background] duration-150
                        ${activeSection === key ? "bg-cs-active font-medium" : "hover:bg-cs-active"}
                        ${!ready ? "opacity-40 cursor-not-allowed" : ""}
                      `}
                    >
                      <span className="w-4 h-4 rounded-[3px] shrink-0 opacity-60" style={{ backgroundColor: color }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* リポジトリパス & 閉じるボタン */}
          <div className="border-t border-cs-border px-4 py-3 space-y-2.5">
            <div className="text-[11px] font-mono text-cs-text-tertiary truncate" title={repoPath}>
              {repoPath}
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px]
                         text-cs-text-secondary hover:text-cs-text-primary
                         bg-cs-active rounded-md
                         hover:bg-cs-surface-2 transition-colors"
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 5l8 8M13 5l-8 8" />
              </svg>
              閉じる
            </button>
          </div>
        </aside>

        {/* メインエリア */}
        <main className="flex-1 overflow-y-auto bg-cs-content p-7">
          {/* エラー表示 */}
          {error && <ErrorBanner message={error} onClose={clearError} />}

          {ready && (
            <>
              {/* フィルター & サマリー */}
              <FilterPanel commits={commits} filter={filter} onChange={setFilter} />
              <div className="mb-6 grid grid-cols-3 gap-4">
                <SummaryCard label="コミット数" value={filtered.length} />
                <SummaryCard label="コミッター数" value={new Set(filtered.map((c) => c.email)).size} />
                <SummaryCard label="変更ファイル数" value={filtered.reduce((sum, c) => sum + c.files.length, 0)} />
              </div>

              {/* セクションコンテンツ */}
              <SectionContent section={activeSection} filtered={filtered} repoPath={repoPath} />
            </>
          )}
        </main>
      </div>

      {/* 読み込み中ダイアログ */}
      {loading && <LoadingDialog streamReceived={streamReceived} onCancel={handleCancel} />}
    </>
  );
}

function SectionContent({
  section,
  filtered,
  repoPath,
}: {
  section: SectionKey;
  filtered: readonly import("../../../shared/types").CommitData[];
  repoPath: string;
}) {
  switch (section) {
    case "overview":
      return <BranchOverviewCard repoPath={repoPath} />;
    case "frequency":
      return <CommitFrequencyChart commits={filtered} />;
    case "heatmap":
      return <HeatmapChart commits={filtered} />;
    case "activity":
      return <ActivityCalendarChart commits={filtered} />;
    case "lines":
      return <LinesChangedChart commits={filtered} />;
    case "territory":
      return <TerritoryChart commits={filtered} />;
    case "commits":
      return (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold mb-3">
            最近のコミット（{Math.min(filtered.length, MAX_DISPLAY_COMMITS)} / {filtered.length} 件）
          </h2>
          {filtered.slice(0, MAX_DISPLAY_COMMITS).map((commit) => (
            <CommitRow key={commit.hash} commit={commit} />
          ))}
        </div>
      );
  }
}
