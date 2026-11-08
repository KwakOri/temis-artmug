import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { startPage } from "@artmug/editor";
import "./index.css";
import App from "./App";
import schema from "./editor.schema";

// 게시된 content.json(/edit 미리보기 ?draft면 고치는 중인 내용)을 data.ts의 doc에 덮고 그린다.
// Page는 그릴 때마다 doc을 읽으므로 다시 render만 하면 된다(고른 옵션 같은 상태는 그대로).
const root = createRoot(document.getElementById("root")!);
startPage(schema, () =>
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
);
