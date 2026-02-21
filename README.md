# CommitScope

ローカル Git リポジトリのコミット履歴を分析し、コミッターの活動状態を可視化するデスクトップアプリケーション。

## 技術スタック

- **フレームワーク**: Electrobun (Bun + Webview)
- **フロントエンド**: React + TypeScript + Tailwind CSS
- **チャート**: Recharts
- **ビルド**: Vite

## 前提条件

- [Bun](https://bun.sh/) 1.3+
- cmake (`brew install cmake`)
- Xcode コマンドラインツール

## セットアップ

```bash
bun install
```

## 開発

```bash
# ビルド＆起動
bun run dev

# HMR 有効（Vite dev server 併用）
bun run dev:hmr
```

## ビルド

```bash
# 開発用
bun run build

# リリース用
bun run build:prod
```
