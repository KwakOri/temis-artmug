import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import Editor from "./Editor";
import { SLUG } from "../page/remote";

// 편집기는 손님 주소(/<id>/edit)에서만. 아니면 맨 앞 안내 화면으로.
if (!SLUG) location.replace("/");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Editor />
  </StrictMode>
);
