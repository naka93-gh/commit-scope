import type { BranchInfo } from "../shared/types";

const REF_FORMAT = "%(refname:short)|%(committerdate:iso-strict)|%(committername)";

/** 現在のブランチ名を取得 */
async function getCurrentBranch(repoPath: string): Promise<string> {
  const proc = Bun.spawn(["git", "rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: repoPath,
    stdout: "pipe",
    stderr: "pipe",
  });
  const text = await new Response(proc.stdout).text();
  await proc.exited;
  return text.trim();
}

/** ローカル・リモートの全ブランチ情報を取得 */
export async function getBranchList(repoPath: string): Promise<BranchInfo[]> {
  const [currentBranch, refOutput] = await Promise.all([
    getCurrentBranch(repoPath),
    (async () => {
      const proc = Bun.spawn(
        ["git", "for-each-ref", `--sort=-committerdate`, `--format=${REF_FORMAT}`, "refs/heads/", "refs/remotes/"],
        { cwd: repoPath, stdout: "pipe", stderr: "pipe" },
      );
      const text = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;
      if (exitCode !== 0) {
        const stderr = await new Response(proc.stderr).text();
        console.error("git for-each-ref failed", { exitCode, stderr });
        throw new Error("ブランチ情報の取得に失敗しました");
      }
      return text;
    })(),
  ]);

  const branches: BranchInfo[] = [];

  for (const line of refOutput.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split("|");
    if (parts.length < 3) continue;

    const name = parts[0];
    const lastCommitDate = parts[1];
    const lastCommitAuthor = parts.slice(2).join("|"); // 作者名に | が含まれる場合

    // origin/HEAD は除外
    if (name === "origin/HEAD") continue;

    // refs/heads/ → main, refs/remotes/ → origin/main（スラッシュの有無でローカル/リモートを判定）
    const isRemote = name.includes("/");

    branches.push({
      name,
      isCurrent: !isRemote && name === currentBranch,
      lastCommitDate,
      lastCommitAuthor,
      isRemote: isRemote,
    });
  }

  return branches;
}
