// 테미스 상세페이지의 칸 목록: /edit 편집기가 무엇을 어떻게 고치게 할지 적는다.
// 편집기 코드(@artmug/editor)는 손님마다 같고, 손님마다 다른 것은 디자인(src/page) · 이 파일 · public/content.json뿐이다.
// 디자인에서 고칠 수 있는 글자·사진에는 data-edit="<content.json 경로>"를 붙인다(예: data-edit="works.items.2.title").
import { defineSchema } from "@artmug/editor";
import { doc } from "./page/data";
import { SITE } from "./site";

export default defineSchema({
  site: SITE,
  defaults: doc,
  logo: <b className="font-[BagelFat] text-primary">TEMIS</b>,
  title: (d) => `상세페이지 고치기 · ${d.brand}`,
  labels: {
    brand: "브랜드 이름",
    hero: "첫 화면",
    strip: "맨 위 검은 띠 문구",
    count: "함께한 스트리머 수 (제목의 {숫자})",
    benefits: "이런 점이 좋아요",
    icon: "아이콘",
    title: "제목",
    body: "본문",
    sub: "설명",
    works: "작업물",
    src: "사진",
    items: "항목",
    cat: "구성",
    demo: "체험존",
    reviews: "후기",
    quote: "한 줄 인용",
    pricing: "가격",
    plans: "구성",
    name: "이름",
    price: "가격(원)",
    desc: "설명",
    points: "특징",
    badge: "배지",
    options: "옵션",
    kind: "가격 방식",
    value: "값 (정액이면 원, 비율이면 %)",
    revisions: "기본 수정 횟수",
    omakaseRevisions: "오마카세 수정 횟수",
    period: "작업 기간",
    slots: "작업 자리",
    csvUrl: "구글 시트 「공개」 탭 CSV 주소",
    note: "안내 문구",
    process: "진행 순서",
    notice: "주의사항",
    must: "필독 표시(처음부터 펼침)",
    form: "신청 양식",
    fields: "칸",
    label: "칸 이름",
    type: "칸 종류",
    required: "필수",
    placeholder: "예시 문구",
    showIf: "보이는 조건",
    attachNote: "첨부 안내",
  },
  choices: {
    kind: [["fixed", "정액(음수면 할인)"], ["percent", "고른 구성 가격의 %"], ["ask", "별도 문의"]],
    cat: [["structured", "정형"], ["unstructured", "비정형"], ["team", "팀"]],
    icon: [["pencil", "연필"], ["phone", "폰"], ["users", "사람들"], ["heart", "하트"]],
    type: [["text", "한 줄"], ["longtext", "여러 줄"], ["number", "숫자"], ["date", "날짜"]],
    showIf: [["", "늘"], ["omakaseOff", "오마카세가 아닐 때만"], ["team", "팀 시간표일 때만"]],
  },
  // 지금 페이지에 안 쓰이거나 코드가 쓰는 값
  hidden: ["id", "conflicts", "hero.title", "hero.sub", "hero.tags"],
  // 구성 3개는 코드가 id로 찾는다
  fixedLists: ["pricing.plans"],
  lists: {
    // 옵션: 오마카세는 수정 횟수·신청 양식 칸이 id로 묶여 있어 못 뺀다. 옵션을 빼면 다른 옵션의 「같이 못 고름」에서도 지운다.
    "pricing.options": {
      newItem: { name: "새 옵션", kind: "fixed", value: 0, desc: "" },
      locked: ["omakase"],
      refs: ["conflicts"],
    },
  },
  longText: ["body", "sub", "desc", "quote"],
  photos: {
    "works.items.src": { dir: "works", missing: "사진이 없는 작업물이 있어요. 사진을 고르거나 그 항목을 빼 주세요." },
  },
  tabOf: { brand: "hero" },
  hints: {
    "works.title": ["*별표* 사이 글자는 주황색으로 강조돼요.", "줄바꿈은 그대로 보여요.", (d) => `{숫자}는 「함께한 스트리머 수」(지금: ${d.works.count})로 바뀌어요.`],
    "works.sub": ["*별표* 사이 글자는 주황색으로 강조돼요.", "줄바꿈은 그대로 보여요."],
    "demo.title": ["*별표* 사이 글자는 주황색으로 강조돼요.", "줄바꿈은 그대로 보여요."],
    "demo.sub": ["*별표* 사이 글자는 주황색으로 강조돼요.", "줄바꿈은 그대로 보여요."],
    "reviews.body": ["줄바꿈은 그대로 보여요."],
    "works.count": ["작업물 칸 제목의 {숫자}와 후기 칸 아래 문구에 들어가요."],
    "process.body": [(d) => `{횟수}는 기본 수정 횟수(지금: ${d.pricing.revisions}회)로 바뀌어요.`],
    "pricing.period": ["가격 칸 설명과 영수증에 같이 들어가요."],
    "pricing.plans.price": ["원 단위예요. 비율(%) 옵션 금액도 이 값으로 다시 계산돼요."],
    "pricing.options.value": [
      (d, p) => {
        const o = d.pricing.options[p[2] as number];
        return o?.kind === "percent" ? "고른 구성 가격의 %예요(100이면 기본가만큼 추가)." : o?.kind === "ask" ? "별도 문의 옵션이라 이 값은 안 쓰여요." : "원 단위예요. 할인은 음수로 적어요(예: -10000).";
      },
      "가격 방식(정액·비율·별도 문의)은 칸 목록에서 바꿔요.",
    ],
    "form.fields.placeholder": ["신청 양식 칸 안에 흐리게 보이는 예시 문구예요."],
  },
  bulk: {
    list: "works.items",
    photo: "src",
    choose: { field: "cat", default: "unstructured" },
    title: "사진 여러 장 한꺼번에 추가",
    note: "고른 구성으로 목록 끝에 붙어요. 사진은 자동으로 줄여서(목록용·크게 보기용 두 장) 저장 때 한 번에 올라가요. 제목에 손님 이름은 넣지 마세요.",
  },
  panelNote: (
    <>
      줄바꿈은 그대로 보여요. 진행 순서의 {"{횟수}"}는 수정 횟수로, 작업물 제목의 {"{숫자}"}는 「함께한 스트리머 수」로 바뀌어요. 작업물 사진은 「사진 고르기」로 바꿔요(저장 때 같이 올라가요). 첫 화면 디자인은 여기서 못 고쳐요.
    </>
  ),
});
