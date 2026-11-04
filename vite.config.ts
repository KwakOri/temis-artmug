import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base './' : GitHub Pages 하위 폴더나 iframe 어디에 두어도 상대 경로로 동작
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  // edit.html : 주인용 문구·가격 편집기(GitHub Pages에서 /edit 주소로 열림)
  build: {
    assetsInlineLimit: 0,
    rollupOptions: { input: { main: resolve(__dirname, "index.html"), edit: resolve(__dirname, "edit.html") } },
  },
});
