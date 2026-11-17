// 유튜브 채널 @future_x_foxconnect 의 최신 영상 목록을 data/videos.json 으로 가져온다.
// RSS(feeds/videos.xml)는 서버에서 404가 나서, /videos 페이지의 ytInitialData 를 읽는다.
// - 최신 30개가 최신순으로 온다. 예전에 가져온 영상은 목록 뒤에 그대로 남긴다.
// - 영상 설명은 이 방법으로 얻을 수 없다. videos.json 의 "description" 을 직접 써 넣으면 유지된다.
// 영상을 하나도 읽지 못하면 오류로 끝난다.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data/videos.json");
const URL_VIDEOS = "https://www.youtube.com/@future_x_foxconnect/videos";

export function parseVideos(html) {
  const start = html.indexOf("var ytInitialData = ");
  if (start < 0) throw new Error("ytInitialData 를 찾지 못했습니다 (동의/캡차 페이지일 수 있음).");
  const from = start + "var ytInitialData = ".length;
  const end = html.indexOf(";</script>", from);
  const data = JSON.parse(html.slice(from, end));
  const out = [];
  const seen = new Set();
  const findDuration = (node) => {
    let found = "";
    (function walk(n) {
      if (found || !n || typeof n !== "object") return;
      if (n.thumbnailBadgeViewModel && /^\d{1,2}(:\d{2}){1,2}$/.test(n.thumbnailBadgeViewModel.text || "")) {
        found = n.thumbnailBadgeViewModel.text; return;
      }
      for (const k in n) walk(n[k]);
    })(node);
    return found;
  };
  (function walk(n) {
    if (!n || typeof n !== "object") return;
    const l = n.lockupViewModel;
    if (l && l.contentId && !seen.has(l.contentId)) {
      const title = l.metadata?.lockupMetadataViewModel?.title?.content || "";
      if (title) {
        seen.add(l.contentId);
        out.push({ videoId: l.contentId, title, duration: findDuration(l) });
      }
    }
    for (const k in n) walk(n[k]);
  })(data);
  return out;
}

async function main() {
  const res = await fetch(URL_VIDEOS, {
    headers: {
      "Accept-Language": "ko",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Cookie": "SOCS=CAI",
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const latest = parseVideos(await res.text());
  if (latest.length === 0) throw new Error("영상을 하나도 읽지 못했습니다. 페이지 구조가 바뀌었는지 확인하세요.");

  const old = existsSync(DATA) ? JSON.parse(await readFile(DATA, "utf8")) : [];
  const oldById = new Map(old.map((v) => [v.videoId, v]));
  const ids = new Set(latest.map((v) => v.videoId));
  const merged = [
    ...latest.map((v) => ({ ...v, description: oldById.get(v.videoId)?.description || "" })),
    ...old.filter((v) => !ids.has(v.videoId)),
  ];
  const added = latest.filter((v) => !oldById.has(v.videoId)).length;
  await mkdir(path.dirname(DATA), { recursive: true });
  await writeFile(DATA, JSON.stringify(merged, null, 1) + "\n");
  console.log(`폭스 소식 영상: 새 영상 ${added}개, 전체 ${merged.length}개`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error("유튜브 동기화 실패:", e.message); process.exit(1); });
}
