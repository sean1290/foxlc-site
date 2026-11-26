-- 연구원 자료실: 직원 게시판 · 캘린더 (승인된 직원 · 관리자만)
CREATE TABLE IF NOT EXISTS staff_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  author_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_staff_posts ON staff_posts (pinned, id);

CREATE TABLE IF NOT EXISTS staff_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES staff_posts (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_staff_comments ON staff_comments (post_id, id);

CREATE TABLE IF NOT EXISTS staff_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,          -- YYYY-MM-DD
  end_date TEXT NOT NULL,            -- YYYY-MM-DD (하루 일정이면 start 와 같다)
  time TEXT NOT NULL DEFAULT '',     -- 예: 14:00 (비우면 종일)
  color TEXT NOT NULL DEFAULT 'navy',
  note TEXT NOT NULL DEFAULT '',
  author_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_staff_events ON staff_events (start_date, end_date);
