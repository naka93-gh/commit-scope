import { useCallback, useMemo, useState } from "react";

interface TreeNode {
  name: string;
  path: string;
  count: number;
  isDataNode: boolean;
  children: TreeNode[];
}

interface DirTreeSelectorProps {
  allDirs: string[];
  dirCounts: Map<string, number>;
  selectedDirs: Set<string>;
  onSelectionChange: (dirs: Set<string>) => void;
}

/** フラットなパス配列をツリー構造に変換 */
function buildTree(allDirs: string[], dirCounts: Map<string, number>): TreeNode[] {
  const rootChildren: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  /** ノードを取得または新規作成する。created が true なら新規作成 */
  const getOrCreate = (path: string, name: string): { node: TreeNode; created: boolean } => {
    const existing = nodeMap.get(path);
    if (existing) return { node: existing, created: false };

    const node: TreeNode = {
      name,
      path,
      count: dirCounts.get(path) ?? 0,
      isDataNode: false,
      children: [],
    };
    nodeMap.set(path, node);
    return { node, created: true };
  };

  for (const dir of allDirs) {
    if (dir === "(root)") {
      const { node, created } = getOrCreate(dir, dir);
      node.isDataNode = true;
      if (created) rootChildren.push(node);
      continue;
    }

    const segments = dir.split("/");
    let parentList = rootChildren;

    for (let i = 0; i < segments.length; i++) {
      const path = segments.slice(0, i + 1).join("/");
      const { node, created } = getOrCreate(path, segments[i]);

      if (created) {
        parentList.push(node);
      }

      if (i === segments.length - 1) {
        node.isDataNode = true;
        node.count = dirCounts.get(dir) ?? 0;
      }

      parentList = node.children;
    }
  }

  return rootChildren;
}

/** ノード配下の全データノードパスを収集 */
function collectDataPaths(node: TreeNode): string[] {
  const paths: string[] = [];
  if (node.isDataNode) paths.push(node.path);
  for (const child of node.children) {
    paths.push(...collectDataPaths(child));
  }
  return paths;
}

/** ノード配下のデータノードが全て選択済みか判定 */
function isAllSelected(node: TreeNode, selected: Set<string>): boolean {
  if (node.isDataNode && node.children.length === 0) {
    return selected.has(node.path);
  }
  const dataPaths = collectDataPaths(node);
  return dataPaths.length > 0 && dataPaths.every((p) => selected.has(p));
}

/** ノード配下のデータノードが一部選択済みか判定 */
function isPartiallySelected(node: TreeNode, selected: Set<string>): boolean {
  const dataPaths = collectDataPaths(node);
  const count = dataPaths.filter((p) => selected.has(p)).length;
  return count > 0 && count < dataPaths.length;
}

function TreeNodeRow({
  node,
  level,
  expanded,
  onToggleExpand,
  selectedDirs,
  onClickNode,
}: {
  node: TreeNode;
  level: number;
  expanded: Set<string>;
  onToggleExpand: (path: string) => void;
  selectedDirs: Set<string>;
  onClickNode: (node: TreeNode) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.path);
  const allSel = isAllSelected(node, selectedDirs);
  const partial = !allSel && isPartiallySelected(node, selectedDirs);

  const selected = allSel;

  return (
    <>
      <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: `${level * 16}px` }}>
        {/* 展開/折りたたみトグル */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.path);
            }}
            className="w-4 h-4 flex items-center justify-center text-cs-text-secondary hover:text-cs-text text-xs shrink-0"
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        ) : (
          <span className="w-4 h-4 shrink-0" />
        )}

        {/* ノード名ボタン */}
        <button
          type="button"
          onClick={() => onClickNode(node)}
          className={`px-2 py-0.5 text-xs rounded-lg transition-colors truncate max-w-[240px] ${
            selected
              ? "bg-cs-primary text-white"
              : partial
                ? "bg-cs-primary-subtle text-cs-text border border-cs-primary"
                : "bg-cs-surface-2 text-cs-text-secondary border border-cs-border-subtle hover:bg-cs-primary-subtle"
          }`}
          title={node.path}
        >
          {node.name}
          {node.isDataNode && <span className="ml-1 opacity-60 font-mono">{node.count}</span>}
        </button>
      </div>

      {/* 子ノード */}
      {hasChildren &&
        isExpanded &&
        node.children.map((child) => (
          <TreeNodeRow
            key={child.path}
            node={child}
            level={level + 1}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            selectedDirs={selectedDirs}
            onClickNode={onClickNode}
          />
        ))}
    </>
  );
}

export function DirTreeSelector({ allDirs, dirCounts, selectedDirs, onSelectionChange }: DirTreeSelectorProps) {
  const tree = useMemo(() => buildTree(allDirs, dirCounts), [allDirs, dirCounts]);

  // 初期状態: 第1階層は展開
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const node of tree) {
      if (node.children.length > 0) initial.add(node.path);
    }
    return initial;
  });

  const onToggleExpand = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const onClickNode = useCallback(
    (node: TreeNode) => {
      const dataPaths = collectDataPaths(node);
      if (dataPaths.length === 0) return;

      const next = new Set(selectedDirs);
      const allSelected = dataPaths.every((p) => next.has(p));

      if (allSelected) {
        for (const p of dataPaths) next.delete(p);
      } else {
        for (const p of dataPaths) next.add(p);
      }
      onSelectionChange(next);
    },
    [selectedDirs, onSelectionChange],
  );

  return (
    <div className="max-h-[240px] overflow-y-auto">
      {tree.map((node) => (
        <TreeNodeRow
          key={node.path}
          node={node}
          level={0}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          selectedDirs={selectedDirs}
          onClickNode={onClickNode}
        />
      ))}
    </div>
  );
}
