import { ApplicationMenu } from "electrobun/bun";

/** Native イベントループ初期化待ちの遅延(ms) */
const MENU_INIT_DELAY = 100;

/** アプリケーションメニューを初期化する */
export function initApplicationMenu(): void {
  // TODO: Electrobun に「app ready」イベントが追加されたら setTimeout を置き換える
  // 現状 Worker と startEventLoop が並行実行されるため、即時呼び出しではメニューが反映されない
  // https://github.com/blackboardsh/electrobun/issues/136
  // https://github.com/blackboardsh/electrobun/issues/160
  setTimeout(() => {
    ApplicationMenu.setApplicationMenu([
      {
        label: "CommitScope",
        submenu: [
          { label: "CommitScope について", role: "about" },
          { type: "separator" },
          { label: "CommitScope を隠す", role: "hide" },
          { label: "ほかを隠す", role: "hideOthers" },
          { label: "すべて表示", role: "showAll" },
          { type: "separator" },
          {
            label: "CommitScope を終了",
            role: "quit",
            accelerator: "CommandOrControl+Q",
          },
        ],
      },
      {
        label: "編集",
        submenu: [
          { label: "元に戻す", role: "undo" },
          { label: "やり直す", role: "redo" },
          { type: "separator" },
          { label: "カット", role: "cut" },
          { label: "コピー", role: "copy" },
          { label: "ペースト", role: "paste" },
          { label: "すべて選択", role: "selectAll" },
        ],
      },
      {
        label: "ウインドウ",
        submenu: [
          { label: "しまう", role: "minimize" },
          { label: "拡大/縮小", role: "zoom" },
          { label: "閉じる", role: "close" },
        ],
      },
    ]);
  }, MENU_INIT_DELAY);
}
