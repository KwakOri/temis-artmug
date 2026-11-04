import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base './' : GitHub Pages 하위 폴더나 iframe 어디에 두어도 상대 경로로 동작
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: { assetsInlineLimit: 0 },
});
