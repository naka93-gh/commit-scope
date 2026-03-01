import { useEffect, useState } from "react";
import { toErrorMessage } from "../../../../shared/errors";
import { rpc } from "../../../rpc";
import type { BranchInfo } from "../../../shared/types";

const INITIAL_DISPLAY = 20;

interface Props {
  repoPath: string;
}

type Tab = "local" | "remote";

export function BranchOverviewCard({ repoPath }: Props) {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("local");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    rpc.request
      .getBranches({ path: repoPath })
      .then((result) => {
        if (!cancelled) {
          setBranches(result);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(toErrorMessage(e));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repoPath]);

  const localBranches = branches.filter((b) => !b.isRemote);
  const remoteBranches = branches.filter((b) => b.isRemote);
  const currentBranch = localBranches.find((b) => b.isCurrent);

  const displayed = tab === "local" ? localBranches : remoteBranches;
  const showExpand = displayed.length > INITIAL_DISPLAY;
  const visibleBranches = expanded ? displayed : displayed.slice(0, INITIAL_DISPLAY);
  const hiddenCount = displayed.length - INITIAL_DISPLAY;

  return (
    <div className="bg-cs-surface border border-cs-border rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4">ブランチ概況</h3>

      {loading ? (
        <div className="text-sm text-cs-text-tertiary">読み込み中...</div>
      ) : error ? (
        <div className="text-sm text-cs-error">{error}</div>
      ) : (
        <>
          {/* タブ切替 */}
          <div className="flex gap-2 mb-3">
            <TabButton
              active={tab === "local"}
              label={`ローカル (${localBranches.length})`}
              onClick={() => {
                setTab("local");
                setExpanded(false);
              }}
            />
            <TabButton
              active={tab === "remote"}
              label={`リモート (${remoteBranches.length})`}
              onClick={() => {
                setTab("remote");
                setExpanded(false);
              }}
            />
          </div>

          {/* 現在のブランチ（ローカルタブのみ） */}
          {tab === "local" && currentBranch && (
            <div className="text-sm text-cs-text-secondary mb-3">
              現在: <span className="font-semibold text-cs-text-primary">{currentBranch.name}</span>
            </div>
          )}

          {/* ブランチ一覧テーブル */}
          {displayed.length === 0 ? (
            <div className="text-sm text-cs-text-tertiary">
              {tab === "local" ? "ローカルブランチがありません" : "リモートブランチがありません"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-cs-text-tertiary text-left border-b border-cs-border">
                      <th className="pb-2 font-medium">ブランチ名</th>
                      <th className="pb-2 font-medium">最終コミット</th>
                      <th className="pb-2 font-medium">作者</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleBranches.map((branch) => (
                      <tr key={branch.name} className="border-b border-cs-border/50 last:border-b-0">
                        <td className="py-1.5 pr-4">
                          <span className="font-mono text-xs">
                            {branch.isCurrent && <span className="text-cs-primary mr-1">&#9733;</span>}
                            {branch.name}
                          </span>
                        </td>
                        <td className="py-1.5 pr-4 text-cs-text-secondary whitespace-nowrap">
                          {formatDate(branch.lastCommitDate)}
                        </td>
                        <td className="py-1.5 text-cs-text-secondary">{branch.lastCommitAuthor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {showExpand && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="mt-2 text-xs text-cs-primary hover:underline"
                >
                  {expanded ? "折りたたむ" : `他 ${hiddenCount} 件を表示`}
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
        active ? "bg-cs-primary text-white" : "bg-cs-surface-2 text-cs-text-secondary hover:text-cs-text-primary"
      }`}
    >
      {label}
    </button>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ja-JP");
  } catch {
    return iso;
  }
}
