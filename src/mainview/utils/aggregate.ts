import type { CommitData } from "../../shared/types";

export type TimeUnit = "day" | "week" | "month";

export interface FrequencyPoint {
  date: string;
  [author: string]: number | string;
}

/** 曜日(7) × 時間帯(24) のコミット数グリッド */
export type HeatmapGrid = number[][];

export interface LinesChangedPoint {
  date: string;
  additions: number;
  deletions: number;
}

export interface DirectoryStats {
  directory: string;
  commits: number;
  additions: number;
  deletions: number;
}

export interface WordCount {
  word: string;
  count: number;
}

// week キーのキャッシュ（日付文字列 → 週開始日文字列）
const weekKeyCache = new Map<string, string>();

// 曜日キャッシュ（日付文字列 → 0=月〜6=日）
const dowCache = new Map<string, number>();

/** ISO 8601 日付文字列を指定単位のキーに変換する（Date 生成を最小化） */
function toDateKey(dateStr: string, unit: TimeUnit): string {
  switch (unit) {
    case "day":
      return dateStr.slice(0, 10);
    case "month":
      return dateStr.slice(0, 7);
    case "week": {
      const dayStr = dateStr.slice(0, 10);
      let key = weekKeyCache.get(dayStr);
      if (key !== undefined) return key;

      const d = new Date(dayStr + "T00:00:00");
      const dow = d.getDay();
      const diff = dow === 0 ? 6 : dow - 1;
      if (diff === 0) {
        key = dayStr;
      } else {
        const monday = new Date(d);
        monday.setDate(d.getDate() - diff);
        const wy = monday.getFullYear();
        const wm = String(monday.getMonth() + 1).padStart(2, "0");
        const wd = String(monday.getDate()).padStart(2, "0");
        key = `${wy}-${wm}-${wd}`;
      }
      weekKeyCache.set(dayStr, key);
      return key;
    }
  }
}

/** ISO 8601 文字列から曜日(0=月〜6=日)を取得する（キャッシュ付き） */
function getDayOfWeek(dateStr: string): number {
  const dayStr = dateStr.slice(0, 10);
  let day = dowCache.get(dayStr);
  if (day !== undefined) return day;

  const jsDay = new Date(dayStr + "T00:00:00").getDay();
  day = jsDay === 0 ? 6 : jsDay - 1;
  dowCache.set(dayStr, day);
  return day;
}

const MAX_AUTHORS = 10;
const OTHERS_LABEL = "Others";

/** コミッター別のコミット頻度を集計する（上位 N 人 + Others） */
export function aggregateFrequency(
  commits: CommitData[],
  unit: TimeUnit,
): { data: FrequencyPoint[]; authors: string[] } {
  // 1. コミッター別の総コミット数をカウント
  const authorTotals = new Map<string, number>();
  for (const commit of commits) {
    authorTotals.set(commit.author, (authorTotals.get(commit.author) ?? 0) + 1);
  }

  // 2. 上位 N 人を決定
  const sorted = [...authorTotals.entries()].sort((a, b) => b[1] - a[1]);
  const topAuthors = new Set(sorted.slice(0, MAX_AUTHORS).map(([a]) => a));
  const hasOthers = sorted.length > MAX_AUTHORS;

  // 3. 時系列集計（上位以外は Others にまとめる）
  const map = new Map<string, Map<string, number>>();
  for (const commit of commits) {
    const key = toDateKey(commit.date, unit);
    const author = topAuthors.has(commit.author) ? commit.author : OTHERS_LABEL;

    let authorMap = map.get(key);
    if (!authorMap) {
      authorMap = new Map();
      map.set(key, authorMap);
    }
    authorMap.set(author, (authorMap.get(author) ?? 0) + 1);
  }

  const authors = sorted.slice(0, MAX_AUTHORS).map(([a]) => a);
  if (hasOthers) authors.push(OTHERS_LABEL);
  const sortedKeys = [...map.keys()].sort();

  const data: FrequencyPoint[] = sortedKeys.map((key) => {
    const authorMap = map.get(key)!;
    const point: FrequencyPoint = { date: key };
    for (const author of authors) {
      point[author] = authorMap.get(author) ?? 0;
    }
    return point;
  });

  return { data, authors };
}

/** 曜日×時間帯のコミット分布を集計する（7×24 の 2D 配列を返す） */
export function aggregateHeatmap(commits: CommitData[]): HeatmapGrid {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const commit of commits) {
    const day = getDayOfWeek(commit.date);
    const hour = parseInt(commit.date.slice(11, 13), 10);
    grid[day][hour]++;
  }
  return grid;
}

/** 追加/削除行数の時系列推移を集計する */
export function aggregateLinesChanged(
  commits: CommitData[],
  unit: TimeUnit,
): LinesChangedPoint[] {
  const map = new Map<string, { additions: number; deletions: number }>();

  for (const commit of commits) {
    const key = toDateKey(commit.date, unit);
    let entry = map.get(key);
    if (!entry) {
      entry = { additions: 0, deletions: 0 };
      map.set(key, entry);
    }
    for (const f of commit.files) {
      entry.additions += f.additions;
      entry.deletions += f.deletions;
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));
}

/** ディレクトリ別のコミット数・変更量を集計する */
export function aggregateDirectories(
  commits: CommitData[],
  depth: number = 1,
): DirectoryStats[] {
  const map = new Map<
    string,
    { commitHashes: Set<string>; additions: number; deletions: number }
  >();

  for (const commit of commits) {
    for (const file of commit.files) {
      const parts = file.path.split("/");
      const dir = parts.length > depth
        ? parts.slice(0, depth).join("/")
        : parts.length > 1
          ? parts.slice(0, -1).join("/")
          : "(root)";

      let entry = map.get(dir);
      if (!entry) {
        entry = { commitHashes: new Set(), additions: 0, deletions: 0 };
        map.set(dir, entry);
      }
      entry.commitHashes.add(commit.hash);
      entry.additions += file.additions;
      entry.deletions += file.deletions;
    }
  }

  return [...map.entries()]
    .map(([directory, v]) => ({
      directory,
      commits: v.commitHashes.size,
      additions: v.additions,
      deletions: v.deletions,
    }))
    .sort((a, b) => b.commits - a.commits);
}

const STOP_WORDS = new Set([
  "the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or",
  "is", "it", "this", "that", "with", "from", "by", "as", "be", "was",
  "are", "been", "not", "but", "if", "no", "do", "did", "has", "have",
  "had", "will", "would", "can", "could", "should", "may", "might",
  "up", "into", "out", "when", "we", "all", "so", "some",
]);

/** コミットメッセージの頻出語を抽出する */
export function aggregateWords(
  commits: CommitData[],
  limit: number = 30,
): WordCount[] {
  const counter = new Map<string, number>();

  for (const commit of commits) {
    const words = commit.message
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\u3000-\u9fff\uff00-\uffef ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

    for (const word of words) {
      counter.set(word, (counter.get(word) ?? 0) + 1);
    }
  }

  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}
