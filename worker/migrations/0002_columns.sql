-- SEL 칼럼: 관리자(센터장 등)가 쓰는 전문가 글
CREATE TABLE IF NOT EXISTS columns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  cover TEXT,                                   -- 대표 사진 주소 (본문 첫 사진)
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  author_id INTEGER REFERENCES users (id),
  author_name TEXT NOT NULL DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_columns_status ON columns (status, published_at);

-- 글에 넣는 사진 (올릴 때 브라우저에서 1600px JPEG 로 줄여서 저장)
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  size INTEGER NOT NULL,
  uploaded_by INTEGER REFERENCES users (id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
