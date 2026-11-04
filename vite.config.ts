import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// artmug.temis.kr 맨 앞에서 서비스한다. 손님 폴더(/<id>/)도 같은 /assets를 쓰도록 절대 경로.
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  // edit.html : 문구·가격 편집기. 빌드 뒤 scripts/clients.mjs가 손님마다 /<id>/index.html·edit.html로 복사한다.
  build: {
    assetsInlineLimit: 0,
    rollupOptions: { input: { main: resolve(__dirname, "index.html"), edit: resolve(__dirname, "edit.html") } },
  },
});
