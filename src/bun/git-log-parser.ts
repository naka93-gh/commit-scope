import type { CommitData, FileChange } from "../shared/types";

const SEPARATOR = "---COMMIT_END---";
const FORMAT = [
  "Hash:%H",
  "Author:%an",
  "Email:%ae",
  "Date:%aI",
  "Message:%s",
].join("%n");

/** git log を実行してコミットデータをパースする */
export async function getCommits(repoPath: string): Promise<CommitData[]> {
  const proc = Bun.spawn(
    [
      "git",
      "log",
      `--format=${FORMAT}%n${SEPARATOR}`,
      "--numstat",
    ],
    {
      cwd: repoPath,
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`git log failed: ${stderr}`);
  }

  return parseGitLog(stdout);
}

/** git log の出力テキストを CommitData[] にパースする */
function parseGitLog(output: string): CommitData[] {
  const commits: CommitData[] = [];
  const blocks = output.split(SEPARATOR);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const commit = parseCommitBlock(trimmed);
    if (commit) commits.push(commit);
  }

  return commits;
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
