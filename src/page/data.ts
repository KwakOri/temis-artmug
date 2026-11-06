// 상세페이지의 모든 문구·가격 기본값. 나중에 /edit(시트 저장)이 이 모양 그대로 덮어쓴다.
// 근거: PLANS/TEMIS_ARTMUG_PAGE.md (2026-11-04 주인 답 반영)

export type PlanId = "structured" | "unstructured" | "team";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  desc: string;
  points: string[];
  badge?: string;
}

/** fixed: 정액(음수면 할인) · percent: 고른 구성 가격의 % · ask: 별도 문의 */
export type OptionKind = "fixed" | "percent" | "ask";

export interface Option {
  id: string;
  name: string;
  kind: OptionKind;
  value: number;
  desc: string;
  /** 같이 고를 수 없는 옵션 */
  conflicts?: string[];
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "longtext" | "number" | "date";
  required?: boolean;
  placeholder?: string;
  /** omakaseOff: 오마카세가 아닐 때만 · team: 팀 시간표일 때만 */
  showIf?: "omakaseOff" | "team";
}

export const doc = {
  brand: "TEMIS",
  hero: {
    strip: "맞춤 주간 시간표 · 주문제작 접수 중",
    title: "매주 포토샵 켜지 않아도 되는\n*방송 시간표*",
    sub: "버튜버를 위한 맞춤 주간 시간표예요.\n요일 칸만 채우면 PC와 폰에서 바로 완성돼요.",
    tags: ["주간 시간표", "폰 편집", "팀 일정", "맞춤 디자인"],
    // 누적 실적: 첫 화면과 작업물 칸 머리에 같이 쓴다
    stat: {
      num: "200+",
      text: "작업물",
      sub: "아트머그에는 새로 입점했지만, 이미 작업물 200개 이상을 만들어 왔어요.",
    },
  },
  benefits: [
    { icon: "pencil", title: "칸만 채우면 끝", body: "레이어를 찾아 고칠 필요 없이 방송 정보만 적으면 돼요." },
    { icon: "phone", title: "폰에서도 수정", body: "침대에서도 이번 주 일정을 바로 바꿀 수 있어요." },
    { icon: "users", title: "팀 일정 자동 취합", body: "팀 시간표는 팀원이 저장한 일정이 알아서 모여요." },
    { icon: "heart", title: "버튜버가 만든 시간표", body: "직접 방송하며 불편했던 점을 풀려고 만들었어요." },
  ],
  works: {
    // {숫자}는 첫 화면 실적 숫자(hero.stat.num)로 바뀐다
    title: "지금까지 *{숫자}* 작업물을 만들어 왔어요",
    sub: "옆으로 넘겨 보고, 누르면 크게 볼 수 있어요.",
    // 임시: Temis 포트폴리오 공개 목록(2026-11-04). 주인이 목록을 주면 바꾼다.
    items: [
      { src: "3-structured", cat: "structured", title: "히르님의 시간표" },
      { src: "4-structured", cat: "structured", title: "올뺌이님의 시간표" },
      { src: "5-structured", cat: "structured", title: "아인즈님의 시간표" },
      { src: "6-structured", cat: "structured", title: "베루밍님의 시간표" },
      { src: "7-structured", cat: "structured", title: "버찌님의 시간표" },
      { src: "8-unstructured", cat: "unstructured", title: "다르님의 시간표" },
      { src: "0-team", cat: "team", title: "LUCENT의 시간표" },
      { src: "1-team", cat: "team", title: "비정상스튜디오의 시간표" },
      { src: "2-team", cat: "team", title: "IRIS의 시간표" },
    ] as { src: string; cat: PlanId; title: string }[],
  },
  demo: {
    title: "직접 만져 보세요",
    sub: "아래 칸을 고치면 요일 카드가 바로 바뀌어요.\n완성된 시간표도 이렇게 칸만 채우면 돼요.",
  },
  reviews: [
    {
      quote: "이제 포토샵 켜서 하나하나 월요일...화요일...이러고 레이어 안 찾아도 되어서 너무 편해ㅠㅠ",
      body: "내가 가득가득 찬 디자인을 좋아해서\n가득 차 보이게 해주세요! 했는데\n\n완 벽 천 재\n\n바로바로 수정하는 것도 편하고\n컨셉에 맞게 예쁘게 잘 나온 것 같아!",
    },
    {
      quote: "모바일에서도 수정이 편리해서 좋더라구요!",
      body: "일정 변동도 잦고 포토샵 사용이 서툴러서\n이때까지는 주간 일정표 없이 당일 공지하다가,\n처음으로 주간 일정표를 만들어봤어요ㅎ\n오마카세 신청했더니 너무 예쁘게 디자인해주셨어요.",
    },
    {
      quote: "기술면, 편리성면에서는 PC가 아니라 모바일로도 된다는게 진짜 대박이라니까...",
      body: "나 같은 기계치는 포토샵도 못하는데 얘는\n그냥 정해진 빈칸에 적으먄 알아서 스케줄로\n들어가는게...진짜 떼끄놀로지아",
    },
    {
      quote: "팀이나 크루 활동하시는 분들에게 엄청 좋을 것 같아요!",
      body: "기존에는 클튜로 하나하나 간격 맞춰주고 해야 했는데\n이제는 글자만 적으면 되니 너무 편해요\n저의 일정을 저장하기만 하면\n자동으로 단체 스케쥴표에도 입력되어서요.",
    },
  ],
  pricing: {
    plans: [
      {
        id: "structured",
        name: "정형 시간표",
        price: 80000,
        desc: "깔끔한 구조로 한눈에 잘 보이는 기본형이에요.",
        points: ["요일 칸 고정 배치", "빠른 제작", "PC·폰 편집"],
      },
      {
        id: "unstructured",
        name: "비정형 시간표",
        price: 100000,
        badge: "추천",
        desc: "독특한 배치와 화려한 연출로 개성을 살려요.",
        points: ["자유로운 칸 모양", "화려한 연출", "PC·폰 편집"],
      },
      {
        id: "team",
        name: "팀 시간표",
        price: 120000,
        desc: "팀 일정을 통일된 디자인으로 한 장에 모아요.",
        points: ["팀원 일정 자동 취합", "통일된 디자인", "PC·폰 편집"],
      },
    ] as Plan[],
    options: [
      { id: "fast", name: "빠른 마감", kind: "percent", value: 100, desc: "일주일 안에 받아요. 고른 구성의 기본가만큼 추가돼요." },
      { id: "multi", name: "하루 여러 방송", kind: "fixed", value: 0, desc: "하루에 방송을 두 번 이상 적을 수 있게 만들어요." },
      { id: "offmemo", name: "휴방 메모", kind: "fixed", value: 0, desc: "휴방 칸에 짧은 메모를 적을 수 있어요." },
      { id: "weekmemo", name: "주간 메모", kind: "fixed", value: 0, desc: "이번 주 공지를 적는 칸을 넣어요." },
      { id: "omakase", name: "오마카세", kind: "fixed", value: 0, desc: "디자인을 맡겨 주세요. 진행이 빨라지는 대신 수정은 1회예요." },
      { id: "private", name: "포트폴리오 비공개", kind: "fixed", value: 10000, desc: "완성작을 포트폴리오로 공개하지 않아요.", conflicts: ["review"] },
      { id: "review", name: "후기 이벤트", kind: "fixed", value: -10000, desc: "완성 뒤 아트머그에 후기를 남겨 주시면 할인해 드려요.", conflicts: ["private"] },
      { id: "extra", name: "배경 전환·스티커", kind: "ask", value: 0, desc: "움직이는 배경이나 스티커는 문의 때 따로 견적을 드려요." },
    ] as Option[],
    revisions: 3,
    omakaseRevisions: 1,
    period: "작업 시작일로부터 2주",
  },
  slots: {
    // 구글 시트 「공개」 탭 웹 게시 CSV 주소. 비우면 일정 칸을 숨긴다(?slots=demo로 예시 보기).
    csvUrl: "",
    note: "결제 확인 순서대로 작업해요. 남은 자리는 문의 때 다시 확인해 드려요.",
  },
  process: [
    { title: "신청", body: "아래 양식을 복사해 아트머그 「작가에게 문의」로 보내 주세요." },
    { title: "견적·결제", body: "구성과 금액을 확인해 드리면 아트머그에서 결제해 주세요." },
    { title: "레퍼런스 확인", body: "보내 주신 캐릭터·참고 자료를 보고 방향을 잡아요." },
    { title: "디자인 시안", body: "방향에 맞춰 디자인 시안을 보내 드려요." },
    { title: "수정", body: "기본 {횟수}회예요. 고칠 곳을 모아서 알려 주세요." },
    { title: "시간표 제작", body: "확정된 디자인으로 칸을 채우는 시간표를 만들어요." },
    { title: "완성·전달", body: "완성된 시간표와 사용 방법을 안내해 드려요." },
  ],
  notice: [
    { title: "문의 방법", must: true, items: ["결제 전에는 아트머그 문의로만 이야기해요. 카카오톡·디스코드·이메일 같은 개인 연락처는 적지 말아 주세요."] },
    { title: "결과물 형태", must: true, items: ["이미지 파일 한 장이 아니라, 칸에 글을 넣으면 시간표 이미지가 만들어지는 템플릿으로 드려요.", "사용 방법은 완성 때 안내해 드려요."] },
    { title: "준비물", items: ["캐릭터 이미지(최대 5장)와 참고 디자인은 문의할 때 첨부해 주세요."] },
    { title: "오마카세", items: ["원하는 디자인이 뚜렷하지 않으면 오마카세를 추천해요.", "진행이 빨라지는 대신 수정은 1회예요. 처음부터 다시 만드는 수정은 어려워요."] },
    { title: "수정 범위", items: ["시안 확정 뒤 구조를 바꾸거나 기능을 새로 더하면 추가 비용이 생길 수 있어요."] },
    { title: "일정", items: ["결제 확인 순서대로 시작해요. 자료 전달이나 시안 확인이 늦어지면 일정도 늦어져요."] },
    { title: "환불", items: ["아트머그 규정을 따라요. 시안 작업이 시작된 뒤에는 환불이 어려울 수 있어요."] },
    { title: "포트폴리오", items: ["완성작은 포트폴리오로 공개할 수 있어요. 원하지 않으면 「포트폴리오 비공개」 옵션을 골라 주세요."] },
    { title: "이용 범위", items: ["신청하신 분(팀은 그 팀)의 방송에서 쓸 수 있어요. 되팔기·재배포는 안 돼요."] },
  ],
  form: {
    fields: [
      { id: "name", label: "활동명", type: "text", required: true, placeholder: "예) 테미스" },
      { id: "channel", label: "방송 채널 주소 (채널 확인용)", type: "text", placeholder: "치지직·SOOP·유튜브 채널 주소" },
      { id: "content", label: "시간표에 들어갈 내용", type: "longtext", required: true, placeholder: "방송 요일, 하루 방송 횟수, 메모 칸이 필요한지 적어 주세요." },
      { id: "imagePos", label: "캐릭터 이미지 위치", type: "text", showIf: "omakaseOff", placeholder: "예) 왼쪽에 크게" },
      { id: "cellShape", label: "요일 칸 모양", type: "text", showIf: "omakaseOff", placeholder: "예) 둥근 카드, 말풍선" },
      { id: "offStyle", label: "휴일 표기", type: "text", showIf: "omakaseOff", placeholder: "예) 회색으로 흐리게, 「휴방」 도장" },
      { id: "headline", label: "상단 제목 문구", type: "text", showIf: "omakaseOff", placeholder: "예) WEEKLY SCHEDULE" },
      { id: "mood", label: "원하는 분위기·색·키워드", type: "longtext", required: true, placeholder: "예) 파스텔 하늘색, 바다, 귀여운 느낌" },
      { id: "members", label: "팀원 수", type: "number", showIf: "team", placeholder: "예) 4" },
      { id: "firstUse", label: "첫 사용 희망일", type: "date" },
    ] as FormField[],
    attachNote: "캐릭터·참고 이미지는 아트머그 문의 창에 첨부해 주세요.",
  },
};

export type Doc = typeof doc;
