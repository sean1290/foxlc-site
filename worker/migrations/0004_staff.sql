-- 회원 종류: 학부모(parent) · 직원(staff). 둘 다 가입 신청 → 관리자 승인
ALTER TABLE users ADD COLUMN kind TEXT NOT NULL DEFAULT 'parent';
ALTER TABLE users ADD COLUMN dept TEXT NOT NULL DEFAULT '';
