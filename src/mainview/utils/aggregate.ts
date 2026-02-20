import type { CommitData } from "../../shared/types";

export type TimeUnit = "day" | "week" | "month";

export interface FrequencyPoint {
  date: string;
  [author: string]: number | string;
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
