// 빌드 뒤: src/clients.json의 손님마다 dist/<id>/index.html·edit.html을 만든다(GitHub Pages는 /<id>/edit → <id>/edit.html).
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";

const clients = JSON.parse(readFileSync("src/clients.json", "utf8"));
for (const id of Object.keys(clients)) {
  if (!/^[a-z0-9-]+$/.test(id) || ["assets", "works", "edit"].includes(id)) throw new Error(`쓸 수 없는 손님 id: ${id}`);
  mkdirSync(`dist/${id}`, { recursive: true });
  copyFileSync("dist/index.html", `dist/${id}/index.html`);
  copyFileSync("dist/edit.html", `dist/${id}/edit.html`);
}
console.log(`손님 페이지 ${Object.keys(clients).length}개: ${Object.keys(clients).join(", ")}`);
