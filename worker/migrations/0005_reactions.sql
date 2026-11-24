-- 좋아요 · 댓글: 폭스뉴스(news) · SEL 칼럼(column) · 폭스 소식(notice) 글에 단다.
-- kind + target 이 글 하나를 가리킨다 (news = 글 번호, column = 칼럼 id, notice = 네이버 소식 feedId).
-- 회원이 탈퇴하거나 지워지면 그 회원의 좋아요 · 댓글도 함께 지워진다.
CREATE TABLE IF NOT EXISTS likes (
  kind TEXT NOT NULL CHECK (kind IN ('news', 'column', 'notice')),
  target TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (kind, target, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('news', 'column', 'notice')),
  target TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments (kind, target, id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments (user_id, created_at);
