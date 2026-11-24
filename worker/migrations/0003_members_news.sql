-- 학부모 회원 (role = 'member') : 가입 신청 → 관리자 승인
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'approved';   -- pending | approved | rejected
ALTER TABLE users ADD COLUMN phone TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN child TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN consent_at TEXT;
ALTER TABLE users ADD COLUMN decided_at TEXT;
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users (role, status);

-- 폭스뉴스 본문 · 사진 (학부모 회원만 볼 수 있다. 공개 사이트에는 제목·대표사진·요약만 있다)
CREATE TABLE IF NOT EXISTS news_posts (
  num INTEGER PRIMARY KEY,
  news_id TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL DEFAULT '',
  before_text TEXT NOT NULL DEFAULT '',
  after_json TEXT NOT NULL DEFAULT '[]',
  atch TEXT NOT NULL DEFAULT '',
  photos INTEGER NOT NULL DEFAULT 0,
  photos_done INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS news_photos (
  num INTEGER NOT NULL,
  idx INTEGER NOT NULL,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  PRIMARY KEY (num, idx)
);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
