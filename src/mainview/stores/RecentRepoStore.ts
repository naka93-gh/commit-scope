import { RECENT_REPOS_KEY, MAX_RECENT_REPOS } from "../../shared/config";

type Listener = () => void;

function load(): string[] {
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

function save(repos: string[]): void {
  try {
    localStorage.setItem(RECENT_REPOS_KEY, JSON.stringify(repos));
  } catch {}
}

let repos = load();
const listeners = new Set<Listener>();

function notify(): void {
  for (const fn of listeners) fn();
}

export const RecentRepoStore = {
  getSnapshot(): string[] {
    return repos;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  add(path: string): void {
    repos = [path, ...repos.filter((p) => p !== path)].slice(0, MAX_RECENT_REPOS);
    save(repos);
    notify();
  },

  remove(path: string): void {
    repos = repos.filter((p) => p !== path);
    save(repos);
    notify();
  },
};
