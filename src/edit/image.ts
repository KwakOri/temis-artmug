// 작업물 사진: 고른 원본을 브라우저에서 줄여 두 벌(s: 목록용 긴 변 720, l: 확대용 긴 변 1600)의 webp로 만든다.
// 사파리처럼 webp로 못 굽는 브라우저는 jpeg가 나온다. 이름은 .webp지만 <img>는 내용을 보고 그리므로 그대로 뜬다.
const SIZES = { s: 720, l: 1600 } as const;

async function shrink(bmp: ImageBitmap, max: number): Promise<Blob> {
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const webp = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/webp", 0.82));
  if (webp?.type === "image/webp") return webp;
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error("사진을 줄이지 못했어요"))), "image/jpeg", 0.85));
}

export async function makeWork(file: File): Promise<{ s: Blob; l: Blob }> {
  const bmp = await createImageBitmap(file);
  try {
    return { s: await shrink(bmp, SIZES.s), l: await shrink(bmp, SIZES.l) };
  } finally {
    bmp.close();
  }
}

export const toDataUrl = (b: Blob) =>
  new Promise<string>((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => fail(r.error);
    r.readAsDataURL(b);
  });
