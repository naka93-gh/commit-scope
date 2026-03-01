import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CommitData } from "../../../shared/types";
import { useRecentRepos } from "../../hooks/useRecentRepos";
import { rpc } from "../../rpc";
import { ActivityCalendarChart } from "./parts/ActivityCalendarChart";
import { BranchOverviewCard } from "./parts/BranchOverviewCard";
import { CommitFrequencyChart } from "./parts/CommitFrequencyChart";
import { CommitRow } from "./parts/CommitRow";
import { applyFilter, FilterPanel, type FilterState } from "./parts/FilterPanel";
import { HeatmapChart } from "./parts/HeatmapChart";
import { LinesChangedChart } from "./parts/LinesChangedChart";
import { LoadingDialog, STEPS_COUNT } from "./parts/LoadingDialog";
import { SummaryCard } from "./parts/SummaryCard";
import { TerritoryChart } from "./parts/TerritoryChart";

const INITIAL_FILTER: FilterState = {
  dateFrom: "",
  dateTo: "",
  selectedAuthors: new Set(),
};

interface Props {
  repoPath: string;
  onClose: () => void;
}

export function AnalysisPage({ repoPath, onClose }: Props) {
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<number | null>(0);
  const [streamReceived, setStreamReceived] = useState(0);
  const [renderedUpTo, setRenderedUpTo] = useState(0);
  const { add: addRecentRepo } = useRecentRepos();

  const commitsRef = useRef<CommitData[]>([]);

  // ストリーミングメッセージのリスナ登録
  useEffect(() => {
    const onChunk = ({ commits: chunk, progress }: { commits: CommitData[]; progress: number }) => {
      for (const c of chunk) commitsRef.current.push(c);
      setStreamReceived(progress);
    };

    const onEnd = () => {
      setCommits(commitsRef.current);
      setLoadingStep(1);
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

  // マウント時に解析開始
  useEffect(() => {
    const analyze = async () => {
      try {
        await rpc.request.analyzeRepository({ path: repoPath });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setLoadingStep(null);
      }
    };
    analyze();
  }, [repoPath]);

  // loadingStep が変わったら対応コンポーネントをマウント
  useEffect(() => {
    if (loadingStep === null || loadingStep < 1 || loadingStep > STEPS_COUNT) return;
    const raf = requestAnimationFrame(() => setRenderedUpTo(loadingStep));
    return () => cancelAnimationFrame(raf);
  }, [loadingStep]);

  // コンポーネントがマウントされたら次のステップへ or 完了
  useEffect(() => {
    if (renderedUpTo < 1) return;
    if (renderedUpTo >= STEPS_COUNT) {
      const raf = requestAnimationFrame(() => {
        setLoadingStep(null);
        addRecentRepo(repoPath);
      });
      return () => cancelAnimationFrame(raf);
    }
    const raf = requestAnimationFrame(() => setLoadingStep(renderedUpTo + 1));
    return () => cancelAnimationFrame(raf);
  }, [renderedUpTo, addRecentRepo, repoPath]);

  const filtered = useMemo(() => applyFilter(commits, filter), [commits, filter]);

  const handleCancel = useCallback(() => {
    setCommits([]);
    commitsRef.current = [];
    setFilter(INITIAL_FILTER);
    setError(null);
    setLoadingStep(null);
    setRenderedUpTo(0);
    setStreamReceived(0);
    onClose();
  }, [onClose]);

  return (
    <>
      {/* リポジトリパス表示 & 閉じるボタン */}
      <div className="flex items-center gap-2 mb-6">
        <div
          className="flex-1 px-4 py-2 bg-cs-surface border border-cs-border rounded-lg
                        text-cs-text-secondary text-sm truncate"
        >
          {repoPath}
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-2 bg-cs-surface border border-cs-border rounded-lg
                     hover:bg-cs-surface-2 transition-colors text-cs-text-secondary shrink-0"
          title="リポジトリを閉じる"
        >
          <svg
            aria-hidden="true"
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
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-cs-surface border border-cs-error/40 rounded-lg text-cs-error">{error}</div>
      )}

      {/* フィルター & サマリー (step 1) */}
      {commits.length > 0 && (loadingStep === null || renderedUpTo >= 1) && (
        <>
          <FilterPanel commits={commits} filter={filter} onChange={setFilter} />
          <div className="mb-6 grid grid-cols-3 gap-4">
            <SummaryCard label="コミット数" value={filtered.length} />
            <SummaryCard label="コミッター数" value={new Set(filtered.map((c) => c.email)).size} />
            <SummaryCard label="変更ファイル数" value={filtered.reduce((sum, c) => sum + c.files.length, 0)} />
          </div>
        </>
      )}

      {/* ブランチ概況 */}
      {commits.length > 0 && loadingStep === null && (
        <div className="mb-6">
          <BranchOverviewCard repoPath={repoPath} />
        </div>
      )}

      {/* ダッシュボード (steps 2-6) */}
      {filtered.length > 0 && (
        <div className="space-y-6 mb-6">
          {(loadingStep === null || renderedUpTo >= 2) && <CommitFrequencyChart commits={filtered} />}
          {(loadingStep === null || renderedUpTo >= 3) && <HeatmapChart commits={filtered} />}
          {(loadingStep === null || renderedUpTo >= 4) && <ActivityCalendarChart commits={filtered} />}
          {(loadingStep === null || renderedUpTo >= 5) && <LinesChangedChart commits={filtered} />}
          {(loadingStep === null || renderedUpTo >= 6) && <TerritoryChart commits={filtered} />}
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

      {/* 読み込み中ダイアログ */}
      {loadingStep !== null && (
        <LoadingDialog currentStep={loadingStep} streamReceived={streamReceived} onCancel={handleCancel} />
      )}
    </>
  );
}
