// 관리자 계정을 처음 만들 때 쓰는 도우미.
// 사용: node add-admin.mjs <아이디> "<이름>"
//  → 임시 비밀번호를 만들어 보여 주고, D1 에 넣을 SQL 을 add-admin.sql 로 저장한다.
//  → npx wrangler d1 execute foxlc --remote --file=add-admin.sql
// 첫 로그인 뒤에는 '관리자' 화면에서 비밀번호를 꼭 바꾼다 (must_change = 1).
import { writeFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const { hashPassword } = await import("./src/index.js");

const [username, name = ""] = process.argv.slice(2);
if (!username || !/^[a-z0-9._-]{3,40}$/.test(username)) {
  console.error('사용: node add-admin.mjs <아이디(영문 소문자)> "<이름>"');
  process.exit(1);
}
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const temp = Array.from(crypto.getRandomValues(new Uint8Array(14)), (b) => alphabet[b % alphabet.length]).join("");
const h = await hashPassword(temp);
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
writeFileSync("add-admin.sql",
  `INSERT INTO users (username, name, pw_salt, pw_hash, role, must_change) VALUES (${q(username)}, ${q(name)}, ${q(h.salt)}, ${q(h.hash)}, 'admin', 1);\n`);
console.log(`아이디: ${username}\n임시 비밀번호: ${temp}\nSQL: add-admin.sql`);
