// 폭스러닝센터 사이트 API — Cloudflare Worker + D1
//
//  공개      GET  /api/recruit             채용공고 목록
//            GET  /api/recruit/:id         채용공고 한 건 (조회수 +1)
//  로그인    POST /api/auth/login          { username, password } → { token, user }
//            GET  /api/auth/me             현재 사용자
//            POST /api/auth/password       { current, next } 비밀번호 변경
//  관리자    POST   /api/recruit           새 공고
//            PUT    /api/recruit/:id       공고 수정
//            DELETE /api/recruit/:id       공고 삭제
//            GET    /api/admin/users       계정 목록
//            POST   /api/admin/users       계정 추가 { username, name, password, role }
//  SEL 칼럼  GET  /api/columns             공개 글 목록 (?all=1 + 관리자 → 임시 저장 글 포함)
//            GET  /api/columns/:id         글 한 건 (조회수 +1)
//            POST/PUT/DELETE /api/columns[/:id]   관리자
//            POST /api/images              사진 올리기 (관리자, 본문 = 이미지 바이트)
//            GET  /api/images/:id          사진 보기 (공개, 오래 캐시)
//
// 로그인 토큰은 HMAC 서명한 짧은 문자열(7일)이며 Authorization: Bearer 로 보낸다.
// 사이트(github.io)와 API(workers.dev)의 주소가 달라 쿠키 대신 이 방식을 쓴다.

const TOKEN_DAYS = 7;
const PBKDF2_ITER = 100000;
const MAX_FAILS = 10;          // 15분 안에 이만큼 틀리면 잠시 잠근다
const enc = new TextEncoder();

// ── 응답 도우미 ─────────────────────────────────────────
function cors(req, env) {
  const origin = req.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const h = { "Vary": "Origin" };
  if (allowed.includes(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
    h["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
    h["Access-Control-Max-Age"] = "86400";
  }
  return h;
}
const json = (req, env, data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors(req, env) },
  });
const fail = (req, env, status, message) => json(req, env, { error: message }, status);

// ── 암호 · 토큰 ─────────────────────────────────────────
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function hashPassword(password, saltHex) {
  const salt = saltHex ? Uint8Array.from(saltHex.match(/../g).map((h) => parseInt(h, 16))) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITER }, key, 256);
  return { salt: hex(salt), hash: hex(bits) };
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function hmacKey(env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new Error("SESSION_SECRET is not set");
  return crypto.subtle.importKey("raw", enc.encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function makeToken(env, user) {
  const payload = b64u(enc.encode(JSON.stringify({ uid: user.id, role: user.role, exp: Date.now() + TOKEN_DAYS * 864e5 })));
  const sig = b64u(await crypto.subtle.sign("HMAC", await hmacKey(env), enc.encode(payload)));
  return `${payload}.${sig}`;
}
async function readToken(env, req) {
  const m = /^Bearer\s+([\w-]+)\.([\w-]+)$/.exec(req.headers.get("Authorization") || "");
  if (!m) return null;
  const ok = await crypto.subtle.verify("HMAC", await hmacKey(env), fromB64u(m[2]), enc.encode(m[1]));
  if (!ok) return null;
  const p = JSON.parse(new TextDecoder().decode(fromB64u(m[1])));
  if (!p.exp || p.exp < Date.now()) return null;
  // 역할은 매번 DB에서 다시 읽는다 (권한이 바뀌거나 계정이 지워지면 바로 반영)
  return env.DB.prepare("SELECT id, username, name, role, must_change FROM users WHERE id = ?").bind(p.uid).first();
}

// ── 입력 검사 ───────────────────────────────────────────
async function body(req) {
  try { return await req.json(); } catch { return null; }
}
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
function postFields(b) {
  const title = str(b.title, 120);
  const text = str(b.body, 20000);
  if (!title || !text) return { error: "제목과 내용을 입력해 주세요." };
  const deadline = str(b.deadline, 10);
  if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return { error: "마감일 형식이 올바르지 않습니다." };
  return {
    title, body: text,
    category: str(b.category, 60),
    employment: str(b.employment, 30),
    deadline: deadline || null,
    status: b.status === "closed" ? "closed" : "open",
  };
}

function columnFields(b) {
  const title = str(b.title, 150);
  const text = typeof b.body === "string" ? b.body.replace(/\r\n/g, "\n").trim().slice(0, 60000) : "";
  if (!title || !text) return { error: "제목과 내용을 입력해 주세요." };
  const cover = (text.match(/!\[[^\]]*\]\((https:\/\/[^)\s]+)\)/) || [])[1] || null;
  return { title, body: text, category: str(b.category, 40), status: b.status === "draft" ? "draft" : "published", cover };
}
// 새 글을 공개하면 사이트를 다시 만들도록 GitHub Actions 를 깨운다 (GITHUB_TOKEN 비밀값이 있을 때만)
async function triggerRebuild(env, ctx) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return;
  const job = fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/site.yml/dispatches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "foxlc-api", "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "main" }),
  }).catch(() => {});
  if (ctx && ctx.waitUntil) ctx.waitUntil(job);
}

// ── 라우터 ──────────────────────────────────────────────
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "");
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req, env) });

    try {
      // 공개: 목록
      if (path === "/api/recruit" && req.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT id, title, category, employment, deadline, status, views, created_at FROM recruit_posts ORDER BY id DESC LIMIT 500"
        ).all();
        return json(req, env, { posts: results });
      }
      const one = /^\/api\/recruit\/(\d+)$/.exec(path);
      if (one && req.method === "GET") {
        const id = Number(one[1]);
        await env.DB.prepare("UPDATE recruit_posts SET views = views + 1 WHERE id = ?").bind(id).run();
        const post = await env.DB.prepare(
          "SELECT id, title, category, employment, deadline, status, body, views, created_at, updated_at FROM recruit_posts WHERE id = ?"
        ).bind(id).first();
        return post ? json(req, env, { post }) : fail(req, env, 404, "공고를 찾을 수 없습니다.");
      }

      const img = /^\/api\/images\/(\d+)$/.exec(path);
      if (img && req.method === "GET") {
        const row = await env.DB.prepare("SELECT mime, data FROM images WHERE id = ?").bind(Number(img[1])).first();
        if (!row) return new Response("Not found", { status: 404 });
        return new Response(new Uint8Array(row.data), { headers: { "Content-Type": row.mime, "Cache-Control": "public, max-age=31536000, immutable", "Access-Control-Allow-Origin": "*" } });
      }
      const col = /^\/api\/columns\/(\d+)$/.exec(path);

      // 로그인
      if (path === "/api/auth/login" && req.method === "POST") {
        const b = await body(req);
        const username = str(b && b.username, 40).toLowerCase();
        const password = typeof (b && b.password) === "string" ? b.password : "";
        if (!username || !password) return fail(req, env, 400, "아이디와 비밀번호를 입력해 주세요.");
        const fails = await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM login_failures WHERE username = ? AND at > datetime('now', '-15 minutes')"
        ).bind(username).first();
        if (fails.n >= MAX_FAILS) return fail(req, env, 429, "로그인 시도가 너무 많습니다. 15분 뒤에 다시 시도해 주세요.");
        const u = await env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
        const check = await hashPassword(password, u ? u.pw_salt : "00".repeat(16));
        if (!u || !safeEqual(check.hash, u.pw_hash)) {
          await env.DB.prepare("INSERT INTO login_failures (username) VALUES (?)").bind(username).run();
          return fail(req, env, 401, "아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        await env.DB.prepare("DELETE FROM login_failures WHERE username = ?").bind(username).run();
        const user = { id: u.id, username: u.username, name: u.name, role: u.role, must_change: u.must_change };
        return json(req, env, { token: await makeToken(env, user), user });
      }

      const me = await readToken(env, req);

      if (path === "/api/columns" && req.method === "GET") {
        const all = url.searchParams.get("all") === "1" && me && me.role === "admin";
        const { results } = await env.DB.prepare(
          `SELECT id, title, category, cover, status, author_name, views, created_at, updated_at, published_at${url.searchParams.get("full") === "1" ? ", body" : ""} FROM columns ${all ? "" : "WHERE status = 'published'"} ORDER BY COALESCE(published_at, created_at) DESC, id DESC LIMIT 1000`
        ).all();
        return json(req, env, { columns: results });
      }
      if (col && req.method === "GET") {
        const id = Number(col[1]);
        const c = await env.DB.prepare("SELECT * FROM columns WHERE id = ?").bind(id).first();
        if (!c || (c.status !== "published" && !(me && me.role === "admin"))) return fail(req, env, 404, "글을 찾을 수 없습니다.");
        if (c.status === "published") await env.DB.prepare("UPDATE columns SET views = views + 1 WHERE id = ?").bind(id).run();
        delete c.author_id;
        return json(req, env, { column: c });
      }

      if (path === "/api/auth/me" && req.method === "GET") {
        return me ? json(req, env, { user: me }) : fail(req, env, 401, "로그인이 필요합니다.");
      }
      if (path === "/api/auth/password" && req.method === "POST") {
        if (!me) return fail(req, env, 401, "로그인이 필요합니다.");
        const b = await body(req) || {};
        const u = await env.DB.prepare("SELECT pw_salt, pw_hash FROM users WHERE id = ?").bind(me.id).first();
        const cur = await hashPassword(String(b.current || ""), u.pw_salt);
        if (!safeEqual(cur.hash, u.pw_hash)) return fail(req, env, 400, "현재 비밀번호가 올바르지 않습니다.");
        const next = String(b.next || "");
        if (next.length < 8) return fail(req, env, 400, "새 비밀번호는 8자 이상이어야 합니다.");
        const h = await hashPassword(next);
        await env.DB.prepare("UPDATE users SET pw_salt = ?, pw_hash = ?, must_change = 0 WHERE id = ?").bind(h.salt, h.hash, me.id).run();
        return json(req, env, { ok: true });
      }

      // 여기부터는 관리자만
      const adminOnly = () => (!me ? fail(req, env, 401, "로그인이 필요합니다.") : me.role !== "admin" ? fail(req, env, 403, "관리자만 할 수 있습니다.") : null);

      if (path === "/api/recruit" && req.method === "POST") {
        const no = adminOnly(); if (no) return no;
        const f = postFields(await body(req) || {});
        if (f.error) return fail(req, env, 400, f.error);
        const r = await env.DB.prepare(
          "INSERT INTO recruit_posts (title, category, employment, deadline, status, body, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(f.title, f.category, f.employment, f.deadline, f.status, f.body, me.id).run();
        return json(req, env, { id: r.meta.last_row_id }, 201);
      }
      if (one && req.method === "PUT") {
        const no = adminOnly(); if (no) return no;
        const f = postFields(await body(req) || {});
        if (f.error) return fail(req, env, 400, f.error);
        const r = await env.DB.prepare(
          "UPDATE recruit_posts SET title = ?, category = ?, employment = ?, deadline = ?, status = ?, body = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(f.title, f.category, f.employment, f.deadline, f.status, f.body, Number(one[1])).run();
        return r.meta.changes ? json(req, env, { ok: true }) : fail(req, env, 404, "공고를 찾을 수 없습니다.");
      }
      if (one && req.method === "DELETE") {
        const no = adminOnly(); if (no) return no;
        await env.DB.prepare("DELETE FROM recruit_posts WHERE id = ?").bind(Number(one[1])).run();
        return json(req, env, { ok: true });
      }
      if (path === "/api/admin/users" && req.method === "GET") {
        const no = adminOnly(); if (no) return no;
        const { results } = await env.DB.prepare("SELECT id, username, name, role, created_at FROM users ORDER BY id").all();
        return json(req, env, { users: results });
      }
      if (path === "/api/admin/users" && req.method === "POST") {
        const no = adminOnly(); if (no) return no;
        const b = await body(req) || {};
        const username = str(b.username, 40).toLowerCase();
        if (!/^[a-z0-9._-]{3,40}$/.test(username)) return fail(req, env, 400, "아이디는 영문 소문자·숫자·._- 3자 이상으로 정해 주세요.");
        const password = String(b.password || "");
        if (password.length < 8) return fail(req, env, 400, "비밀번호는 8자 이상이어야 합니다.");
        const role = b.role === "member" ? "member" : "admin";
        const h = await hashPassword(password);
        try {
          await env.DB.prepare("INSERT INTO users (username, name, pw_salt, pw_hash, role, must_change) VALUES (?, ?, ?, ?, ?, 1)")
            .bind(username, str(b.name, 40), h.salt, h.hash, role).run();
        } catch {
          return fail(req, env, 409, "이미 있는 아이디입니다.");
        }
        return json(req, env, { ok: true }, 201);
      }

      if (path === "/api/images" && req.method === "POST") {
        const no = adminOnly(); if (no) return no;
        const mime = (req.headers.get("Content-Type") || "").split(";")[0].trim();
        if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) return fail(req, env, 400, "JPG·PNG·WEBP 사진만 올릴 수 있습니다.");
        const buf = await req.arrayBuffer();
        if (!buf.byteLength || buf.byteLength > 1800000) return fail(req, env, 400, "사진이 너무 큽니다. (최대 1.8MB)");
        const r = await env.DB.prepare("INSERT INTO images (mime, data, size, uploaded_by) VALUES (?, ?, ?, ?)").bind(mime, buf, buf.byteLength, me.id).run();
        return json(req, env, { url: `${url.origin}/api/images/${r.meta.last_row_id}` }, 201);
      }
      if (path === "/api/columns" && req.method === "POST") {
        const no = adminOnly(); if (no) return no;
        const f = columnFields(await body(req) || {});
        if (f.error) return fail(req, env, 400, f.error);
        const r = await env.DB.prepare(
          "INSERT INTO columns (title, category, body, cover, status, author_id, author_name, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'published' THEN datetime('now') END)"
        ).bind(f.title, f.category, f.body, f.cover, f.status, me.id, me.name || me.username, f.status).run();
        if (f.status === "published") await triggerRebuild(env, ctx);
        return json(req, env, { id: r.meta.last_row_id }, 201);
      }
      if (col && req.method === "PUT") {
        const no = adminOnly(); if (no) return no;
        const f = columnFields(await body(req) || {});
        if (f.error) return fail(req, env, 400, f.error);
        const r = await env.DB.prepare(
          "UPDATE columns SET title = ?, category = ?, body = ?, cover = ?, status = ?, updated_at = datetime('now'), published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, datetime('now')) ELSE published_at END WHERE id = ?"
        ).bind(f.title, f.category, f.body, f.cover, f.status, f.status, Number(col[1])).run();
        if (!r.meta.changes) return fail(req, env, 404, "글을 찾을 수 없습니다.");
        await triggerRebuild(env, ctx);
        return json(req, env, { ok: true });
      }
      if (col && req.method === "DELETE") {
        const no = adminOnly(); if (no) return no;
        await env.DB.prepare("DELETE FROM columns WHERE id = ?").bind(Number(col[1])).run();
        await triggerRebuild(env, ctx);
        return json(req, env, { ok: true });
      }

      return fail(req, env, 404, "Not found");
    } catch (e) {
      console.error(e);
      return fail(req, env, 500, "서버 오류가 발생했습니다.");
    }
  },
};
