import { BrowserWindow, BrowserView, Updater, Utils } from "electrobun/bun";
import type { CommitScopeRPC } from "../shared/types";
import { getCommits } from "./git-log-parser";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

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

const rpc = BrowserView.defineRPC<CommitScopeRPC>({
  maxRequestTime: 30000,
  handlers: {
    requests: {
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

const url = await getMainViewUrl();

const mainWindow = new BrowserWindow({
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

mainWindow.on("close", () => {
  Utils.quit();
});

console.log("CommitScope started!");
