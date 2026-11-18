# 폭스러닝센터 홈페이지 (foxlc-site)

Wix를 대신하는 정적 사이트입니다. 외부 패키지 없이 Node 20+ 만으로 빌드합니다.

사이트 주소: https://sean1290.github.io/foxlc-site/

## 구조

| 경로 | 내용 |
|---|---|
| `scripts/build.mjs` | 모든 페이지의 문구·템플릿. `data/` + `static/` → `dist/` |
| `scripts/sync-news.mjs` | news.foxconnect.kr 글과 사진을 `data/news.json`, `static/news-img/` 로 가져옴 |
| `scripts/sync-videos.mjs` | 유튜브 채널 최신 영상을 `data/videos.json` 으로 가져옴 |
| `scripts/sync-naver.mjs` | 네이버 스마트플레이스 '소식'(포스터+문구)을 `data/naver.json`, `static/naver-img/` 로 가져옴 (포스터는 `scripts/shrink-images.py` 가 JPEG 으로 줄임) |
| `static/` | CSS, JS, 이미지, 감정체크 체험판(`static/demo/`) |
| `site.config.json` | `siteUrl`(도메인), `contactEndpoint`(문의 폼 접수 주소), `kakaoChannelUrl` |
| `contact/contact.gs` | 문의 폼을 Google 시트 + 메일로 받는 Apps Script |
| `.github/workflows/site.yml` | 매일 20:40 KST 피드 동기화 → 커밋 → 빌드 → GitHub Pages 배포 |

## 로컬에서 보기

```bash
npm run serve
```

http://localhost:8080 에서 확인합니다. 피드를 직접 가져오려면 `npm run sync`.

## 배포 (GitHub Pages)

1. 새 저장소를 만들고 이 폴더 내용을 루트에 올린다 (기본 브랜치 `main`).
2. 저장소 Settings → Pages → Source 를 **GitHub Actions** 로 바꾼다.
3. Actions 탭에서 "Sync feeds and deploy" 를 한 번 실행한다. 이후 매일 자동으로 돈다.
4. 도메인을 연결하면 `site.config.json` 의 `siteUrl` 에 주소를 넣는다 (sitemap, 공유 미리보기에 쓰임).

`dist/` 는 순수 정적 파일이라 Cloudflare Pages나 Vercel에 올려도 됩니다 (빌드 명령 `node scripts/build.mjs`, 출력 폴더 `dist`).

## 피드가 실패하면

동기화 스크립트는 글이나 영상을 하나도 읽지 못하면 오류로 끝납니다. 워크플로는 기존 데이터로 사이트를
계속 배포한 뒤, 저장소에 "피드 동기화 실패" 이슈를 만들고 실행을 실패로 표시합니다 (GitHub 알림 메일).

## 자주 하는 수정

- 문구·메뉴: `scripts/build.mjs`
- 영상 설명: `data/videos.json` 의 `description` 에 직접 쓰면 동기화 후에도 유지됩니다.
- 문의 폼: `contact/contact.gs` 맨 위 안내대로 설치하고 `contactEndpoint` 를 채웁니다.
  비어 있는 동안에는 폼이 전송 대신 전화·카카오톡 안내를 보여 줍니다.
- 감정체크 체험판(`static/demo/index.html`)에는 실제 학생 명단과 Apps Script 주소를 **넣지 않습니다**.
