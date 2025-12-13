import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // ZKPファイルを静的アセットとして提供
  publicDir: "public",
  // ビルド時にZKPファイルを含める
  build: {
    rollupOptions: {
      output: {
        // ZKPファイルを別ディレクトリに配置
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".wasm")) {
            return "zkp/[name][extname]";
          }
          if (assetInfo.name && assetInfo.name.endsWith(".zkey")) {
            return "zkp/[name][extname]";
          }
          if (assetInfo.name && assetInfo.name.endsWith(".vkey.json")) {
            return "zkp/[name][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
