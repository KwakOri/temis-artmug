import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { startEditMode } from "./page/editMode";
import { applyDoc, fetchPublished, readDraft } from "./page/remote";

// ?draft : /edit 미리보기. 고치는 중인 내용(localStorage)을 보여 주고, 바뀌면 다시 그린다.
// ?draft&edit : 거기에 「눌러 고치기」(page/editMode.ts)를 켠다.
const draft = /[?&]draft\b/.test(location.search);
const moved = draft && /[?&]edit\b/.test(location.search) && parent !== window ? startEditMode() : null;
const root = createRoot(document.getElementById("root")!);
// Page는 그릴 때마다 doc을 읽으므로 다시 render만 하면 된다(고른 옵션 같은 상태는 그대로).
const render = () =>
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

if (draft) {
  applyDoc(readDraft());
  render();
  addEventListener("storage", () => {
    applyDoc(readDraft());
    render();
    if (moved) setTimeout(moved, 30);
  });
} else {
  fetchPublished().then((saved) => {
    if (saved) applyDoc(saved);
    render();
  });
}
