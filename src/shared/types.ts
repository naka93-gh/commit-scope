/** コミットで変更されたファイルの情報 */
export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
}

/** パース済みコミットデータ */
export interface CommitData {
  hash: string;
  author: string;
  email: string;
  date: string; // ISO 8601
  message: string;
  files: FileChange[];
}

/** ブランチ情報 */
export interface BranchInfo {
  name: string;
  isCurrent: boolean;
  lastCommitDate: string; // ISO 8601
  lastCommitAuthor: string;
  isRemote: boolean;
}

/** RPC スキーマ: Main(Bun) ↔ Renderer(Webview) 間の通信定義 */
export type CommitScopeRPC = {
  bun: {
    requests: {
      selectRepository: {
        params: { startingFolder?: string };
        response: string | null;
      };
      analyzeRepository: {
        params: { path: string };
        response: void;
      };
      getBranches: {
        params: { path: string };
        response: BranchInfo[];
      };
    };
    messages: {};
  };
  webview: {
    requests: {};
    messages: {
      commitChunk: { commits: CommitData[]; progress: number };
      commitStreamEnd: { total: number };
      commitStreamError: { message: string };
    };
  };
};
