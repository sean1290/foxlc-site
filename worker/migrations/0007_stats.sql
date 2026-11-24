-- 방문 통계 (쿠키 없이). IP 는 저장하지 않고, 하루마다 바뀌는 익명 값(vid)만 남긴다.
CREATE TABLE IF NOT EXISTS hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL,                       -- 한국 날짜 YYYY-MM-DD
  at TEXT NOT NULL DEFAULT (datetime('now')),
  path TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  src TEXT NOT NULL DEFAULT 'direct',      -- 유입 경로 (internal = 사이트 안에서 이동)
  ref TEXT NOT NULL DEFAULT '',            -- 이전 사이트 주소의 호스트
  q TEXT NOT NULL DEFAULT '',              -- 검색어 (네이버·다음처럼 알려 주는 경우만)
  device TEXT NOT NULL DEFAULT '',
  browser TEXT NOT NULL DEFAULT '',
  os TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  vid TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hits_day ON hits (day);

-- 회원 로그인 (하루에 한 번만 센다)
CREATE TABLE IF NOT EXISTS logins (
  day TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  PRIMARY KEY (day, user_id)
);
