// 후기 칸: 글만 있는 후기 카드가 두 줄로 서로 반대 방향으로 흐르고, 뒤에는 작업물 벽이 따로 흐른다.
// 후기와 작업물은 짝을 짓지 않는다(손님 이름·작업물을 후기에 붙이지 않음, 2026-11-08 주인 답).
// 움직임 줄이기 설정이면 둘 다 멈추고 후기 줄은 손가락으로 넘긴다(index.css .marquee).
import { Fragment, type CSSProperties, type ReactNode } from "react";

interface Review {
  quote: string;
  body: string;
}

/** 목록을 n개 이상이 될 때까지 되풀이 */
const repeat = <T,>(items: T[], n: number) =>
  items.length ? Array.from({ length: Math.max(1, Math.ceil(n / items.length)) }, () => items).flat() : [];
/** k칸 돌린 목록(두 줄이 같은 후기를 위아래로 맞대지 않게) */
const rotate = <T,>(items: T[], k: number) => (items.length ? [...items.slice(k % items.length), ...items.slice(0, k % items.length)] : items);

const lines = (text: string) =>
  text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));

function Card({ r }: { r: Review }) {
  return (
    <figure className="w-[272px] md:w-[340px] mr-4 md:mr-5 rounded-2xl bg-[#fffdf9] border-2 border-[#1b1612] shadow-[4px_4px_0_#1b1612] p-4 md:p-5">
      <span aria-hidden className="block font-[BagelFat] text-3xl leading-none text-primary h-5">“</span>
      <blockquote className="font-bold text-[15px] md:text-base leading-snug text-[#1b1612]">{r.quote}</blockquote>
      <p className="mt-2.5 pt-2.5 border-t-2 border-dashed border-[#1b1612]/15 text-[13px] md:text-sm text-[#1b1612]/65 leading-relaxed">{lines(r.body)}</p>
    </figure>
  );
}

/** 후기 한 줄. 같은 묶음을 두 번 놓고 -50%까지 흘려 이음매 없이 돈다. */
function Row({ items, reverse, sec }: { items: Review[]; reverse?: boolean; sec: number }) {
  return (
    <div className="marquee-row overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
      <div className={reverse ? "marquee marquee-rev" : "marquee"} style={{ "--dur": `${sec}s` } as CSSProperties}>
        {[0, 1].map((copy) => (
          <div key={copy} className={copy ? "marquee-dup flex items-start" : "flex items-start"} aria-hidden={copy ? true : undefined}>
            {items.map((r, i) => (
              <Card key={i} r={r} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Reviews({ reviews, thumbs, caption, head }: { reviews: Review[]; thumbs: string[]; caption: string; head: ReactNode }) {
  if (!reviews.length) return null;
  const top = repeat(reviews, 6);
  const bottom = repeat(rotate([...reviews].reverse(), 1), 6);
  return (
    <section id="review" className="relative overflow-hidden py-12 md:py-16 bg-[#f5f0ed]">
      {/* 작업물 벽: 꾸밈. 기울인 세 줄이 후기와 다른 속도로 흐른다 */}
      {thumbs.length > 0 && (
        <div aria-hidden className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute left-1/2 top-1/2 w-[2200px] -translate-x-1/2 -translate-y-1/2 -rotate-[8deg] space-y-3 md:space-y-4">
            {[0, 1, 2, 3, 4].map((row) => {
              const list = repeat(rotate(thumbs, row * 2), 12);
              return (
                <div key={row} className="overflow-hidden">
                  <div className={row % 2 ? "marquee marquee-rev" : "marquee"} style={{ "--dur": `${110 + row * 17}s` } as CSSProperties}>
                    {[0, 1].map((copy) => (
                      <div key={copy} className="flex">
                        {list.map((src, i) => (
                          <img key={i} src={src} alt="" loading="lazy" draggable={false} className="w-[180px] md:w-[240px] aspect-video mr-3 md:mr-4 rounded-lg object-cover border-2 border-[#1b1612]/80" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#f5f0ed_0%,rgba(245,240,237,.86)_22%,rgba(245,240,237,.8)_55%,rgba(245,240,237,.86)_85%,#f5f0ed_100%)]" />
        </div>
      )}

      <div className="relative">
        <div className="px-4">{head}</div>
        <div className="space-y-2 md:space-y-3">
          <Row items={top} sec={top.length * 9} />
          <Row items={bottom} reverse sec={bottom.length * 10} />
        </div>
        {caption && (
          <p className="mt-6 px-4 text-center">
            <span className="inline-block rounded-2xl bg-[#1b1612] text-[#f5f0ed] text-[12.5px] md:text-[13px] font-semibold px-3.5 py-1.5">{caption}</span>
          </p>
        )}
      </div>
    </section>
  );
}
