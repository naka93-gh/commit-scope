import { useCallback, useEffect, useRef, useState } from "react";
import { toErrorMessage } from "../../shared/errors";
import type { CommitData } from "../../shared/types";
import { rpc } from "../rpc";
import { useRecentRepos } from "./useRecentRepos";

export function useCommitAnalysis(repoPath: string) {
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamReceived, setStreamReceived] = useState(0);
  const { add: addRecentRepo } = useRecentRepos();

  const commitsRef = useRef<CommitData[]>([]);

  useEffect(() => {
    const onChunk = ({ commits: chunk, progress }: { commits: CommitData[]; progress: number }) => {
      for (const c of chunk) commitsRef.current.push(c);
      setStreamReceived(progress);
    };

    const onEnd = () => {
      setCommits(commitsRef.current);
      setLoading(false);
      addRecentRepo(repoPath);
    };

    const onError = ({ message }: { message: string }) => {
      setLoading(false);
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
  }, [addRecentRepo, repoPath]);

  useEffect(() => {
    const analyze = async () => {
      try {
        await rpc.request.analyzeRepository({ path: repoPath });
      } catch (e) {
        setError(toErrorMessage(e));
        setLoading(false);
      }
    };
    analyze();
  }, [repoPath]);

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setCommits([]);
    commitsRef.current = [];
    clearError();
    setLoading(true);
    setStreamReceived(0);
  }, [clearError]);

  return { commits, error, clearError, loading, streamReceived, reset } as const;
}
