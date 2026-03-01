import { BrowserView, BrowserWindow, Updater, Utils } from "electrobun/bun";
import { RPC_MAX_REQUEST_TIME } from "../shared/config";
import { toErrorMessage } from "../shared/errors";
import type { CommitData, CommitScopeRPC } from "../shared/types";
import { initApplicationMenu } from "./app-menu";
import { evictCache, readCache, touchCache, writeCache } from "./cache";
import { getBranchList } from "./git-branch-parser";
import {
  getHeadHash,
  isAncestor,
  streamCommits,
  validateRepoPath,
} from "./git-log-parser";
import { createLogger } from "./logger";

const logger = await createLogger();

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

/** dev チャンネル時は Vite dev server を優先し、なければビルド済みファイルを使用 */
async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === "dev") {
    try {
      await fetch(DEV_SERVER_URL, { method: "HEAD" });
      logger.info(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
      return DEV_SERVER_URL;
    } catch {
      logger.info(
        "Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
      );
    }
  }
  return "views://mainview/index.html";
}

/** Renderer ↔ Main 間の RPC ハンドラ定義 */
const rpc = BrowserView.defineRPC<CommitScopeRPC>({
  maxRequestTime: RPC_MAX_REQUEST_TIME,
  handlers: {
    requests: {
      /** フォルダ選択ダイアログを表示し、選択パスを返す */
      selectRepository: async ({ startingFolder }) => {
        const paths = await Utils.openFileDialog({
          canChooseFiles: false,
          canChooseDirectory: true,
          allowsMultipleSelection: false,
          startingFolder: startingFolder || "~/",
        });
        return paths.length > 0 ? paths[0] : null;
      },
      /** ブランチ一覧を取得 */
      getBranches: async ({ path }) => {
        return getBranchList(path);
      },
      /** 指定パスの Git リポジトリを解析開始（ストリーミング） */
      analyzeRepository: async ({ path }) => {
        logger.debug(`Analyzing repository: ${path}`);
        await validateRepoPath(path);

        const head = await getHeadHash(path);
        const cache = await readCache(path);

        // (A) キャッシュヒット: HEAD が同一ならキャッシュから即座に返す
        if (cache && cache.headHash === head) {
          logger.debug(`Cache hit: ${cache.commits.length} commits`);
          touchCache(path).catch(() => {});
          rpc.send.commitChunk({
            commits: cache.commits,
            progress: cache.commits.length,
          });
          rpc.send.commitStreamEnd({ total: cache.commits.length });
          return;
        }

        // (B) 差分取得 or (C) フル取得
        const incremental =
          cache !== null && (await isAncestor(path, cache.headHash));
        const allCommits: CommitData[] = [];

        streamCommits(
          path,
          (commits, progress) => {
            for (const c of commits) allCommits.push(c);
            rpc.send.commitChunk({ commits, progress });
          },
          incremental ? cache?.headHash : undefined,
        )
          .then((streamedCount) => {
            if (incremental && cache) {
              allCommits.push(...cache.commits);
              rpc.send.commitChunk({
                commits: cache.commits,
                progress: streamedCount + cache.commits.length,
              });
            }
            const total = allCommits.length;
            logger.debug(
              `Stream complete: ${total} commits (${incremental ? "incremental" : "full"})`,
            );
            rpc.send.commitStreamEnd({ total });
            writeCache(path, head, allCommits)
              .then(() => evictCache())
              .catch(() => {});
          })
          .catch((e) => {
            const message = toErrorMessage(e);
            logger.debug(`Stream error: ${message}`);
            rpc.send.commitStreamError({ message });
          });
      },
    },
    messages: {},
  },
});

/** メインウィンドウの生成 */
const url = await getMainViewUrl();

// Dock クリック対応時に mainWindow.show() で使用予定
export const mainWindow = new BrowserWindow({
  title: "CommitScope",
  url,
  rpc,
  frame: {
    width: 1200,
    height: 800,
    x: 100,
    y: 100,
  },
});

// macOS 標準挙動: × ボタンではウィンドウを閉じるだけでアプリは終了しない
// 完全終了は Cmd+Q またはメニューの「CommitScope を終了」から
// TODO: Dock クリックでウィンドウを再表示する (hide/show + reopen イベントが必要)
// https://github.com/blackboardsh/electrobun/issues/69

/** アプリケーションメニューの初期化 */
initApplicationMenu();

logger.info("CommitScope started!");
