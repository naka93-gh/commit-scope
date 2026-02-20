import type { CommitData } from "../../shared/types";

export type TimeUnit = "day" | "week" | "month";

export interface FrequencyPoint {
  date: string;
  [author: string]: number | string;
}

export interface HeatmapCell {
  day: number; // 0=月 ~ 6=日
  hour: number; // 0~23
  count: number;
}

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

/** 日付を指定単位のキーに変換する */
function toDateKey(dateStr: string, unit: TimeUnit): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  switch (unit) {
    case "day":
      return `${year}-${month}-${day}`;
    case "week": {
      // 月曜始まりの週の開始日を算出
      const dayOfWeek = d.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(d);
      monday.setDate(d.getDate() - diff);
      const wy = monday.getFullYear();
      const wm = String(monday.getMonth() + 1).padStart(2, "0");
      const wd = String(monday.getDate()).padStart(2, "0");
      return `${wy}-${wm}-${wd}`;
    }
    case "month":
      return `${year}-${month}`;
  }
}

/** コミッター別のコミット頻度を集計する */
export function aggregateFrequency(
  commits: CommitData[],
  unit: TimeUnit,
): { data: FrequencyPoint[]; authors: string[] } {
  const authorSet = new Set<string>();
  const map = new Map<string, Map<string, number>>();

  for (const commit of commits) {
    const key = toDateKey(commit.date, unit);
    authorSet.add(commit.author);

    if (!map.has(key)) map.set(key, new Map());
    const authorMap = map.get(key)!;
    authorMap.set(commit.author, (authorMap.get(commit.author) ?? 0) + 1);
  }

  const authors = [...authorSet];
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

/** 曜日×時間帯のコミット分布を集計する */
export function aggregateHeatmap(commits: CommitData[]): HeatmapCell[] {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const commit of commits) {
    const d = new Date(commit.date);
    const jsDay = d.getDay(); // 0=日
    const day = jsDay === 0 ? 6 : jsDay - 1; // 0=月
    const hour = d.getHours();
    grid[day][hour]++;
  }

  const cells: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({ day, hour, count: grid[day][hour] });
    }
  }
  return cells;
}

/** 追加/削除行数の時系列推移を集計する */
export function aggregateLinesChanged(
  commits: CommitData[],
  unit: TimeUnit,
): LinesChangedPoint[] {
  const map = new Map<string, { additions: number; deletions: number }>();

  for (const commit of commits) {
    const key = toDateKey(commit.date, unit);
    if (!map.has(key)) map.set(key, { additions: 0, deletions: 0 });
    const entry = map.get(key)!;
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

      if (!map.has(dir)) {
        map.set(dir, { commitHashes: new Set(), additions: 0, deletions: 0 });
      }
      const entry = map.get(dir)!;
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
