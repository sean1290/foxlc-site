// SEL 칼럼(공개 글)을 API 에서 받아 data/columns.json 으로 저장한다 → 빌드 때 정식 페이지가 된다.
// API 를 못 읽으면 기존 파일을 그대로 두고 오류로 끝난다 (사이트에서 글이 사라지지 않게).
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(await readFile(path.join(ROOT, "site.config.json"), "utf8"));
const API = (process.env.FOXLC_API ?? config.apiBase ?? "").replace(/\/$/, "");
if (!API) { console.log("apiBase 가 없어 건너뜀"); process.exit(0); }

try {
  const res = await fetch(`${API}/api/columns?full=1`, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { columns } = await res.json();
  if (!Array.isArray(columns)) throw new Error("형식이 올바르지 않습니다");
  const out = columns.filter((c) => c.status === "published").map(({ id, title, category, body, cover, author_name, published_at, updated_at }) =>
    ({ id, title, category, body, cover, author: author_name, published: (published_at || "").slice(0, 10), updated: (updated_at || "").slice(0, 10) }));
  await writeFile(path.join(ROOT, "data/columns.json"), JSON.stringify(out, null, 1) + "\n");
  console.log(`SEL 칼럼: ${out.length}개`);
} catch (e) {
  console.error("SEL 칼럼 동기화 실패:", e.message);
  process.exit(1);
}
