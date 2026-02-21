import { useState, useCallback } from "react";
import { RECENT_REPOS_KEY, MAX_RECENT_REPOS } from "../../shared/config";

function loadRepos(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_REPOS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function saveRepos(repos: string[]): void {
  try {
    localStorage.setItem(RECENT_REPOS_KEY, JSON.stringify(repos));
  } catch {}
}

export function useRecentRepos() {
  const [repos, setRepos] = useState<string[]>(loadRepos);

  const add = useCallback((path: string) => {
    setRepos((prev) => {
      const next = [path, ...prev.filter((p) => p !== path)].slice(
        0,
        MAX_RECENT_REPOS,
      );
      saveRepos(next);
      return next;
    });
  }, []);

  const remove = useCallback((path: string) => {
    setRepos((prev) => {
      const next = prev.filter((p) => p !== path);
      saveRepos(next);
      return next;
    });
  }, []);

  return { repos, add, remove } as const;
}
