import { useCallback, useEffect, useRef, useState } from "react";
import { toErrorMessage } from "../../shared/errors";
import type { CommitData } from "../../shared/types";
import { STEPS_COUNT } from "../components/Analysis/parts/LoadingDialog";
import { rpc } from "../rpc";
import { useRecentRepos } from "./useRecentRepos";

export function useCommitAnalysis(repoPath: string) {
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<number | null>(0);
  const [streamReceived, setStreamReceived] = useState(0);
  const [renderedUpTo, setRenderedUpTo] = useState(0);
  const { add: addRecentRepo } = useRecentRepos();

  const commitsRef = useRef<CommitData[]>([]);

  // ストリーミングメッセージのリスナ登録
  useEffect(() => {
    const onChunk = ({
      commits: chunk,
      progress,
    }: {
      commits: CommitData[];
      progress: number;
    }) => {
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
        setError(toErrorMessage(e));
        setLoadingStep(null);
      }
    };
    analyze();
  }, [repoPath]);

  // loadingStep が変わったら対応コンポーネントをマウント
  useEffect(() => {
    if (loadingStep === null || loadingStep < 1 || loadingStep > STEPS_COUNT)
      return;
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

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setCommits([]);
    commitsRef.current = [];
    clearError();
    setLoadingStep(null);
    setRenderedUpTo(0);
    setStreamReceived(0);
  }, [clearError]);

  return {
    commits,
    error,
    clearError,
    loadingStep,
    streamReceived,
    renderedUpTo,
    reset,
  } as const;
}
