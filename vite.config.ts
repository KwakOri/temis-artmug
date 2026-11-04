import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// 상대 경로: artmug.temis.kr 맨 앞이든 <계정>.github.io/<저장소>/ 아래든 그대로 뜬다.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  // edit.html : 편집기(/edit). GitHub Pages는 /edit → edit.html로 연다.
  build: {
    assetsInlineLimit: 0,
    rollupOptions: { input: { main: resolve(__dirname, "index.html"), edit: resolve(__dirname, "edit.html") } },
  },
});
