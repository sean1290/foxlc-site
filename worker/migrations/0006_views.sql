-- 조회수: 폭스뉴스(news) · SEL 칼럼(column) · 폭스 소식(notice) 글마다 하나
CREATE TABLE IF NOT EXISTS views (
  kind TEXT NOT NULL CHECK (kind IN ('news', 'column', 'notice')),
  target TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, target)
);
