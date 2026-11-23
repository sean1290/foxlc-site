// 배포 뒤 실행: 최근 3일 안에 올라온 글과 주요 페이지를 IndexNow(네이버 서치어드바이저, 빙 등)에 알린다.
// 구글은 IndexNow 를 쓰지 않으므로 사이트맵(sitemap.xml)으로 수집한다.
// 실패해도 사이트에는 영향이 없다 (경고만 출력).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(await readFile(path.join(ROOT, "site.config.json"), "utf8"));
const base = (config.siteUrl || "").replace(/\/$/, "");
const key = config.indexnowKey;
if (!base || !key) { console.log("siteUrl 또는 indexnowKey 가 없어 건너뜀"); process.exit(0); }
const xml = await readFile(path.join(ROOT, "dist/sitemap.xml"), "utf8");
const since = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)]
  .filter(([, , d]) => d && d >= since).map(([, u]) => u);
urls.push(base + "/", base + "/videos/", base + "/news/");
const body = JSON.stringify({ host: new URL(base).host, key, keyLocation: `${base}/${key}.txt`, urlList: [...new Set(urls)] });
for (const ep of ["https://searchadvisor.naver.com/indexnow", "https://api.indexnow.org/indexnow"]) {
  try {
    const r = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body, signal: AbortSignal.timeout(20000) });
    console.log(`IndexNow ${ep}: HTTP ${r.status} (${urls.length}개 주소)`);
  } catch (e) { console.log(`IndexNow ${ep}: 실패 ${e.message}`); }
}
