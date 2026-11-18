// 네이버 스마트플레이스 '소식'(포스터 + 문구)을 data/naver.json 과 static/naver-img/ 로 가져온다.
// m.place.naver.com 의 소식 페이지에 들어 있는 __APOLLO_STATE__ 를 읽는다 (최근 글 약 20개).
// - 예전에 가져온 글은 목록에서 빠져도 남겨 둔다. 삭제 표시(isDeleted)된 글만 지운다.
// - 포스터 원본은 PNG 1~2MB라서, 내려받은 뒤 scripts/shrink-images.py 가 JPEG 으로 줄인다.
// 글을 하나도 읽지 못하면 오류로 끝난다.
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data/naver.json");
const IMG_DIR = path.join(ROOT, "static/naver-img");
const PLACE_ID = "1874946138";
const FEED_URL = `https://m.place.naver.com/place/${PLACE_ID}/feed`;
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9", Referer: "https://m.place.naver.com/" },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (i >= tries) throw new Error(`${url} → ${e.message}`);
      await sleep(3000 * i);
    }
  }
}

export function parseFeeds(html) {
  const key = "window.__APOLLO_STATE__ = ";
  const start = html.indexOf(key);
  if (start < 0) throw new Error("__APOLLO_STATE__ 를 찾지 못했습니다 (페이지 구조 변경 또는 차단).");
  // JSON 객체 끝을 괄호 짝으로 찾는다 (문자열 안의 괄호는 건너뜀).
  let i = start + key.length, depth = 0, inStr = false, esc = false;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) { i++; break; }
  }
  const state = JSON.parse(html.slice(start + key.length, i));
  return Object.entries(state)
    .filter(([k, v]) => k.startsWith("Feed:") && v && v.feedId)
    .map(([, v]) => ({
      feedId: v.feedId,
      date: v.createdString,                       // YYYYMMDD
      title: (v.title || "").trim(),
      text: (v.desc || "").replace(/\r\n/g, "\n").trim(),
      category: v.category || "",
      period: v.period || "",
      deleted: !!v.isDeleted,
      images: (v.media || []).filter((m) => m.mediaType === "IMAGE" && m.thumbnail).map((m) => m.thumbnail),
    }));
}

async function downloadImages(post) {
  const dir = path.join(IMG_DIR, String(post.feedId));
  await mkdir(dir, { recursive: true });
  let n = 0;
  for (const url of post.images) {
    const buf = Buffer.from(await (await get(url)).arrayBuffer());
    if (!buf.length) continue;
    // 확장자는 원본 그대로(.orig) 두고, shrink-images.py 가 n.jpg 로 바꾼다.
    await writeFile(path.join(dir, `${n}.orig`), buf);
    n++;
    await sleep(200);
  }
  return n;
}

async function main() {
  const html = await (await get(FEED_URL)).text();
  const feeds = parseFeeds(html);
  if (feeds.length === 0) throw new Error("네이버 소식을 하나도 읽지 못했습니다.");

  const old = existsSync(DATA) ? JSON.parse(await readFile(DATA, "utf8")) : [];
  const byId = new Map(old.map((p) => [p.feedId, p]));
  let added = 0, updated = 0, removed = 0;

  for (const f of feeds) {
    const prev = byId.get(f.feedId);
    if (f.deleted) {
      if (prev) { byId.delete(f.feedId); await rm(path.join(IMG_DIR, String(f.feedId)), { recursive: true, force: true }); removed++; }
      continue;
    }
    if (prev) {
      const next = { ...prev, title: f.title, text: f.text, period: f.period, date: f.date };
      if (JSON.stringify(next) !== JSON.stringify(prev)) { byId.set(f.feedId, next); updated++; }
      continue;
    }
    const photos = await downloadImages(f);
    byId.set(f.feedId, { feedId: f.feedId, date: f.date, title: f.title, text: f.text, period: f.period, photos });
    added++;
    console.log(`+ ${f.feedId} ${f.date} 이미지 ${photos}장  ${f.title}`);
  }

  const out = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date) || b.feedId - a.feedId);
  await mkdir(path.dirname(DATA), { recursive: true });
  await writeFile(DATA, JSON.stringify(out, null, 1) + "\n");
  console.log(`네이버 소식: 새 글 ${added}개, 수정 ${updated}개, 삭제 ${removed}개, 전체 ${out.length}개`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error("네이버 소식 동기화 실패:", e.message); process.exit(1); });
}
