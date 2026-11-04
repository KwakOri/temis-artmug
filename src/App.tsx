import DemoZone from "./DemoZone";
import Landing from "./Landing";
import Page from "./page/Page";
import { SLUG } from "./page/remote";

// 맨 앞 주소(손님 id 없음) : 관리 사이트 안내 · ?only=demo : 체험존만 따로 (iframe으로 체험존만 넣을 때)
export default function App() {
  if (!SLUG) return <Landing />;
  return /[?&]only=demo\b/.test(location.search) ? <DemoZone /> : <Page />;
}
