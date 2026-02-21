import { useState, useRef, useMemo, useEffect } from "react";
import { rpc } from "./rpc";
import type { CommitData } from "../shared/types";
import { CommitFrequencyChart } from "./components/CommitFrequencyChart";
import { HeatmapChart } from "./components/HeatmapChart";
import { LinesChangedChart } from "./components/LinesChangedChart";
import { TerritoryChart } from "./components/TerritoryChart";
import {
  FilterPanel,
  applyFilter,
  type FilterState,
} from "./components/FilterPanel";
import { BranchOverviewCard } from "./components/BranchOverviewCard";
import { THEME, THEME_STORAGE_KEY, type Theme } from "../shared/config";
import { useRecentRepos } from "./hooks/useRecentRepos";

const INITIAL_FILTER: FilterState = {
  dateFrom: "",
  dateTo: "",
  selectedAuthors: new Set(),
};

const LOADING_STEPS = [
  { label: "コミットを取得中" },
  { label: "フィルターを集計中" },
  { label: "コミット頻度を集計中" },
  { label: "ヒートマップを集計中" },
  { label: "変更行数を集計中" },
  { label: "担当領域を集計中" },
] as const;

const STEPS_COUNT = LOADING_STEPS.length - 1; // streaming(0)を除いた集計ステップ数

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
  const [error, setError] = useState<string | null>(null);
  // null=非ロード, 0=streaming, 1-5=集計ステップ
  const [loadingStep, setLoadingStep] = useState<number | null>(null);
  const [streamReceived, setStreamReceived] = useState(0);
  // どのコンポーネントまでマウント済みか (0=なし, 1=Filter, ..., 6=全部)
  const [renderedUpTo, setRenderedUpTo] = useState(0);
  const { repos: recentRepos, add: addRecentRepo, remove: removeRecentRepo } = useRecentRepos();

  // ストリーム中に蓄積するための ref（チャンク受信ごとに新配列を生成するのを避ける）
  const commitsRef = useRef<CommitData[]>([]);
  const analyzePathRef = useRef("");

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // ストリーミングメッセージのリスナ登録
  useEffect(() => {
    const onChunk = ({ commits: chunk, progress }: { commits: CommitData[]; progress: number }) => {
      for (const c of chunk) commitsRef.current.push(c);
      setStreamReceived(progress);
    };

    const onEnd = () => {
      setCommits(commitsRef.current);
      setLoadingStep(1); // 集計フェーズへ遷移
    };

    const onError = ({ message }: { message: string }) => {
      setLoadingStep(null);
      setError(message);
    };

    rpc.addMessageListener("commitChunk", onChunk);
    rpc.addMessageListener("commitStreamEnd", onEnd);
    rpc.addMessageListener("commitStreamError", onError);

    return () => {
      rpc.removeMessageListener("commitChunk", onChunk);
      rpc.removeMessageListener("commitStreamEnd", onEnd);
      rpc.removeMessageListener("commitStreamError", onError);
    };
  }, []);

  // loadingStep が変わったら → ラベル描画後に対応コンポーネントをマウント
  useEffect(() => {
    if (loadingStep === null || loadingStep < 1 || loadingStep > STEPS_COUNT) return;
    const raf = requestAnimationFrame(() => setRenderedUpTo(loadingStep));
    return () => cancelAnimationFrame(raf);
  }, [loadingStep]);

  // コンポーネントがマウントされたら → 次のステップへ or 完了
  useEffect(() => {
    if (renderedUpTo < 1) return;
    if (renderedUpTo >= STEPS_COUNT) {
      const raf = requestAnimationFrame(() => {
        setLoadingStep(null);
        addRecentRepo(analyzePathRef.current);
      });
      return () => cancelAnimationFrame(raf);
    }
    const raf = requestAnimationFrame(() => setLoadingStep(renderedUpTo + 1));
    return () => cancelAnimationFrame(raf);
  }, [renderedUpTo, addRecentRepo]);

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

  const handleReset = () => {
    setCommits([]);
    commitsRef.current = [];
    setFilter(INITIAL_FILTER);
    setError(null);
    setLoadingStep(null);
    setRenderedUpTo(0);
    setStreamReceived(0);
  };

  const handleAnalyze = async () => {
    if (!repoPath.trim()) return;

    setLoadingStep(0);
    setStreamReceived(0);
    setRenderedUpTo(0);
    setError(null);
    setCommits([]);
    commitsRef.current = [];
    analyzePathRef.current = repoPath.trim();

    try {
      await rpc.request.analyzeRepository({ path: repoPath.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoadingStep(null);
    }
  };

  return (
    <div className={theme === THEME.DARK ? "dark" : ""}>
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
              placeholder="リポジトリのパスを入力、または左のボタンで選択"
              className="flex-1 px-4 py-2 bg-cs-surface border border-cs-border rounded-lg
                         text-cs-text-primary placeholder-cs-text-tertiary
                         focus:outline-none focus:border-cs-primary transition-colors"
            />
            <button
              onClick={handleAnalyze}
              disabled={loadingStep !== null || !repoPath.trim()}
              className="px-6 py-2 bg-cs-primary hover:bg-cs-primary-hover
                         disabled:bg-cs-surface-2 disabled:text-cs-text-tertiary
                         disabled:cursor-not-allowed rounded-lg font-semibold
                         text-white transition-colors"
            >
              解析
            </button>
            {commits.length > 0 && (
              <button
                onClick={handleReset}
                className="px-3 py-2 bg-cs-surface border border-cs-border rounded-lg
                           hover:bg-cs-surface-2 transition-colors text-cs-text-secondary shrink-0"
                title="リポジトリを閉じる"
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
                  <path d="M5 5l8 8M13 5l-8 8" />
                </svg>
              </button>
            )}
          </div>

          {/* 最近開いたリポジトリ */}
          {commits.length === 0 && recentRepos.length > 0 && (
            <div className="mb-6 bg-cs-surface border border-cs-border rounded-xl p-4">
              <h2 className="text-sm font-semibold text-cs-text-secondary mb-2">
                最近開いたリポジトリ
              </h2>
              <div className="flex flex-wrap gap-2">
                {recentRepos.map((repo) => (
                  <div
                    key={repo}
                    className="flex items-center gap-1 px-3 py-1.5 bg-cs-surface-2 border border-cs-border
                               rounded-lg text-sm cursor-pointer hover:border-cs-primary transition-colors group"
                  >
                    <span
                      onClick={() => setRepoPath(repo)}
                      className="truncate max-w-[240px]"
                      title={repo}
                    >
                      {repo}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentRepo(repo);
                      }}
                      className="ml-1 text-cs-text-tertiary hover:text-cs-error transition-colors shrink-0"
                      title="履歴から削除"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-cs-surface border border-cs-error/40 rounded-lg text-cs-error">
              {error}
            </div>
          )}

          {/* フィルター & サマリー (step 1) */}
          {commits.length > 0 && (loadingStep === null || renderedUpTo >= 1) && (
            <>
              <FilterPanel
                commits={commits}
                filter={filter}
                onChange={setFilter}
              />
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
            </>
          )}

          {/* ブランチ概況 */}
          {commits.length > 0 && loadingStep === null && (
            <div className="mb-6">
              <BranchOverviewCard repoPath={repoPath.trim()} />
            </div>
          )}

          {/* ダッシュボード (steps 2-6) */}
          {filtered.length > 0 && (
            <div className="space-y-6 mb-6">
              {(loadingStep === null || renderedUpTo >= 2) && (
                <CommitFrequencyChart commits={filtered} />
              )}
              {(loadingStep === null || renderedUpTo >= 3) && (
                <HeatmapChart commits={filtered} />
              )}
              {(loadingStep === null || renderedUpTo >= 4) && (
                <LinesChangedChart commits={filtered} />
              )}
              {(loadingStep === null || renderedUpTo >= 5) && (
                <TerritoryChart commits={filtered} />
              )}
            </div>
          )}

          {/* コミット一覧 */}
          {filtered.length > 0 && loadingStep === null && (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold mb-3">
                最近のコミット（{Math.min(filtered.length, 100)} / {filtered.length} 件）
              </h2>
              {filtered.slice(0, 100).map((commit) => (
                <CommitRow key={commit.hash} commit={commit} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 読み込み中ダイアログ */}
      {loadingStep !== null && (
        <LoadingDialog
          currentStep={loadingStep}
          streamReceived={streamReceived}
          onCancel={handleReset}
        />
      )}
    </div>
  );
}

function LoadingDialog({
  currentStep,
  streamReceived,
  onCancel,
}: {
  currentStep: number;
  streamReceived: number;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-cs-surface border border-cs-border rounded-2xl p-8 shadow-xl
                      w-80 space-y-5">
        <div className="space-y-2">
          {LOADING_STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
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
                    <span className="ml-2 font-mono text-xs">
                      ({streamReceived.toLocaleString()} 件)
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
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
      <div className="min-w-0" style={{ flex: "1 1 0", maxWidth: "calc(100% - 280px)" }}>
        <div className="text-sm truncate">{commit.message}</div>
        <div className="text-xs text-cs-text-tertiary mt-1">
          {commit.author} &middot; {date.toLocaleDateString("ja-JP")}
        </div>
      </div>
      <div className="flex gap-3 text-xs font-mono shrink-0">
        <span className="text-cs-success w-16 text-right">+{additions}</span>
        <span className="text-cs-error w-16 text-right">-{deletions}</span>
        <span className="text-cs-text-tertiary w-20 text-right">
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
