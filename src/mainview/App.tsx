import { useState, useMemo, useEffect } from "react";
import { rpc } from "./rpc";
import type { CommitData } from "../shared/types";
import { CommitFrequencyChart } from "./components/CommitFrequencyChart";
import { HeatmapChart } from "./components/HeatmapChart";
import { LinesChangedChart } from "./components/LinesChangedChart";
import { DirectoryChart } from "./components/DirectoryChart";
import { MessageAnalysis } from "./components/MessageAnalysis";
import {
  FilterPanel,
  applyFilter,
  type FilterState,
} from "./components/FilterPanel";
import { THEME, THEME_STORAGE_KEY, type Theme } from "../shared/config";

const INITIAL_FILTER: FilterState = {
  dateFrom: "",
  dateTo: "",
  selectedAuthors: new Set(),
};

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === THEME.LIGHT || stored === THEME.DARK) return stored;
  } catch {}
  return THEME.DARK;
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [repoPath, setRepoPath] = useState("");
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === THEME.DARK ? THEME.LIGHT : THEME.DARK));

  const filtered = useMemo(
    () => applyFilter(commits, filter),
    [commits, filter],
  );

  const handleSelectFolder = async () => {
    try {
      const path = await rpc.request.selectRepository({
        startingFolder: repoPath.trim() || undefined,
      });
      if (path) {
        setRepoPath(path);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleAnalyze = async () => {
    if (!repoPath.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await rpc.request.analyzeRepository({
        path: repoPath.trim(),
      });
      setCommits(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={theme === THEME.DARK ? THEME.DARK : ""}>
      <div className="min-h-screen bg-cs-bg text-cs-text-primary font-sans">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* ヘッダー */}
          <div className="flex items-center justify-center mb-6 relative">
            <h1 className="text-3xl font-bold">CommitScope</h1>
            <button
              onClick={toggleTheme}
              className="absolute right-0 p-2 rounded-lg bg-cs-surface border border-cs-border
                         hover:bg-cs-surface-2 transition-colors text-sm"
              title={
                theme === THEME.DARK
                  ? "ライトモードに切替"
                  : "ダークモードに切替"
              }
            >
              {theme === THEME.DARK ? "\u2600\uFE0F" : "\uD83C\uDF19"}
            </button>
          </div>

          {/* リポジトリパス入力 */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={handleSelectFolder}
              className="px-3 py-2 bg-cs-surface border border-cs-border rounded-lg
                         hover:bg-cs-surface-2 transition-colors text-cs-text-secondary shrink-0"
              title="フォルダを選択"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 5a1 1 0 0 1 1-1h4l2 2h5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5z" />
              </svg>
            </button>
            <input
              type="text"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="リポジトリのパスを入力、または左のボタンで選択"
              className="flex-1 px-4 py-2 bg-cs-surface border border-cs-border rounded-lg
                         text-cs-text-primary placeholder-cs-text-tertiary
                         focus:outline-none focus:border-cs-primary transition-colors"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !repoPath.trim()}
              className="px-6 py-2 bg-cs-primary hover:bg-cs-primary-hover
                         disabled:bg-cs-surface-2 disabled:text-cs-text-tertiary
                         disabled:cursor-not-allowed rounded-lg font-semibold
                         text-white transition-colors"
            >
              {loading ? "解析中..." : "解析"}
            </button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-cs-surface border border-cs-error/40 rounded-lg text-cs-error">
              {error}
            </div>
          )}

          {/* フィルター */}
          {commits.length > 0 && (
            <FilterPanel
              commits={commits}
              filter={filter}
              onChange={setFilter}
            />
          )}

          {/* サマリー */}
          {commits.length > 0 && (
            <div className="mb-6 grid grid-cols-3 gap-4">
              <SummaryCard label="コミット数" value={filtered.length} />
              <SummaryCard
                label="コミッター数"
                value={new Set(filtered.map((c) => c.email)).size}
              />
              <SummaryCard
                label="変更ファイル数"
                value={filtered.reduce((sum, c) => sum + c.files.length, 0)}
              />
            </div>
          )}

          {/* ダッシュボード */}
          {filtered.length > 0 && (
            <div className="space-y-6 mb-6">
              <CommitFrequencyChart commits={filtered} />
              <HeatmapChart commits={filtered} />
              <LinesChangedChart commits={filtered} />
              <div className="grid grid-cols-2 gap-6">
                <DirectoryChart commits={filtered} />
                <MessageAnalysis commits={filtered} />
              </div>
            </div>
          )}

          {/* コミット一覧 */}
          {filtered.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold mb-3">
                最近のコミット（{Math.min(filtered.length, 50)} 件表示）
              </h2>
              {filtered.slice(0, 50).map((commit) => (
                <CommitRow key={commit.hash} commit={commit} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 bg-cs-primary-subtle border border-cs-primary-muted rounded-xl text-center">
      <div className="text-2xl font-bold text-cs-primary font-mono">
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-cs-text-tertiary mt-1">{label}</div>
    </div>
  );
}

function CommitRow({ commit }: { commit: CommitData }) {
  const date = new Date(commit.date);
  const additions = commit.files.reduce((s, f) => s + f.additions, 0);
  const deletions = commit.files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="p-3 bg-cs-surface border border-cs-border rounded-xl flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{commit.message}</div>
        <div className="text-xs text-cs-text-tertiary mt-1">
          {commit.author} &middot; {date.toLocaleDateString("ja-JP")}
        </div>
      </div>
      <div className="flex gap-3 text-xs font-mono shrink-0">
        <span className="text-cs-success">+{additions}</span>
        <span className="text-cs-error">-{deletions}</span>
        <span className="text-cs-text-tertiary">
          {commit.files.length} files
        </span>
      </div>
      <code className="text-xs text-cs-text-tertiary font-mono shrink-0">
        {commit.hash.slice(0, 7)}
      </code>
    </div>
  );
}

export default App;
