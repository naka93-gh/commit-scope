import { useState } from "react";
import { useRecentRepos } from "../../hooks/useRecentRepos";
import { rpc } from "../../rpc";
import { ErrorBanner } from "../ErrorBanner";

interface Props {
  onAnalyze: (path: string) => void;
}

export function WelcomePage({ onAnalyze }: Props) {
  const [repoPath, setRepoPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { repos: recentRepos, remove: removeRecentRepo } = useRecentRepos();

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

  const handleAnalyze = () => {
    if (!repoPath.trim()) return;
    onAnalyze(repoPath.trim());
  };

  const handleRecentClick = (repo: string) => {
    onAnalyze(repo);
  };

  return (
    <>
      {/* リポジトリパス入力 */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={handleSelectFolder}
          className="px-3 py-2 bg-cs-surface border border-cs-border rounded-lg
                     hover:bg-cs-surface-2 transition-colors text-cs-text-secondary shrink-0"
          title="フォルダを選択"
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
          type="button"
          onClick={handleAnalyze}
          disabled={!repoPath.trim()}
          className="px-6 py-2 bg-cs-primary hover:bg-cs-primary-hover
                     disabled:bg-cs-surface-2 disabled:text-cs-text-tertiary
                     disabled:cursor-not-allowed rounded-lg font-semibold
                     text-white transition-colors"
        >
          解析
        </button>
      </div>

      {/* 最近開いたリポジトリ */}
      {recentRepos.length > 0 && (
        <div className="mb-6 bg-cs-surface border border-cs-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-cs-text-secondary mb-2">最近開いたリポジトリ</h2>
          <div className="flex flex-wrap gap-2">
            {recentRepos.map((repo) => (
              <div
                key={repo}
                className="flex items-center gap-1 px-3 py-1.5 bg-cs-surface-2 border border-cs-border
                           rounded-lg text-sm cursor-pointer hover:border-cs-primary transition-colors group"
              >
                <button
                  type="button"
                  onClick={() => handleRecentClick(repo)}
                  className="truncate max-w-[240px] bg-transparent border-none p-0 cursor-pointer text-inherit text-left"
                  title={repo}
                >
                  {repo}
                </button>
                <button
                  type="button"
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
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
    </>
  );
}
