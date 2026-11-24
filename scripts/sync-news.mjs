// 폭스뉴스(news.foxconnect.kr) 목록을 data/news.json 과 static/news-img/<번호>/0.jpg 로 가져온다.
// - 공개 사이트에는 제목 · 날짜 · 대표사진 · 짧은 요약만 둔다.
// - 본문 전체와 나머지 사진은 학부모 전용이라 이 저장소(공개)에 두지 않는다.
//   → API 서버(worker/)가 따로 가져와 승인된 학부모에게만 보여 준다 (POST /api/news/sync).
// - 이미 가져온 글(newsId 기준)은 대표사진을 다시 받지 않는다.
// 글을 하나도 읽지 못하면 조용히 넘어가지 않고 오류로 끝난다.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data/news.json");
const IMG_DIR = path.join(ROOT, "static/news-img");
const HOST = "https://news.foxconnect.kr";
const LIST = (page) =>
  `${HOST}/embed/fox/news/foxNewsList.do?searchSiteId=SITE_00000&pageIndex=${page}&searchCondition=ALL&searchNewsTyCode=NEWS&searchKeyword=`;

const MIN_ID = 6860;     // 이 번호보다 오래된 글은 가져오지 않는다 (Wix 때와 같은 시작점)
const MAX_PAGES = 15;    // 한 번에 훑는 목록 페이지 수 상한 (페이지당 8개)
const UA = "Mozilla/5.0 (compatible; foxlc-site-sync)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (i >= tries) throw new Error(`${url} → ${e.message}`);
      await sleep(2000 * i);
    }
  }
}

function unescape(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/﻿/g, "");
}
const clean = (s) => unescape(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

export function parseList(html) {
  return html.split('news-item" data-news-id="').slice(1).map((chunk) => {
    const newsId = chunk.slice(0, chunk.indexOf('"'));
    const date = (chunk.match(/card-regist-date">\s*(\d{4}\.\d{2}\.\d{2})/) || [])[1] || "";
    const titleBlock = chunk.split("card-title")[1] || "";
    let title = clean((titleBlock.match(/<a[^>]*>([\s\S]*?)<\/a>/) || [])[1] || "");
    if (/^\[[^\]]+\]$/.test(title)) title += " 소식";
    const cn = chunk.split('card-news-cn"')[1] || "";
    const text = clean((cn.match(/<span>([\s\S]*?)<\/span>/) || [])[1] || "");
    const atchFileId = (chunk.match(/card-img-top[\s\S]*?getThumbnail\.do\?atchFileId=([A-Za-z0-9_]+)/) || [])[1] || "";
    // " . . . . " 처럼 점이 이어진 자리가 사진이 들어가는 곳이다.
    const parts = text.split(/(?:\s+\.){3,}\s*/).map((p) => p.trim()).filter(Boolean);
    return { newsId, num: parseInt(newsId.replace(/\D/g, ""), 10), date, title, atchFileId,
             before: parts[0] || "", after: parts.slice(1) };
  }).filter((p) => p.newsId && p.title);
}

// 대표사진(첫 장)만 받는다. 있으면 1, 없으면 0
async function downloadCover(post) {
  if (!post.atchFileId) return 0;
  const res = await get(`${HOST}/fms/getImage.do?atchFileId=${post.atchFileId}&fileSn=0`);
  const buf = Buffer.from(await res.arrayBuffer());
  const type = res.headers.get("content-type") || "";
  if (buf.length === 0 || !type.startsWith("image/")) return 0;
  const dir = path.join(IMG_DIR, String(post.num));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "0.jpg"), buf);
  return 1;
}
// 목록 카드에 보이는 짧은 요약 (본문 앞부분)
export const excerptOf = (it) => { const t = [it.before, ...it.after].join(" ").trim(); return t.length > 110 ? t.slice(0, 110) + "…" : t; };

async function main() {
  const known = existsSync(DATA) ? JSON.parse(await readFile(DATA, "utf8")) : [];
  const byId = new Map(known.map((p) => [p.newsId, p]));
  let added = 0, updated = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const items = parseList(await (await get(LIST(page))).text());
    if (page === 1 && items.length === 0) {
      throw new Error("폭스뉴스 목록에서 글을 하나도 읽지 못했습니다. 페이지 구조가 바뀌었는지 확인하세요.");
    }
    if (items.length === 0) break;
    let fresh = 0;
    for (const it of items) {
      if (it.num < MIN_ID) continue;
      const old = byId.get(it.newsId);
      if (old) {
        // 제목·본문이 고쳐졌으면 반영한다 (사진은 그대로 둔다).
        const next = { ...old, date: it.date, title: it.title, excerpt: excerptOf(it) };
        if (JSON.stringify(next) !== JSON.stringify(old)) { byId.set(it.newsId, next); updated++; }
        continue;
      }
      const photos = await downloadCover(it);
      byId.set(it.newsId, { newsId: it.newsId, num: it.num, date: it.date, title: it.title, excerpt: excerptOf(it), photos });
      added++; fresh++;
      console.log(`+ ${it.newsId} ${it.date} 대표사진 ${photos ? "있음" : "없음"}  ${it.title}`);
    }
    const reachedOld = items.some((it) => it.num < MIN_ID);
    if (reachedOld || (fresh === 0 && known.length > 0)) break;
    await sleep(300);
  }

  const out = [...byId.values()].sort((a, b) => b.num - a.num);
  await mkdir(path.dirname(DATA), { recursive: true });
  await writeFile(DATA, JSON.stringify(out, null, 1) + "\n");
  console.log(`폭스뉴스: 새 글 ${added}개, 수정 ${updated}개, 전체 ${out.length}개`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error("폭스뉴스 동기화 실패:", e.message); process.exit(1); });
}
