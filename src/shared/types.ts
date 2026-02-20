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

/** RPC スキーマ: Main(Bun) ↔ Renderer(Webview) 間の通信定義 */
export type CommitScopeRPC = {
  bun: {
    requests: {
      analyzeRepository: {
        params: { path: string };
        response: CommitData[];
      };
    };
    messages: {};
  };
  webview: {
    requests: {};
    messages: {};
  };
};
