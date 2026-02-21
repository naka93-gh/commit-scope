import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "CommitScope",
    identifier: "dev.naka.commitscope",
    version: "0.0.1",
  },
  runtime: {
    exitOnLastWindowClosed: false,
  },
  build: {
    copy: {
      "dist/index.html": "views/mainview/index.html",
      "dist/assets": "views/mainview/assets",
    },
    mac: { bundleCEF: false, icons: "icon.iconset" },
    linux: { bundleCEF: false },
    win: { bundleCEF: false },
  },
} satisfies ElectrobunConfig;
