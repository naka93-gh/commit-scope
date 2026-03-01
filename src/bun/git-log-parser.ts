import { stat } from "node:fs/promises";
import { join } from "node:path";
import type { CommitData, FileChange } from "../shared/types";

const SEPARATOR = "---COMMIT_END---";
const FORMAT = ["Hash:%H", "Author:%an", "Email:%ae", "Date:%aI", "Message:%s"].join("%n");

const STREAM_CHUNK_SIZE = 100;

/** 指定パスが有効な Git リポジトリか検証する */
export async function validateRepoPath(repoPath: string): Promise<void> {
  let dirStat: Awaited<ReturnType<typeof stat>> | undefined;
  try {
    dirStat = await stat(repoPath);
  } catch {
    throw new Error(`パスが見つかりません: ${repoPath}`);
  }

  if (!dirStat.isDirectory()) {
    throw new Error(`ディレクトリではありません: ${repoPath}`);
  }

  try {
    const gitStat = await stat(join(repoPath, ".git"));
    if (!gitStat.isDirectory()) {
      throw new Error(`Git リポジトリではありません: ${repoPath}`);
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Git リポジトリ")) throw e;
    throw new Error(`Git リポジトリではありません: ${repoPath}`);
  }
}

/** HEAD のコミットハッシュを取得 */
export async function getHeadHash(repoPath: string): Promise<string> {
  const proc = Bun.spawn(["git", "rev-parse", "HEAD"], {
    cwd: repoPath,
    stdout: "pipe",
    stderr: "pipe",
  });
  const text = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error("git rev-parse HEAD failed");
  }
  return text.trim();
}

/** hash が HEAD の祖先かどうか判定 */
export async function isAncestor(repoPath: string, hash: string): Promise<boolean> {
  const proc = Bun.spawn(["git", "merge-base", "--is-ancestor", hash, "HEAD"], {
    cwd: repoPath,
    stdout: "pipe",
    stderr: "pipe",
  });
  const exitCode = await proc.exited;
  return exitCode === 0;
}

/** git log をストリーミングでパースし、チャンクごとに onChunk を発火する */
export async function streamCommits(
  repoPath: string,
  onChunk: (commits: CommitData[], progress: number) => void,
  since?: string,
): Promise<number> {
  const args = ["git", "log", `--format=${FORMAT}%n${SEPARATOR}`, "--numstat"];
  if (since) args.push(`${since}..HEAD`);

  const proc = Bun.spawn(args, {
    cwd: repoPath,
    stdout: "pipe",
    stderr: "pipe",
  });

  const reader = proc.stdout.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: false });

  let remainder = "";
  let totalParsed = 0;
  let buffer: CommitData[] = [];

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = remainder + decoder.decode(value, { stream: true });
    const parts = text.split(SEPARATOR);

    // 最後の要素は不完全な可能性があるので remainder に回す
    remainder = parts.pop() ?? "";

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      const commit = parseCommitBlock(trimmed);
      if (commit) {
        buffer.push(commit);
        if (buffer.length >= STREAM_CHUNK_SIZE) {
          totalParsed += buffer.length;
          onChunk(buffer, totalParsed);
          buffer = [];
        }
      }
    }
  }

  // ストリーム終了後: remainder をフラッシュ
  const finalText = remainder + decoder.decode();
  const finalTrimmed = finalText.trim();
  if (finalTrimmed) {
    const commit = parseCommitBlock(finalTrimmed);
    if (commit) buffer.push(commit);
  }

  // 残りの端数を送信
  if (buffer.length > 0) {
    totalParsed += buffer.length;
    onChunk(buffer, totalParsed);
  }

  // プロセス終了を待ってエラーチェック
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`git log failed: ${stderr}`);
  }

  return totalParsed;
}

/** 1コミット分のブロックをパースする */
function parseCommitBlock(block: string): CommitData | null {
  const lines = block.split("\n");

  let hash = "";
  let author = "";
  let email = "";
  let date = "";
  let message = "";
  const files: FileChange[] = [];

  for (const line of lines) {
    if (line.startsWith("Hash:")) {
      hash = line.slice(5);
    } else if (line.startsWith("Author:")) {
      author = line.slice(7);
    } else if (line.startsWith("Email:")) {
      email = line.slice(6);
    } else if (line.startsWith("Date:")) {
      date = line.slice(5);
    } else if (line.startsWith("Message:")) {
      message = line.slice(8);
    } else {
      const fileChange = parseNumstatLine(line);
      if (fileChange) files.push(fileChange);
    }
  }

  if (!hash) return null;

  return { hash, author, email, date, message, files };
}

/** --numstat の1行をパースする（例: "10\t5\tsrc/index.ts"） */
function parseNumstatLine(line: string): FileChange | null {
  const match = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
  if (!match) return null;

  return {
    additions: match[1] === "-" ? 0 : parseInt(match[1], 10),
    deletions: match[2] === "-" ? 0 : parseInt(match[2], 10),
    path: match[3],
  };
}
