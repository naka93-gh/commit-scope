import { Updater } from "electrobun/bun";

type LogLevel = "debug" | "info" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  error: 2,
};

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/** channel に応じた最小ログレベルで Logger を生成 */
export async function createLogger(): Promise<Logger> {
  const channel = await Updater.localInfo.channel();
  const minLevel: LogLevel = channel === "dev" ? "debug" : "info";
  const minPriority = LEVEL_PRIORITY[minLevel];

  function log(level: LogLevel, args: unknown[]): void {
    if (LEVEL_PRIORITY[level] < minPriority) return;

    const prefix = `[${level.toUpperCase()}]`;
    switch (level) {
      case "error":
        console.error(prefix, ...args);
        break;
      default:
        console.log(prefix, ...args);
    }
  }

  return {
    debug: (...args) => log("debug", args),
    info: (...args) => log("info", args),
    error: (...args) => log("error", args),
  };
}
