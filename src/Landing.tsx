// artmug.temis.kr 맨 앞: 상세페이지를 납품받은 손님용 관리 사이트 안내. 홍보 페이지가 아니다.
import { ArrowRight, ChevronDown } from "lucide-react";
import { useState, type FormEvent } from "react";
import { CLIENTS } from "./page/remote";

const STEPS = [
  { title: "내 편집기 열기", body: "납품 때 받은 주소(artmug.temis.kr/내 id/edit)로 들어오거나, 위 칸에 id를 넣어 주세요." },
  { title: "구글 로그인", body: "「구글 로그인」을 누르고 권한을 허용해 주세요. 이 사이트가 만든 파일 하나만 다룰 수 있는 권한이에요." },
  { title: "칸 고치기", body: "위쪽 탭에서 문구·가격·주의사항·신청 양식을 고쳐요. PC에서는 오른쪽 미리보기가 바로 바뀌어요." },
  { title: "저장", body: "「저장」을 누르고 상세페이지를 새로고침하면 바뀐 내용이 보여요. 아트머그에 넣은 페이지도 같이 바뀌어요." },
];

const FAQ = [
  {
    q: "처음 저장할 때 뜨는 파일 ID는 뭔가요?",
    a: "내 드라이브에 만들어진 저장 파일의 번호예요. 처음 한 번만 TEMIS에 보내 주세요. 등록하기 전까지는 저장해도 상세페이지에 반영되지 않아요.",
  },
  {
    q: "저장한 내용은 어디에 있나요?",
    a: "로그인한 구글 계정의 드라이브에 artmug-page-<id>.json 파일 하나로 저장돼요. 이 파일을 지우면 상세페이지가 처음 내용으로 돌아가니 지우지 말아 주세요.",
  },
  {
    q: "내 드라이브의 다른 파일도 보이나요?",
    a: "아니요. 이 사이트가 만든 파일만 열고 고칠 수 있는 권한(drive.file)만 받아요. TEMIS도 손님 드라이브를 볼 수 없어요.",
  },
  {
    q: "다른 구글 계정으로 고칠 수 있나요?",
    a: "처음 저장한 계정으로만 고칠 수 있어요. 계정을 바꾸고 싶으면 TEMIS에 말해 주세요.",
  },
  {
    q: "폰에서도 되나요?",
    a: "네. 폰에서는 옆 미리보기가 없으니, 저장한 뒤 상세페이지를 새로고침해서 확인해 주세요.",
  },
  {
    q: "여기서 못 고치는 것도 있나요?",
    a: "첫 화면 디자인, 작업물 사진, 구성 개수는 여기서 바꿀 수 없어요. 필요하면 TEMIS에 요청해 주세요.",
  },
];

export default function Landing() {
  const [id, setId] = useState("");
  const [err, setErr] = useState("");

  const go = (e: FormEvent) => {
    e.preventDefault();
    const v = id.trim().toLowerCase();
    if (!(v in CLIENTS)) return setErr("등록되지 않은 id예요. 납품 때 받은 주소를 확인해 주세요.");
    location.href = `/${v}/edit`;
  };

  return (
    <div className="min-h-screen bg-[#f5f0ed] text-ink">
      <nav className="h-[52px] md:h-[60px] border-b border-timetable-card-border">
        <div className="mx-auto max-w-[880px] h-full px-4 md:px-6 flex items-center gap-2">
          <span className="font-[BagelFat] text-primary text-lg md:text-xl">TEMIS</span>
          <span className="text-sm font-bold text-ink/70">상세페이지 관리</span>
        </div>
      </nav>

      <main className="mx-auto max-w-[880px] px-4 md:px-6 py-10 md:py-14 space-y-12">
        <section className="text-center">
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">
            아트머그 상세페이지
            <br />
            <span className="text-primary">관리 사이트</span>
          </h1>
          <p className="mt-3 text-[15px] md:text-base text-ink/70 leading-relaxed">
            TEMIS에서 상세페이지를 받으신 분이
            <br className="md:hidden" /> 문구와 가격을 직접 고치는 곳이에요.
          </p>

          <form onSubmit={go} className="mx-auto mt-7 max-w-[440px] rounded-2xl bg-white p-4 md:p-5 shadow-sm text-left">
            <label className="block text-[13px] font-bold text-ink/70" htmlFor="client-id">
              내 id
            </label>
            <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
              <div className="flex flex-1 items-center rounded-lg border border-timetable-card-border bg-[#fbf8f6] px-3 text-sm focus-within:outline focus-within:outline-primary">
                <span className="text-ink/40 shrink-0">artmug.temis.kr/</span>
                <input
                  id="client-id"
                  value={id}
                  onChange={(e) => {
                    setId(e.target.value);
                    setErr("");
                  }}
                  placeholder="id"
                  autoCapitalize="none"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent py-2.5 outline-none"
                />
              </div>
              <button type="submit" className="shrink-0 flex items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white">
                편집기 <ArrowRight size={16} />
              </button>
            </div>
            {err && <p className="mt-2 text-[13px] text-red-500">{err}</p>}
          </form>
        </section>

        <section>
          <h2 className="text-xl md:text-2xl font-extrabold text-center">이렇게 고쳐요</h2>
          <ol className="mt-6 grid gap-3 md:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3 rounded-2xl bg-white p-4 md:p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
                <div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="mt-1 text-[14px] text-ink/70 leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-xl md:text-2xl font-extrabold text-center">자주 묻는 것</h2>
          <div className="mt-6 space-y-2">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-xl bg-white px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-[15px]">
                  <span className="flex-1">{f.q}</span>
                  <ChevronDown size={18} className="text-ink/40 transition group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-[14px] text-ink/70 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="text-center text-[13px] text-ink/60 leading-relaxed">
          문제가 생기면 구매하신 아트머그 문의 창으로 TEMIS에 알려 주세요.
        </p>
      </main>

      <footer className="pb-10 text-center text-[12px] text-ink/40">© TEMIS</footer>
    </div>
  );
}
