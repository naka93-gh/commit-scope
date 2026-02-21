/** RPC リクエストのタイムアウト（ダイアログ等のユーザー操作待ちを考慮） */
export const RPC_MAX_REQUEST_TIME = 300_000; // 5分

/** テーマ */
export const THEME = {
  DARK: "dark",
  LIGHT: "light",
} as const;

export type Theme = (typeof THEME)[keyof typeof THEME];

/** テーマ設定の localStorage キー */
export const THEME_STORAGE_KEY = "cs-theme";

/** 最近開いたリポジトリの localStorage キー */
export const RECENT_REPOS_KEY = "cs-recent-repos";

/** 最近開いたリポジトリの最大保存件数 */
export const MAX_RECENT_REPOS = 5;
