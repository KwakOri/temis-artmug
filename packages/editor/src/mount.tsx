// /edit 진입점: 손님 사이트의 edit 진입 파일에서 mountEditor(schema)만 부른다.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Editor from "./Editor";
import type { Schema } from "./schema";

export { Editor };

export function mountEditor(schema: Schema<any>, el = document.getElementById("root")!) {
  createRoot(el).render(
    <StrictMode>
      <Editor schema={schema} />
    </StrictMode>
  );
}
