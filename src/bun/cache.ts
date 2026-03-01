import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
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
