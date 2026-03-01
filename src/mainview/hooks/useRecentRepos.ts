import { useSyncExternalStore, useCallback } from "react";
import { RecentRepoStore } from "../stores/RecentRepoStore";

export function useRecentRepos() {
  const repos = useSyncExternalStore(
    RecentRepoStore.subscribe,
    RecentRepoStore.getSnapshot,
  );

  const add = useCallback((path: string) => RecentRepoStore.add(path), []);
  const remove = useCallback((path: string) => RecentRepoStore.remove(path), []);

  return { repos, add, remove } as const;
}
