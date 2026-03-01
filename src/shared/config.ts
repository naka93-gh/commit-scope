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

/** コミッター別チャートで表示する上位著者数（超過分は "Others" に集約） */
export const MAX_AUTHORS = 10;

/** テリトリーチャートで表示するディレクトリ数の初期上限 */
export const MAX_DIRECTORIES = 15;

/** git log ストリーミングのチャンクサイズ（コミット数） */
export const STREAM_CHUNK_SIZE = 100;

/** コミット一覧の表示上限 */
export const MAX_DISPLAY_COMMITS = 100;

/** キャッシュファイルの最大保持数（LRU エビクション） */
export const CACHE_MAX_ENTRIES = 10;
