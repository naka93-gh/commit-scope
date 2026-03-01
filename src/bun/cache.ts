import { mkdir, readdir, stat, unlink, utimes } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { CACHE_MAX_ENTRIES } from "../shared/config";
import type { CommitData } from "../shared/types";

interface CommitCache {
  headHash: string;
  commits: CommitData[];
}

const CACHE_DIR = join(homedir(), ".cache", "commitscope");

function getCachePath(repoPath: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(repoPath);
  return join(CACHE_DIR, `${hasher.digest("hex")}.json`);
}

/** キャッシュを読み込む。存在しない・不正な場合は null */
export async function readCache(repoPath: string): Promise<CommitCache | null> {
  try {
    const file = Bun.file(getCachePath(repoPath));
    const data: unknown = await file.json();
    if (
      typeof data === "object" &&
      data !== null &&
      "headHash" in data &&
      "commits" in data &&
      typeof (data as CommitCache).headHash === "string" &&
      Array.isArray((data as CommitCache).commits)
    ) {
      return data as CommitCache;
    }
    return null;
  } catch {
    return null;
  }
}

/** キャッシュをディスクに書き込む */
export async function writeCache(repoPath: string, headHash: string, commits: CommitData[]): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  const cache: CommitCache = { headHash, commits };
  await Bun.write(getCachePath(repoPath), JSON.stringify(cache));
}

/** キャッシュファイルの mtime を現在時刻に更新（LRU マーカー） */
export async function touchCache(repoPath: string): Promise<void> {
  const now = new Date();
  await utimes(getCachePath(repoPath), now, now);
}

/** CACHE_DIR 内の .json ファイルが上限を超えていれば mtime が古い順に削除 */
export async function evictCache(): Promise<void> {
  const entries = await readdir(CACHE_DIR).catch(() => []);
  const jsonFiles = entries.filter((f) => f.endsWith(".json"));
  if (jsonFiles.length <= CACHE_MAX_ENTRIES) return;

  const withMtime = await Promise.all(
    jsonFiles.map(async (name) => {
      const filePath = join(CACHE_DIR, name);
      const s = await stat(filePath);
      return { filePath, mtimeMs: s.mtimeMs };
    }),
  );

  withMtime.sort((a, b) => a.mtimeMs - b.mtimeMs);
  const toDelete = withMtime.slice(0, withMtime.length - CACHE_MAX_ENTRIES);
  await Promise.all(toDelete.map(({ filePath }) => unlink(filePath)));
}
