import { BrowserWindow, BrowserView, Updater, Utils } from "electrobun/bun";
import type { CommitScopeRPC } from "../shared/types";
import { RPC_MAX_REQUEST_TIME } from "../shared/config";
import { getCommits } from "./git-log-parser";
import { initApplicationMenu } from "./app-menu";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

/** dev チャンネル時は Vite dev server を優先し、なければビルド済みファイルを使用 */
async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === "dev") {
    try {
      await fetch(DEV_SERVER_URL, { method: "HEAD" });
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
      return DEV_SERVER_URL;
    } catch {
      console.log(
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
      /** 指定パスの Git リポジトリを解析し、コミット一覧を返す */
      analyzeRepository: async ({ path }) => {
        console.log(`Analyzing repository: ${path}`);
        const commits = await getCommits(path);
        console.log(`Found ${commits.length} commits`);
        return commits;
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

console.log("CommitScope started!");
