import DemoZone from "./DemoZone";
import Page from "./page/Page";

// ?only=demo : 체험존만 따로 (iframe으로 체험존만 넣을 때)
export default function App() {
  return /[?&]only=demo\b/.test(location.search) ? <DemoZone /> : <Page />;
}
