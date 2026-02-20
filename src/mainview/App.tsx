import { useState } from "react";
import { rpc } from "./rpc";
import type { CommitData } from "../shared/types";
import { CommitFrequencyChart } from "./components/CommitFrequencyChart";

function App() {
  const [repoPath, setRepoPath] = useState("");
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold text-center mb-6">CommitScope</h1>

        {/* リポジトリパス入力 */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="リポジトリのパスを入力（例: /Users/you/project）"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                       text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !repoPath.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700
                       disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {loading ? "解析中..." : "解析"}
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* サマリー */}
        {commits.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-4">
            <SummaryCard label="コミット数" value={commits.length} />
            <SummaryCard
              label="コミッター数"
              value={new Set(commits.map((c) => c.email)).size}
            />
            <SummaryCard
              label="変更ファイル数"
              value={commits.reduce((sum, c) => sum + c.files.length, 0)}
            />
          </div>
        )}

        {/* コミット頻度チャート */}
        {commits.length > 0 && (
          <div className="mb-6">
            <CommitFrequencyChart commits={commits} />
          </div>
        )}

        {/* コミット一覧 */}
        {commits.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold mb-3">
              最近のコミット（{Math.min(commits.length, 50)} 件表示）
            </h2>
            {commits.slice(0, 50).map((commit) => (
              <CommitRow key={commit.hash} commit={commit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg text-center">
      <div className="text-2xl font-bold text-blue-400">
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function CommitRow({ commit }: { commit: CommitData }) {
  const date = new Date(commit.date);
  const additions = commit.files.reduce((s, f) => s + f.additions, 0);
  const deletions = commit.files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="p-3 bg-gray-800 rounded-lg flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{commit.message}</div>
        <div className="text-xs text-gray-500 mt-1">
          {commit.author} &middot; {date.toLocaleDateString("ja-JP")}
        </div>
      </div>
      <div className="flex gap-3 text-xs shrink-0">
        <span className="text-green-400">+{additions}</span>
        <span className="text-red-400">-{deletions}</span>
        <span className="text-gray-500">{commit.files.length} files</span>
      </div>
      <code className="text-xs text-gray-600 shrink-0">
        {commit.hash.slice(0, 7)}
      </code>
    </div>
  );
}

export default App;
