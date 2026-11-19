-- 사용자: 지금은 관리자(admin)만 쓰고, 나중에 회원가입을 열면 member 를 쓴다.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  pw_salt TEXT NOT NULL,
  pw_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  must_change INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 로그인 실패 기록 (비밀번호 무작위 대입 막기)
CREATE TABLE IF NOT EXISTS login_failures (
  username TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_login_failures ON login_failures (username, at);

-- 채용공고
CREATE TABLE IF NOT EXISTS recruit_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  employment TEXT NOT NULL DEFAULT '',
  deadline TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  body TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  author_id INTEGER REFERENCES users (id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
