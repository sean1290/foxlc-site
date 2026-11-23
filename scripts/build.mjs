// 사이트 빌드: data/*.json + static/ → dist/ (정적 HTML).
// 외부 패키지 없이 Node 20+ 만으로 돈다.  실행: node scripts/build.mjs
// 모든 링크는 상대 경로라서, 도메인 루트든 하위 폴더(GitHub Pages 프로젝트 주소)든 그대로 동작한다.
import { readFile, writeFile, mkdir, rm, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const json = async (f) => JSON.parse(await readFile(path.join(ROOT, f), "utf8"));
const config = await json("site.config.json");
const news = await json("data/news.json");
const videos = await json("data/videos.json");
const agreementData = await json("data/agreements.json");
const researchers = await json("data/researchers.json");
const instDetails = await json("data/institute-details.json");
const history = await json("data/history.json");
const columns = existsSync(path.join(ROOT, "data/columns.json")) ? await json("data/columns.json") : [];
const mdSrc = await readFile(path.join(ROOT, "static/js/md.js"), "utf8");
const { renderMd, mdPlain } = new Function(mdSrc + "; return { renderMd, mdPlain };")();
const colDate = (d) => (d || "").replace(/-/g, ".");
const colCard = (r, c, tag = "h2") => `<a class="card col-card" href="${r}column/${c.id}/" data-cat="${esc(c.category)}">
      <div class="col-thumb">${c.cover ? `<img src="${esc(c.cover)}" alt="" loading="lazy">` : `<span>SEL</span>`}</div>
      <div class="card-body">
        <div class="col-meta">${c.category ? `<span class="col-cat">${esc(c.category)}</span>` : ""}<span>${colDate(c.published)}</span></div>
        <${tag} class="card-title">${esc(c.title)}</${tag}>
        <p class="card-desc">${esc(mdPlain(c.body, 90))}</p>
      </div>
    </a>`;
const noticePosters = existsSync(path.join(ROOT, "data/notice-posters.json")) ? await json("data/notice-posters.json") : {};
const facilities = await json("data/facilities.json");
const noticeFiles = existsSync(path.join(ROOT, "data/notice-attachments.json")) ? await json("data/notice-attachments.json") : {};
const notices = existsSync(path.join(ROOT, "data/naver.json")) ? await json("data/naver.json") : [];

const CAMP_URL = "https://freddy1590.github.io/fox-global-camp-usa-page/camp-global/index.html";
const INST_URL = "https://fox-institutions-v2.wnsals539.workers.dev/#/";
const NAVER_MAP = "https://map.naver.com/p/search/" + encodeURIComponent("폭스러닝센터 대전");
const ADDRESS = "대전 유성구 엑스포로97번길 40 2층 204호 폭스러닝센터";
const YT_CHANNEL = "https://www.youtube.com/@future_x_foxconnect/videos";
const DESC = "대전 유성구 폭스러닝센터는 전문가와 함께하는 사회정서학습(SEL) 기반 러닝센터입니다. SEL·AI·언어·미술·수리·튼튼 연구소와 SEL 센터, 방학클래스를 운영합니다.";
// ── 검색엔진용 구조화 데이터 (schema.org) ──
const SITE = (config.siteUrl || "").replace(/\/$/, "");
const ORG = {
  "@type": ["EducationalOrganization", "LocalBusiness"],
  "@id": SITE + "/#org",
  name: "폭스러닝센터",
  alternateName: ["FOX LC", "FOX LEARNING CENTER", "폭스 러닝센터"],
  description: "전문가와 함께하는 사회정서학습(SEL) 기반 러닝센터",
  url: SITE + "/",
  logo: SITE + "/img/logo.png",
  image: SITE + "/img/hero.jpg",
  telephone: "1433-2700",
  address: { "@type": "PostalAddress", streetAddress: "엑스포로97번길 40 2층 204호", addressLocality: "유성구", addressRegion: "대전광역시", addressCountry: "KR" },
  openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "10:00", closes: "19:00" }],
  parentOrganization: { "@type": "Organization", name: "FOX CONNECT", url: "https://foxconnect.kr/" },
  sameAs: ["https://www.youtube.com/@future_x_foxconnect", "https://map.naver.com/p/entry/place/1874946138"],
};
const articleLd = (headline, date, img, url) => ({
  "@context": "https://schema.org", "@type": "Article", headline, datePublished: date, dateModified: date,
  image: img ? [SITE + "/" + img] : [SITE + "/img/hero.jpg"], mainEntityOfPage: SITE + "/" + url,
  author: { "@type": "Organization", name: "폭스러닝센터", url: SITE + "/" }, publisher: { "@id": SITE + "/#org" },
});

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ext = 'target="_blank" rel="noopener"';

// ── 공통 틀 ─────────────────────────────────────────────
// file: dist 기준 경로 (예: "about/institutes/index.html"), key: 메뉴에서 현재 위치 표시용
const API_BASE = (process.env.FOXLC_API ?? config.apiBase ?? "").replace(/\/$/, "");
function layout({ file, key, title, description = DESC, body, image, board, noindex, jsonld, ogType }) {
  const depth = file.split("/").length - 1;
  const r = "../".repeat(depth);              // 사이트 루트로 가는 상대 경로
  const cur = (k) => (k === key ? ' aria-current="page"' : "");
  const top = (k) => (key && key.startsWith(k) ? ' aria-current="true"' : "");
  const pageTitle = title ? `${title} | 폭스러닝센터` : "폭스러닝센터 | 대전 유성구 사회정서학습(SEL) 기반 러닝센터";
  const url = config.siteUrl ? config.siteUrl.replace(/\/$/, "") + "/" + file.replace(/index\.html$/, "") : "";
  const ogImage = config.siteUrl ? config.siteUrl.replace(/\/$/, "") + "/" + (image || "img/hero.jpg") : "";
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="${ogType || "website"}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">${config.verify && config.verify.google ? `
<meta name="google-site-verification" content="${esc(config.verify.google)}">` : ""}${config.verify && config.verify.naver ? `
<meta name="naver-site-verification" content="${esc(config.verify.naver)}">` : ""}
<meta property="og:site_name" content="폭스러닝센터">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(description)}">${url ? `
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(ogImage)}">
<link rel="canonical" href="${esc(url)}">` : ""}
<link rel="alternate" type="application/rss+xml" title="폭스러닝센터 소식" href="${r}rss.xml">${jsonld ? `
<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>` : ""}
<link rel="icon" href="${r}img/favicon.png">
<link rel="apple-touch-icon" href="${r}img/mark.png">
${file === "index.html" ? `<link rel="preload" as="image" href="${r}img/hero.jpg" fetchpriority="high">
<link rel="preload" as="font" type="font/woff2" href="${r}fonts/oswald-700.woff2" crossorigin>
` : ""}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&display=swap">
<link rel="stylesheet" href="${r}css/site.css">${board ? `
<meta name="foxlc-api" content="${esc(API_BASE)}">
<meta name="foxlc-root" content="${r || "./"}">` : ""}${noindex ? `
<meta name="robots" content="noindex">` : ""}
<script>document.documentElement.className+=" js";setTimeout(function(){var h=document.querySelector(".hero");if(h){h.classList.add("ready");var p=h.querySelector(".hero-photo");if(p)p.classList.add("loaded")}},3000)</script>
</head>
<body>
<a class="skip" href="#main">본문으로 건너뛰기</a>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="${r || "./"}" aria-label="폭스러닝센터 홈"><img src="${r}img/logo.png" width="115" height="36" alt="FOX LC 폭스러닝센터"></a>
    <button class="menu-btn" type="button" aria-label="메뉴" aria-expanded="false"><span></span></button>
    <nav class="nav" aria-label="주 메뉴">
      <div class="nav-item">
        <a class="nav-top" href="${r}about/"${top("about")}>센터 소개</a>
        <button class="sub-toggle" type="button" aria-label="센터 소개 하위 메뉴" aria-expanded="false"></button>
        <ul class="sub">
          <li><a href="${r}about/"${cur("about/us")}>About Us</a></li>
          <li><a href="${r}about/institutes/"${cur("about/institutes")}>연구소 소개</a></li>
          <li><a href="${r}about/facilities/"${cur("about/facilities")}>센터 시설</a></li>
          <li><a href="${r}about/experts/"${cur("about/experts")}>전문가 소개</a></li>
          <li><a href="${r}about/agreements/"${cur("about/agreements")}>교육 협약</a></li>
          <li><a href="${r}about/directions/"${cur("about/directions")}>오시는 길</a></li>
        </ul>
      </div>
      <div class="nav-item">
        <a class="nav-top" href="${r}news/"${top("news")}>폭스 소식</a>
        <button class="sub-toggle" type="button" aria-label="폭스 소식 하위 메뉴" aria-expanded="false"></button>
        <ul class="sub">
          <li><a href="${r}news/"${cur("news/blog")}>폭스뉴스</a></li>
          <li><a href="${r}videos/"${cur("news/videos")}>폭스 소식</a></li>
          <li><a href="${r}column/"${cur("news/column")}>SEL 칼럼</a></li>
        </ul>
      </div>
      <div class="nav-item">
        <a class="nav-top" href="${r}emotion-check/"${top("emotion")}>감정체크</a>
        <button class="sub-toggle" type="button" aria-label="감정체크 하위 메뉴" aria-expanded="false"></button>
        <ul class="sub">
          <li><a href="${r}emotion-check/"${cur("emotion")}>감정체크 체험</a></li>
          <li><a href="${r}growth/"${cur("emotion/growth")}>성장관리 시스템</a></li>
        </ul>
      </div>
      <div class="nav-item"><a class="nav-top ext" href="${CAMP_URL}" ${ext}>글로벌캠프</a></div>
      <div class="nav-item"><a class="nav-top ext" href="${INST_URL}" ${ext}>기관 체험</a></div>
      <a class="btn navy sm nav-cta" href="${r}#contact">문의하기</a>
    </nav>
  </div>
</header>
<main id="main">
${body(r)}
</main>
<footer class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <h2>FOX LEARNING CENTER</h2>
        <p>사회정서학습 기반 러닝센터</p>
      </div>
      <div>
        <h3>연락처</h3>
        <p><a href="tel:14332700">1433-2700</a><br>카톡 FOX_LC</p>
      </div>
      <div>
        <h3>운영 시간</h3>
        <p>월–토 10:00–19:00<br>일 휴관</p>
      </div>
      <div>
        <h3>위치</h3>
        <p><a href="${r}about/directions/">대전광역시 유성구 엑스포로97번길 40<br>2층 204호 폭스러닝센터</a></p>
      </div>
    </div>
    <nav class="family" aria-label="패밀리 사이트">
      <h3>FAMILY SITE</h3>
      <a href="https://foxconnect.kr/index.do" ${ext}>FOX CONNECT</a>
      <a href="https://www.growxeducation.com/sel" ${ext}>Grow X Education</a>
    </nav>
    <div class="copy"><span>© 2026 폭스러닝센터</span><span class="foot-links"><a class="privacy-link" href="${r}sitemap/">사이트맵</a><a class="privacy-link" href="${r}recruit/">채용공고</a><a class="privacy-link" href="${r}privacy/">개인정보처리방침</a></span></div>
  </div>
</footer>
${file === "index.html" && config.popup && config.popup.enabled ? `
<dialog class="promo" id="promo" tabindex="-1" autofocus data-id="${esc(config.popup.id)}" data-end="${esc(config.popup.endDate || "")}" aria-label="안내">
  <div class="promo-stage">
    ${config.popup.slides.map((sl, i) => `<img class="promo-slide"${i ? " hidden" : ""} src="${r}${esc(sl.image)}" alt="${esc(sl.alt)}"${i ? ' loading="lazy"' : ""}>`).join("")}${config.popup.slides.length > 1 ? `
    <button type="button" class="promo-nav prev" aria-label="이전 장">‹</button><button type="button" class="promo-nav next" aria-label="다음 장">›</button>
    <span class="promo-count">1 / ${config.popup.slides.length}</span>
    <a class="promo-zoom" href="${r}${esc(config.popup.slides[0].image)}" target="_blank" rel="noopener">크게 보기</a>` : ""}
  </div>
  <div class="promo-bar">
    <button type="button" class="promo-skip">24시간 동안 다시 열람하지 않습니다.</button>
    <button type="button" class="promo-close">닫기</button>
  </div>
</dialog>` : ""}
<script src="${r}js/site.js" defer></script>${board ? `
<script src="${r}js/md.js" defer></script>
<script src="${r}js/board.js" defer></script>` : ""}
</body>
</html>
`;
}

const pages = [];
const page = (p) => pages.push(p);

const videoCard = (v, h = "h3") => `<article class="card">
        <div class="player"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.videoId)}?rel=0&amp;playsinline=1" title="${esc(v.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
        <div class="card-body">
          <${h} class="card-title">${esc(v.title)}</${h}>${v.duration ? `
          <div class="card-meta">영상 길이 ${esc(v.duration)}</div>` : ""}${v.description ? `
          <p class="card-desc">${esc(v.description)}</p>` : ""}
        </div>
      </article>`;

// ── 홈 ─────────────────────────────────────────────────
const FILM = [
  ["학생 성장관리 시스템 화면", "연구원은 아이의 기록을 한 화면에서 모아 봅니다"],
  ["성장 리포트 첫 장", "6개월에 한 번 성장 리포트를 보내 드립니다"],
  ["감정체크 시작 화면", "기록은 아이가 직접 답하는 것에서 시작합니다"],
  ["감정체크 1번 문항 · 지금 나의 감정 고르기", "지금 기분을 열두 가지 중에서 고릅니다"],
  ["감정체크 6번 문항 · 힘들 때 나의 약속", "마음이 어려워지면 무엇을 할지 미리 정해 둡니다"],
  ["감정체크 주간 정리 화면", "한 주가 지나면 아이가 남긴 기록을 아이에게 보여 줍니다"],
];
const PARTNERS_PUBLIC = [
  ["chungbuk", "충청북도교육청"], ["gyeongnam", "경상남도교육청"], ["chungnam", "충청남도교육청"], ["sejong", "세종특별자치시교육청"],
  ["incheon", "인천광역시교육청"], ["gangwon", "강원도교육청"], ["jeonbuk", "전라북도교육청"], ["gyeonggi", "경기도교육청"],
  ["keris", "한국교육학술정보원(KERIS)"], ["bnue", "부산교육대학교"],
];
const PARTNERS_ENTERPRISE = [
  ["starlink", "Starlink"], ["growx", "Grow X Education"], ["learning-upgrade", "Learning Upgrade"], ["dx-edu-data", "DX교육데이터협회"],
  ["hancom", "한글과컴퓨터"], ["cj-olivenetworks", "CJ올리브네트웍스"], ["uniwide", "유니와이드"], ["eduwill", "에듀윌"],
  ["acryl", "아크릴"], ["neoleap", "네오리프"], ["cnplus", "씨엔플러스"], ["kg-eduone", "KG에듀원"],
  ["sungsan-cns", "(주)성산씨엔에스"], ["jinsung-lnl", "(주)진성엘엔엘"],
];
const QUOTES = [
  ["폭스러닝센터에서 사회정서학습에 대해 처음으로 접하게 되었고, 얼마나 중요한 교육인지 알게 되었습니다. 체계적인 관리 시스템도 인상적입니다.", "김O지 학부모", "14세 아동 학부모"],
  ["아이가 정서적으로 안정된 상태에서 더 열심히 배우는 모습을 보며 큰 기쁨을 느꼈습니다. 전문적인 교육과 연구원님들의 따뜻한 분위기가 정말 특별합니다.", "이O호 학부모", "11세 아동 학부모"],
  ["대전에 미술과 영어, AI와 사회정서학습까지 다양한 경험을 할 수 있는 배움의 환경이 있어 너무 좋습니다. 아이가 스스로 생각하고 배우는 능력을 키우는 곳, 폭스러닝센터는 정말 최상의 선택입니다.", "박O찬 학부모", "9세 아동 학부모"],
];

page({
  file: "index.html", key: "home", title: "",
  jsonld: { "@context": "https://schema.org", "@graph": [ORG, { "@type": "WebSite", "@id": SITE + "/#website", name: "폭스러닝센터", url: SITE + "/", inLanguage: "ko-KR", publisher: { "@id": SITE + "/#org" } }] },
  body: (r) => `
<section class="hero">
  <div class="hero-photo" style="background-image:url(${r}img/hero.jpg)"></div>
  <div class="wrap">
    <p class="tag" lang="en"><span>LEARN TODAY,</span><span>LEAD TOMORROW.</span></p>
    <h1><span class="l1">전문가와 함께하는</span><span class="l2"><em>사회정서학습</em> 기반</span><span class="l3">폭스러닝센터</span></h1>
    <p>폭스러닝센터는 전문성과 따뜻함으로 아이의 성장을 지원합니다.</p>
    <div class="actions">
      <a class="btn mint" href="${r}about/experts/">전문가 소개</a>
      <a class="btn mint" href="${r}about/institutes/">연구소 소개</a>
      <a class="btn ghost" href="#contact">문의하기</a>
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="about">
      <div>
        <div class="eyebrow left">ABOUT</div>
        <h2>폭스러닝센터는</h2>
        <p>'관찰-발견-반응' 프레임워크를 통해 학생 한 명 한 명의 성장 과정을 체계적으로 지원하는 사회-정서 학습(SEL)기반 교육 기관입니다.</p>
      </div>
      <img src="${r}img/about.jpg" width="1000" height="667" alt="연구원과 아이들이 태블릿을 보며 함께 활동하는 모습" loading="lazy">
    </div>
    <div class="foxx" aria-label="F.O.X — Future Of X">
      <div class="foxx-glow" aria-hidden="true"></div>
      <div class="foxx-tag" aria-hidden="true"><span>F.O.X</span><span class="foxx-line"></span><span>WHAT WE STAND FOR</span></div>
      <p class="foxx-lines" aria-hidden="true">
        <span class="foxx-row"><b>F</b>UTURE</span>
        <span class="foxx-row"><b>O</b>F</span>
        <span class="foxx-row foxx-x"><span class="foxx-word" data-words="Experience|Exploration|Excellence|Expression|Exchange|Expansion|Experiment|Extraordinary|EVERYTHING"><b>X</b></span></span>
      </p>
      <p class="sr-only">Future Of X — Experience, Exploration, Excellence, Expression, Exchange, Expansion, Experiment, Extraordinary, EVERYTHING</p>
    </div>
    <ol class="steps3">
      <li class="step"><div class="circle"><div class="no">STEP 01</div><h3>관찰</h3></div><p>학생의 행동과 감정을 세심하게 살핍니다.</p></li>
      <li class="step"><div class="circle"><div class="no">STEP 02</div><h3>발견</h3></div><p>강점과 필요를 찾아 성장의 단서를 발견합니다.</p></li>
      <li class="step"><div class="circle"><div class="no">STEP 03</div><h3>반응</h3></div><p>맞춤형 지원으로 아이의 성장에 응답합니다.</p></li>
    </ol>
  </div>
</section>

<section class="sec tint partners-sec" aria-labelledby="partners-title">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">PARTNERSHIP</div>
      <h2 id="partners-title">함께하는 기관과 기업</h2>
      <p>전국 교육청과 기업 고객이 선택한 폭스커넥트의 교육 파트너들입니다</p>
    </div>
  </div>
  ${[["교육청 · 공공기관", PARTNERS_PUBLIC, ""], ["주요 기업 파트너", PARTNERS_ENTERPRISE, " reverse"]].map(([label, list, dir]) => `<div class="marquee${dir}" aria-label="${label}">
    <div class="marquee-track">${[0, 1].map((k) => list.map(([file, name]) => `<div class="logo-chip"${k ? ' aria-hidden="true"' : ""}><img src="${r}img/partners/${file}.png" alt="${k ? "" : esc(name)}" loading="lazy"></div>`).join("")).join("")}</div>
  </div>`).join("\n  ")}
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">FOX NEWS</div>
      <h2>폭스 소식</h2>
      <p>폭스러닝센터의 새 프로그램과 행사 소식입니다</p>
    </div>
    <div class="notice-grid home-notices">
      ${notices.slice(0, 3).map((n) => noticeCard(r, n)).join("\n      ")}
    </div>
    <div class="more"><a class="btn ghost" href="${r}videos/#notices">폭스 소식 더 보기 →</a></div>
  </div>
</section>

${columns.length ? `
<section class="sec tint home-cols">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">SEL COLUMN</div>
      <h2>SEL 칼럼</h2>
      <p>SEL센터 전문가가 전하는 사회정서학습과 심리검사·상담 이야기</p>
    </div>
    <div class="col-grid">
      ${columns.slice(0, 3).map((c) => colCard(r, c, "h3")).join("\n      ")}
    </div>
    <div class="more"><a class="btn ghost" href="${r}column/">칼럼 더 보기 →</a></div>
  </div>
</section>
` : ""}

<section class="sec">
  <div class="wrap">
    <div class="sec-head">
      <h2 class="yt-title">폭스 <img src="${r}img/youtube-logo.png" alt="YouTube" width="534" height="120"></h2>
      <p>폭스커넥트 유튜브 채널의 최신 영상입니다</p>
    </div>
    <div class="grid3 home-videos">
      ${videos.slice(0, 3).map((v) => videoCard(v)).join("\n      ")}
    </div>
    <div class="more"><a class="btn ghost" href="${r}videos/#videos">영상 더 보기 →</a></div>
  </div>
</section>


<section class="sec tint">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">GALLERY</div>
      <h2>풍성한 배움의 현장</h2>
    </div>
    <div class="gallery">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" aria-label="활동 사진 ${n} 크게 보기"><img src="${r}img/gallery/${n}.jpg" alt="폭스러닝센터 활동 사진 ${n}" loading="lazy"></button>`).join("\n      ")}
    </div>
  </div>
  <dialog class="lightbox" id="lightbox" aria-label="사진 크게 보기">
    <form method="dialog"><button>닫기 ✕</button></form>
    <img src="data:," alt="">
  </dialog>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">TESTIMONIALS</div>
      <h2>학부모의 진솔한 추천서</h2>
    </div>
    <div class="grid3">
      ${QUOTES.map(([q, who, role]) => `<figure class="quote"><blockquote>${esc(q)}</blockquote><footer><b>${esc(who)}</b>${esc(role)}</footer></figure>`).join("\n      ")}
    </div>
  </div>
</section>

<section class="sec tint" id="contact">
  <div class="wrap">
    <div class="contact">
      <div>
        <div class="eyebrow left">CONTACT</div>
        <h2>문의하기</h2>
        <p class="lead">폭스러닝센터의 철학과 연구실에 대해 궁금한 점이 있으신가요? 저희 팀의 전문가와 상담하여 아동의 발달을 더 나은 방향으로 이끌어 나가는 방법을 함께 찾아보세요.</p>
        <ul class="clist">
          <li><span class="lbl">전화</span><a class="val" href="tel:14332700">1433-2700</a><a class="btn navy sm" href="tel:14332700">전화 걸기</a></li>
          <li><span class="lbl">카카오톡</span><span class="val">FOX_LC</span>${config.kakaoChannelUrl
            ? `<a class="btn kakao sm" href="${esc(config.kakaoChannelUrl)}" ${ext}>채팅하기</a>`
            : `<button class="btn kakao sm" type="button" data-copy="FOX_LC" data-toast="kakaoToast" data-msg="카카오톡 아이디 FOX_LC를 복사했습니다">아이디 복사</button>`}</li>
        </ul>
        <div class="toast" id="kakaoToast" aria-live="polite"></div>
      </div>
      <form class="form" id="contactForm" data-endpoint="${esc(config.contactEndpoint)}">
        <div class="field"><label for="f-name">이름 <i>*</i></label><input id="f-name" name="name" required autocomplete="name"></div>
        <div class="field"><label for="f-phone">연락처 <i>*</i></label><input id="f-phone" name="phone" type="tel" required autocomplete="tel" placeholder="010-0000-0000"></div>
        <div class="field"><label for="f-msg">문의 내용 <i>*</i></label><textarea id="f-msg" name="message" required></textarea></div>
        <div class="hp" aria-hidden="true"><label>비워 두세요<input name="website" tabindex="-1" autocomplete="off"></label></div>
        <div class="consent">
          <label><input type="checkbox" name="agree" required> <span><b>개인정보 수집·이용에 동의합니다. (필수)</b></span></label>
          <p>수집 항목: 이름, 연락처, 문의 내용 · 목적: 문의 답변 및 상담 안내 · 보유 기간: 문의 처리 후 1년. 동의하지 않으실 수 있으며, 이 경우 온라인 문의 대신 전화(1433-2700)나 카카오톡(FOX_LC)으로 문의하실 수 있습니다. <a href="${r}privacy/">개인정보처리방침 보기</a></p>
        </div>
        <button class="btn navy" type="submit">문의 보내기</button>
        <div class="form-msg" id="formMsg" role="status" aria-live="polite"></div>
      </form>
    </div>
  </div>
</section>`,
});

// ── 연구소 소개 ─────────────────────────────────────────
const INSTITUTES = [
  { id: "sel", label: "FOX SEL", tagline: "마음과 관계를 배우는", name: "SEL 연구소",
    desc: "CASEL의 사회정서학습 5가지 핵심 역량을 기반으로, 나를 이해하고 다른 사람과 건강한 관계를 맺는 힘을 기르는 연구소",
    items: ["감정 이해와 표현", "사회적 관계와 의사소통", "자신감과 자기조절", "다양한 프로젝트 활동"] },
  { id: "ai", label: "FOX AI", tagline: "미래를 경험하는", name: "AI 연구소",
    desc: "AI를 올바르게 이해하고 활용하는 경험을 통해 질문하는 힘과 창의적 사고, 디지털 윤리의식을 함께 키우는 연구소",
    items: ["컴퓨터 과학 기반 AI 융합 교육", "생성형 AI 활용 창작 중심 활동", "프로젝트 기반(PBL) 문제 해결 활동", "다양한 디지털 도구를 활용한 프로젝트 제작 경험", "협력, 소통, 발표를 통한 역량 강화"] },
  { id: "english", label: "FOX ENGLISH", tagline: "세상과 연결되는", name: "언어 연구소",
    desc: "세상과 거침없이 소통하는 표현의 자유를 선물하는 연구소",
    items: ["노출: 영어의 즐거움을 발견", "학습: 정확한 Input과 탄탄한 기초", "피드백 & 성장 리포트", "심화: 자유로운 표현의 완성"] },
  { id: "art", label: "FOX ART", tagline: "예술을 경험하고 표현하는", name: "미술 연구소",
    desc: "다양한 재료와 표현 기법을 탐색하며 자신의 생각과 감정을 자유롭게 표현하고, 작품을 완성하는 과정에서 창의력과 자신감을 함께 키우는 연구소",
    items: ["다양한 재료와 미술 기법을 활용한 창작 활동", "생각과 감정을 표현하는 창작 활동", "갤러리 마주안 작가 초대전 연계 특별프로그램", "디지털 드로잉·3D펜 등 융합 미술 활동"] },
  { id: "math", label: "FOX MATH", tagline: "생각의 힘을 키우는", name: "수리 연구소",
    desc: "PLAYFACTO부터 교과수학, AI 수학까지 성장 과정에 따라 연결하여 수학적 사고력과 역량을 함께 키우는 연구소",
    items: ["흥미를 발견하고 생각하는 힘을 키우는 놀이 수학", "개념을 이해하고 문제해결력을 완성하는 교과수학", "알고리즘과 코딩으로 사고를 확장하는 논리적 사고 수학"] },
  { id: "health", label: "FOX HEALTH", tagline: "바른 성장을 돕는", name: "튼튼 연구소",
    desc: "스스로 건강한 생활 습관을 익히고, 올바른 성장을 통해 몸과 마음이 조화롭게 자라나도록 이끄는 연구소",
    items: ["매일 바르게 움직이는 건강한 습관 형성", "집에서도 실천하는 홈 운동 프로그램", "오감을 깨우는 즐거운 신체 활동"] },
  { id: "id", label: "FOX ID", tagline: "검사, 상담 및 마음성장 프로그램", name: "SEL 센터", hl: true,
    desc: "아이의 특성과 발달을 더 깊이 이해할 수 있도록 아이 상담 및 마음 성장 프로그램, 검사와 부모 상담을 진행하고 있습니다.",
    items: ["종합심리검사 - 웩슬러, TCI/JTCI, 정서행동검사", "개별 상담 - 아동 청소년 심리상담", "부모 상담 - 부모 양육 상담", "SEL 프로그램 - 그림책, 놀이, 미술 등을 활용한 사회정서 역량 활동"],
    note: "폭스러닝센터 SEL 연구소의 전문 연구원들과 함께 검사 해석 활동을 함께 설계합니다." },
];

page({
  file: "about/institutes/index.html", key: "about/institutes", title: "연구소 소개",
  description: "SEL·AI·언어·미술·수리·튼튼 여섯 연구소와 SEL 센터를 소개합니다.",
  body: (r) => `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">INSTITUTES</div>
  <h1>연구소 소개</h1>
  <p>여섯 연구소와 SEL 센터가 아이의 배움과 성장을 함께 살핍니다</p>
</div></div>
<div class="page-body"><div class="wrap">
  <div class="inst-grid">
    ${INSTITUTES.map((x) => `<article class="inst${x.hl ? " hl" : ""}">
      <button class="inst-photo" type="button" data-inst="${x.id}" aria-label="${esc(x.name)} 자세히 보기"><img src="${r}img/institutes/${x.id}.jpg" alt="${esc(x.name)} 활동 공간" loading="lazy"></button>
      <div class="inst-body">
        <div class="tagline">${esc(x.tagline)}</div>
        <h2>${esc(x.name)}</h2>
        <button class="btn ${x.hl ? "mint" : "navy"} inst-more" type="button" data-inst="${x.id}" aria-haspopup="dialog">자세히 보기 <span aria-hidden="true">→</span></button>
      </div>
    </article>`).join("\n    ")}
  </div>
</div></div>
${INSTITUTES.map((x) => {
  const d = instDetails[x.id] || {};
  const photos = [{ src: `${r}img/institutes/${x.id}.jpg`, caption: `${x.name} 활동 공간` },
    ...(d.photos || []).map((ph) => ({ src: `${r}img/institutes/${x.id}/${ph.file}`, caption: ph.caption || "" }))];
  return `<dialog class="inst-modal" id="inst-${x.id}" aria-labelledby="inst-${x.id}-title">
  <div class="im-head">
    <div>
      <span class="label">${x.label}</span>
      <div class="tagline">${esc(x.tagline)}</div>
      <h2 id="inst-${x.id}-title">${esc(x.name)}</h2>
    </div>
    <form method="dialog"><button class="im-close" aria-label="닫기">✕</button></form>
  </div>
  <div class="im-body">
    <div class="im-gallery">
      <figure class="im-main"><img src="${photos[0].src}" alt="${esc(photos[0].caption || `${x.name} 활동 사진 1`)}" loading="lazy">${photos.length > 1 ? `
        <button type="button" class="im-nav prev" aria-label="이전 사진">‹</button><button type="button" class="im-nav next" aria-label="다음 사진">›</button>
        <span class="im-count">1 / ${photos.length}</span>` : ""}
        <figcaption>${esc(photos[0].caption)}</figcaption></figure>${photos.length > 1 ? `
      <div class="im-thumbs" role="list">${photos.map((ph, i) => `<button type="button" role="listitem" class="im-thumb"${i ? "" : ' aria-current="true"'} data-src="${ph.src}" data-alt="${esc(ph.caption || `${x.name} 활동 사진 ${i + 1}`)}" data-caption="${esc(ph.caption)}" aria-label="사진 ${i + 1} 보기"><img src="${ph.src}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
    </div>
    <div class="im-text">
      <p class="im-desc">${esc(x.desc)}</p>
      ${(d.text || []).map((t) => `<p>${esc(t)}</p>`).join("")}
      <h3>프로그램</h3>
      <ul>${x.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>${x.note ? `
      <p class="note">${esc(x.note)}</p>` : ""}
      <div class="im-actions"><a class="btn navy sm" href="tel:14332700">전화 문의 1433-2700</a><a class="btn line sm" href="${r}#contact">문의 남기기</a></div>
    </div>
  </div>
</dialog>`;
}).join("\n")}`,
});

// ── About Us ───────────────────────────────────────────
// 숫자는 사이트 데이터에서 센다 (연구소 소개 · 연구원 소개 · 교육 협약)
page({
  file: "about/index.html", key: "about/us", title: "About Us",
  description: "어린이는 자신의 정서와 행동을 인식하고 조절하며 적절한 사회적 관계를 맺을 능력으로서의 사회정서역량을 갖추어야 합니다.",
  // 본문은 원장님이 주신 네 문단을 그대로 쓴다 (줄바꿈 포함, 굵게 표시만 더함). 문구를 바꾸지 말 것.
  body: (r) => `
<section class="au-hero au-hero-big">
  <div class="au-hero-bg" role="img" aria-label="폭스러닝센터 내부 안내 데스크와 라운지" style="background-image:url(${r}img/about-hero.jpg)"></div>
  <div class="wrap">
    <div class="au-hero-text">
      <h1 class="au-title" lang="en">About Us</h1>
      <p class="au-lead">어린이는 <b>자신의 정서와 행동을 인식하고 조절하며</b><br class="br-lg">
      <b>적절한 사회적 관계를 맺을 능력</b>으로서의<br class="br-lg">
      <em>사회정서역량</em>을 갖추어야 합니다.</p>
    </div>
  </div>
</section>

<section class="sec tint au-work">
  <div class="wrap">
    <div class="au-cards">
      <article class="au-card">
        <figure class="au-card-photo"><img src="${r}img/institutes/sel/16.jpg" alt="연구원과 아이들이 함께 활동하는 SEL 연구소" loading="lazy"></figure>
        <div class="au-icon"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.6-4.6M8 10.5h5M10.5 8v5"/></svg></div>
        <p>폭스러닝센터는 이런 역량을 <b>어떻게 진단하고</b><br class="br-lg">
        <b>신장시킬 것인가</b>를 끊임없이 연구하며<br class="br-lg">
        <b>어린이에 대한 깊은 이해</b>를 기반으로<br class="br-lg">
        적절한 교육을 개발하고 있습니다.</p>
      </article>
      <article class="au-card">
        <figure class="au-card-photo"><img src="${r}img/institutes/id.jpg" alt="SEL 센터 상담실" loading="lazy"></figure>
        <div class="au-icon"><svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3.2"/><circle cx="16.5" cy="8" r="3.2"/><path d="M2.5 19.5c.6-3.4 2.8-5.5 5.5-5.5s4.9 2.1 5.5 5.5M11 19.5c.6-3.4 2.8-5.5 5.5-5.5s4.9 2.1 5.5 5.5"/></svg></div>
        <p>그러기 위해 폭스러닝센터는 <b>상담 전문가와</b><br class="br-lg">
        <b>교육 전문가가 협업</b>하여 어린이를 이해하고,<br class="br-lg">
        폭 넓고 심층적인 이해에 이르는 <b>중요한 디딤돌</b>이<br class="br-lg">
        되겠습니다.</p>
      </article>
    </div>
  </div>
</section>

<section class="sec tl-sec" id="history" aria-labelledby="tl-title">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">2022 — 2026</div>
      <h2 id="tl-title">${esc(history.title)}</h2>
      <p>${history.intro.map(esc).join("<br>")}</p>
    </div>
    <nav class="tl-years" aria-label="연도 바로가기">${history.years.map((y) => `<a href="#y${y.year}">${y.year}</a>`).join("")}</nav>
    <div class="tl">
      ${history.years.map((y) => `<section class="tl-year" id="y${y.year}">
        <div class="tl-side">
          <h3>${y.year}</h3>${y.photo ? `
          <figure><img src="${r}img/history/${y.photo.file}" alt="${esc(y.photo.caption)}" loading="lazy"><figcaption>${esc(y.photo.caption)}</figcaption></figure>` : ""}
        </div>
        <ol class="tl-list">
          ${y.items.map(([when, title, desc]) => `<li><span class="tl-when">${esc(when)}</span><div><b>${esc(title)}</b><p>${esc(desc)}</p></div></li>`).join("\n          ")}
        </ol>
      </section>`).join("\n      ")}
    </div>
    <p class="tl-note">${history.note.map(esc).join("<br>")}</p>
  </div>
</section>

<section class="sec au-invite">
  <div class="wrap">
    <div class="au-invite-box">
      <p>미래 사회를 이끌어갈 어린이의 성장을 위해<br class="br-lg">
      함께 고민하고, 배움의 경험을 넓혀갈<br class="br-lg">
      <b>협력 교육기관을 초대합니다.</b></p>
      <div class="au-actions">
        <a class="btn mint" href="${INST_URL}" ${ext}>기관 체험</a>
        <a class="btn white" href="${r}#contact">문의하기</a>
      </div>
    </div>
  </div>
</section>`,
});

// ── 연구원 소개 ─────────────────────────────────────────
// 명단: data/researchers.json — photo 가 비어 있으면 실루엣을 보여 준다.
const SILHOUETTE = `<svg class="silhouette" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="46" r="22"/><path d="M18 120c2-26 20-42 42-42s40 16 42 42z"/></svg>`;
page({
  file: "about/researchers/index.html", key: "about/experts", title: "연구원 소개", noindex: true,
  body: (r) => `<script>location.replace("${r}about/experts/#researchers")</script>
<div class="page-body"><div class="wrap"><p class="rc-empty">연구원 소개는 <a href="${r}about/experts/#researchers">전문가 소개</a> 페이지로 옮겼습니다.</p></div></div>`,
});

// ── 전문가 소개 (자문 · 공동 연구 교수진) ─────────────────
const EXPERTS = [
  // [사진, 이름, 소속(슬라이드), 소개서 11쪽 1줄, 소개서 11쪽 2줄]
  ["paik", "Jae H. Paik", "미국 샌프란시스코 주립대학교", "샌프란시스코 주립대", "심리학 교수·SEL 연구"],
  ["rodriguez", "Rita Rodriguez", "미국 샌프란시스코 주립대학교", "Grow X 프로그램 개발", "학교심리·SEL 교육"],
  ["himelfarb", "Igor Himelfarb", "미국 링컨대학교", "Grow X 교육측정 총괄", "교육통계·데이터 분석"],
  ["duh", "Shinchieh (CJ) Duh", "미국 산호세 주립대학교", "산호세 주립대 심리학", "프로그램 운영·평가"],
];
page({
  file: "about/experts/index.html", key: "about/experts", title: "전문가 소개",
  description: "FOX 글로벌캠프 SEL 프로그램 연구에 함께한 미국 대학 교수진을 소개합니다.",
  body: (r) => `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">EXPERTS</div>
  <h1>전문가 소개</h1>
</div></div>
<section class="ex-sec" aria-labelledby="global-team-title"><div class="wrap">
  <div class="sec-intro"><h2 class="sub-head" id="global-team-title">글로벌 연구진</h2><p>미국 연구진과의 글로벌 협력을 통해 SEL 연구를 확장하고, 교육 현장에 적용할 프로그램을 개발합니다.</p></div>
  <ul class="experts" role="list">
    ${EXPERTS.map(([id, name, school, l1, l2]) => `<li class="ex-card expert">
      <img src="${r}img/experts/${id}.jpg" alt="${esc(name)}" loading="lazy">
      <div class="ex-body">
        <span class="expert-school">${esc(school)}</span>
        <h3 lang="en">${esc(name)}</h3>
        <p>${esc(l1)}<br>${esc(l2)}</p>
      </div>
    </li>`).join("\n    ")}
  </ul>
</div></section>

<section class="ex-sec tint" aria-labelledby="research-title"><div class="wrap">
  <div class="sec-intro"><h2 class="sub-head" id="research-title">연구 성과 소개</h2></div>
  <ul class="research-list">
    <li class="ex-card"><span class="research-date">2024. 9.</span><p>FOX 글로벌 캠프의 글로벌 커뮤니티 기반 접근 방식에 대한 SEL 연구가 국제 학술지 <b>ELSEVIER</b>에 출판됨</p></li>
    <li class="ex-card"><span class="research-date">2025. 3.</span><p>미국 사회정서학습 연구·실행기관 <b>‘CASEL’</b> 공식 홈페이지에 폭스에듀 SEL 프로그램이 소개됨</p></li>
  </ul>
  <blockquote class="ex-card citation" lang="en">Paik, J.H., Duh, S., Rodriguez, R., Sung, W.K., Ha, J.Y., Wilken, L., Lee, J.T. (2024). A Global Community-Based Approach to Supporting Social and Emotional Learning. <i>Social and Emotional Learning: Research, Practice, and Policy</i>, 4, 100063-8.
    <a href="https://doi.org/10.1016/j.sel.2024.100063" ${ext}>https://doi.org/10.1016/j.sel.2024.100063</a></blockquote>
</div></section>

<section class="ex-sec" id="researchers" aria-labelledby="researchers-title"><div class="wrap">
  <div class="sec-intro"><h2 class="sub-head" id="researchers-title">연구원 소개</h2><p>융합교육 전문성을 바탕으로 교육과정을 설계하고, 학생의 성장 데이터를 체계적으로 기록·분석합니다.</p></div>
  <div class="org">
    ${[...new Set(researchers.groups.map((g) => g.row || 0))].map((row, ri) => `<div class="org-row${ri === 0 ? " lead" : ""}">
      ${researchers.groups.filter((g) => (g.row || 0) === row).map((g) => `<section class="ex-card org-team" style="--n:${g.people.length}" aria-label="${esc(g.title)}">
        <h3 class="org-title">${esc(g.title)}</h3>
        <ul class="org-people" role="list">
          ${g.people.map((m) => `<li>
            <div class="avatar">${m.photo
              ? `<img src="${r}img/researchers/${esc(m.photo)}" alt="${esc(m.name)} ${esc(m.role)}" loading="lazy">`
              : SILHOUETTE}</div>
            <b>${esc(m.name)}</b>
            <span>${esc(m.role)}</span>
          </li>`).join("")}
        </ul>
      </section>`).join("\n      ")}
    </div>`).join("\n    ")}
  </div>
</div></section>

<section class="ex-sec tint" aria-labelledby="global-title"><div class="wrap">
  <div class="sec-intro"><h2 class="sub-head" id="global-title">해외 연구·교류</h2><p>해외 학교·대학과 연구와 학생 교류를 이어가고 있습니다.</p></div>
  <div class="global-grid">
    <article class="ex-card"><img src="${r}img/global/stoneranch-camp.jpg" alt="스톤랜치 초등학교 학생들과 함께한 글로벌캠프 활동" loading="lazy"><div class="ex-body"><h3>스톤랜치 초등학교 · 글로벌캠프</h3><p>학생들이 만나 함께 활동하는 교류</p></div></article>
    <article class="ex-card"><img class="doc" src="${r}img/global/mou.jpg" alt="SFSU, 스톤랜치 초등학교와 맺은 협약서" loading="lazy"><div class="ex-body"><h3>SFSU · 스톤랜치 초등학교 협약</h3><p>왼쪽: SFSU | 오른쪽: 스톤랜치 초등학교</p></div></article>
    <article class="ex-card"><img src="${r}img/global/meducation.jpg" alt="mEducation Alliance Symposium 2025 현장 사진" loading="lazy"><div class="ex-body"><h3 lang="en">mEducation Alliance Symposium</h3><p>SEL을 연구 수준에서 실제 현장 적용까지 연결하는 글로벌 혁신 모델로서의 Grow X SEL 플랫폼 홍보</p></div></article>
    <article class="ex-card"><img src="${r}img/global/edtech-week.jpg" alt="EdTech Week 2025 현장 사진" loading="lazy"><div class="ex-body"><h3 lang="en">EdTech Week</h3><p>Grow X SEL 플랫폼 및 레슨키트홍보글로벌 네트워킹을 통해 시장 인사이트 확보와 해외 확산 전략 기반 마련</p></div></article>
  </div>
</div></section>`,
});

// ── 교육 협약 ───────────────────────────────────────────
// 내용: data/agreements.json (기관 프로그램 사이트의 교육 협약 페이지에서 옮김)
const dateLabel = (d) => {
  const m = (d || "").match(/^(\d{4})(?:\.(\d{2})(?:\.(\d{2}))?)?$/);
  if (!m) return d;
  const [, y, mo, da] = m;
  return mo ? `${y}년 ${Number(mo)}월${da ? ` ${Number(da)}일` : ""}` : `${y}년`;
};
const isoDate = (d) => d.replace(/\./g, "-");
function agreementDoc(r, label, pages, caption) {
  const first = pages[0];
  const action = pages.length === 1 ? "협약서 전체 보기" : `협약서 전체 ${pages.length}쪽 보기`;
  const img = (pg, alt, lazy = true) =>
    `<img src="${r}img/agreements/${pg.file}" width="${pg.width}" height="${pg.height}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ""} decoding="async">`;
  return `<figure class="ag-doc">
          <a class="ag-doc-link" href="${r}img/agreements/${first.file}" data-ag-doc="${esc(label)}" aria-label="${esc(label)} ${action}">
            ${img(first, `${label} 협약서 사본${pages.length > 1 ? " 1쪽" : ""}`)}
            <span>${action}</span>
          </a>${caption ? `
          <figcaption>${esc(caption)}</figcaption>` : ""}
          <template>${pages.map((pg, i) => {
            const pl = pages.length > 1 ? `${i + 1} / ${pages.length}쪽` : (caption || "협약서 전체");
            return `<figure><figcaption><span>${esc(pl)}</span><a href="${r}img/agreements/${pg.file}" target="_blank" rel="noopener">이미지 새 탭에서 열기</a></figcaption>${img(pg, `${label} 협약서 · ${pl}`, false)}</figure>`;
          }).join("")}</template>
        </figure>`;
}

page({
  file: "about/agreements/index.html", key: "about/agreements", title: "교육 협약",
  description: "폭스커넥트가 학교·대학, 교육 기업과 맺은 교육 협약을 협약서 사본과 함께 소개합니다.",
  body: (r) => {
    const pt = agreementData.partnership;
    return `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">AGREEMENTS</div>
  <h1>교육 협약</h1>
  <p>폭스커넥트와 학교·대학의 협약</p>
</div></div>
<div class="page-body"><div class="wrap">
  <section class="ag-partner" aria-labelledby="ag-partner-title">
    <div class="ag-partner-head">
      <h2 id="ag-partner-title">${esc(pt.parties)}</h2>
      <p class="ag-date"><time datetime="${isoDate(pt.date)}">${dateLabel(pt.date)}</time> · 협약서 날짜</p>
    </div>
    ${agreementDoc(r, pt.parties, pt.pages, pt.caption)}
    <div class="ag-partner-body">
      <p class="ag-topic">${esc(pt.topic)}</p>
      <p>${esc(pt.description)}</p>
    </div>
    <figure class="ag-signing">
      <img src="${r}img/agreements/${pt.photo.file}" width="${pt.photo.width}" height="${pt.photo.height}" alt="${esc(pt.photo.alt)}" loading="lazy">
      <figcaption>${esc(pt.photo.caption)}</figcaption>
    </figure>
  </section>
  <ul class="ag-list" role="list">
    ${agreementData.agreements.map((a) => `<li class="ag-card">
      <h2>${esc(a.institution)}</h2>
      <p class="ag-date"><time datetime="${isoDate(a.date)}">${dateLabel(a.date)}</time> 체결${a.ended ? ' <span class="ag-status">협약 종료</span>' : ""}</p>
      ${agreementDoc(r, a.institution, a.pages, a.caption)}
      <p class="ag-topic">${esc(a.topic)}</p>
      <p>${esc(a.description)}</p>
    </li>`).join("\n    ")}
  </ul>
</div></div>
<dialog class="ag-viewer" aria-labelledby="ag-viewer-title">
  <div class="ag-viewer-head">
    <h2 id="ag-viewer-title">협약서 사본</h2>
    <form method="dialog"><button class="btn line sm">닫기 ✕</button></form>
  </div>
  <div class="ag-viewer-pages"></div>
</dialog>`;
  },
});

// ── 센터 시설 ───────────────────────────────────────────
page({
  file: "about/facilities/index.html", key: "about/facilities", title: "센터 시설",
  description: "대전 유성구 골프존 조이마루 2층 폭스러닝센터의 로비와 라이브러리 CAFE, 교실, AWS 트랙장, SEL센터 검사·상담실, 타볼라타 이탈리안 레스토랑을 사진으로 소개합니다.",
  image: "img/facilities/hero.jpg",
  body: (r) => {
    let n = 0;
    const tile = (g) => g.items.map(([id, cls, cap]) => `<button type="button" class="fac-tile ${cls}" data-i="${n++}" data-full="${r}img/facilities/${id}-l.jpg" aria-label="${esc(cap)} 크게 보기">
          <img src="${r}img/facilities/${id}-m.jpg" alt="폭스러닝센터 ${esc(cap)}" loading="lazy">
          <span class="fac-cap">${esc(cap)}</span>
        </button>`).join("\n        ");
    return `
<section class="fac-hero">
  <img src="${r}img/facilities/hero.jpg" alt="폭스러닝센터 라운지 전경" fetchpriority="high">
  <div class="fac-hero-in wrap">
    <div class="eyebrow">FACILITIES</div>
    <h1>아이들의 하루가<br>머무는 공간</h1>
    <p>배우고, 쉬고, 함께 성장하는 폭스러닝센터의 공간을 소개합니다.</p>
  </div>
</section>
<nav class="fac-jump wrap" aria-label="공간 바로가기">
  ${facilities.map((g) => `<a href="#fac-${g.no}">${esc(g.title)}</a>`).join("")}
</nav>
<div class="page-body fac-body"><div class="wrap">
  ${facilities.map((g) => `<section class="fac-group" id="fac-${g.no}" aria-labelledby="fac-${g.no}-t">
    <header class="fac-head">
      <span class="fac-no">${g.no}</span>
      <div><div class="fac-en">${esc(g.en)}</div><h2 id="fac-${g.no}-t">${esc(g.title)}</h2></div>
      <p>${esc(g.desc)}</p>
    </header>
    <div class="fac-grid">
        ${tile(g)}
    </div>
  </section>`).join("\n  ")}
  <div class="fac-cta">
    <p>직접 와서 보시면 더 좋습니다. 방문 상담은 미리 연락 주세요.</p>
    <div><a class="btn navy" href="${r}about/directions/">오시는 길</a><a class="btn line" href="${r}#contact">방문 상담 문의</a></div>
  </div>
</div></div>
<dialog class="fac-lb" id="facLb" aria-label="시설 사진 크게 보기">
  <figure><img src="data:," alt=""><figcaption></figcaption></figure>
  <button type="button" class="promo-nav prev" aria-label="이전 사진">‹</button>
  <button type="button" class="promo-nav next" aria-label="다음 사진">›</button>
  <button type="button" class="fac-lb-x" aria-label="닫기">닫기 ✕</button>
</dialog>`;
  },
});

// ── 오시는 길 ───────────────────────────────────────────
page({
  file: "about/directions/index.html", key: "about/directions", title: "오시는 길",
  jsonld: { "@context": "https://schema.org", ...ORG },
  description: `${ADDRESS} · 성심당 DCC점 맞은편, 골프존 조이마루 건물 2층 · 전화 1433-2700`,
  body: () => `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">LOCATION</div>
  <h1>오시는 길</h1>
</div></div>
<div class="page-body"><div class="wrap">
  <div class="dir">
    <div class="map">
      <iframe title="폭스러닝센터 위치 지도" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
        src="https://maps.google.com/maps?q=${encodeURIComponent("대전 유성구 엑스포로97번길 40")}&amp;z=17&amp;hl=ko&amp;output=embed"></iframe>
    </div>
    <div class="info">
      <div class="item">
        <div class="ico"><svg viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg></div>
        <div>
          <div class="lbl">주소</div>
          <div class="val">${ADDRESS}<small>성심당 DCC점 맞은편, 골프존 조이마루 건물 2층</small></div>
          <div class="actions">
            <a class="btn naver sm" href="${NAVER_MAP}" ${ext}>N 네이버 지도에서 보기</a>
            <button class="btn line sm" type="button" data-copy="${ADDRESS}" data-msg="주소를 복사했습니다">주소 복사</button>
          </div>
          <div class="toast" id="toast" aria-live="polite"></div>
        </div>
      </div>
      <div class="item">
        <div class="ico"><svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></div>
        <div>
          <div class="lbl">전화</div>
          <div class="val"><a href="tel:14332700">1433-2700</a><small>월–토 10:00–19:00 · 일 휴관</small></div>
          <div class="actions"><a class="btn navy sm" href="tel:14332700">전화 걸기</a></div>
        </div>
      </div>
      <div class="item">
        <div class="ico"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.6 9.6 0 0 1-3.6-.7L3 21l1.6-4.3A7.9 7.9 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg></div>
        <div>
          <div class="lbl">카카오톡</div>
          <div class="val">FOX_LC<small>카카오톡에서 ‘FOX_LC’를 검색해 주세요</small></div>
          <div class="actions">${config.kakaoChannelUrl ? `<a class="btn kakao sm" href="${esc(config.kakaoChannelUrl)}" ${ext}>카카오톡 채팅하기</a>` : ""}
            <button class="btn ${config.kakaoChannelUrl ? "line" : "kakao"} sm" type="button" data-copy="FOX_LC" data-msg="카카오톡 아이디 FOX_LC를 복사했습니다">아이디 복사</button></div>
        </div>
      </div>
    </div>
  </div>
</div></div>`,
});

// ── 폭스뉴스 (목록 + 글) ─────────────────────────────────
const excerpt = (p) => { const t = [p.before, ...p.after].join(" "); return t.length > 110 ? t.slice(0, 110) + "…" : t; };

page({
  file: "news/index.html", key: "news/blog", title: "폭스뉴스",
  description: "폭스러닝센터 연구소들의 활동 소식을 전합니다.",
  body: (r) => `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">FOX NEWS</div>
  <h1>폭스뉴스</h1>
  <p>폭스러닝센터 연구소들의 활동 소식을 전합니다</p>
</div></div>
<div class="page-body"><div class="wrap">
  <div class="grid3" id="newsGrid">
    ${news.map((p, i) => `<a class="card post-card" href="${r}news/${p.num}/"${i >= 9 ? " hidden" : ""}>
      <div class="thumb">${p.photos ? `<img src="${r}news-img/${p.num}/0.jpg" alt="" loading="lazy">` : ""}</div>
      <div class="card-body">
        <div class="date">${esc(p.date)}</div>
        <h2 class="card-title">${esc(p.title)}</h2>
        <p class="card-desc">${esc(excerpt(p))}</p>
      </div>
    </a>`).join("\n    ")}
  </div>
  <nav class="pager" id="newsPager" aria-label="페이지"></nav>
  <p class="subtle">원문: <a href="https://news.foxconnect.kr" ${ext}>폭스뉴스 news.foxconnect.kr</a></p>
</div></div>`,
});

news.forEach((p, i) => {
  const newer = news[i - 1], older = news[i + 1];
  page({
    file: `news/${p.num}/index.html`, key: "news/blog", title: p.title,
    ogType: "article", jsonld: articleLd(p.title, p.date.replace(/\./g, "-"), p.photos ? `news-img/${p.num}/0.jpg` : "", `news/${p.num}/`),
    description: excerpt(p), image: p.photos ? `news-img/${p.num}/0.jpg` : undefined,
    body: (r) => `
<div class="page-body" style="padding-top:56px"><div class="wrap">
  <article class="post">
    <h1>${esc(p.title)}</h1>
    <div class="byline">
      <img src="${r}img/mark.png" alt="" width="36" height="36">
      <div><b>Fox Learning Center</b><time datetime="${p.date.replace(/\./g, "-")}">${esc(p.date)}</time></div>
    </div>
    ${p.before ? `<p>${esc(p.before)}</p>` : ""}
    ${Array.from({ length: p.photos }, (_, n) => `<figure><img src="${r}news-img/${p.num}/${n}.jpg" alt="${esc(p.title)} 사진 ${n + 1}"${n ? ' loading="lazy"' : ""}></figure>`).join("\n    ")}
    ${p.after.map((t) => `<p${p.photos ? ' style="margin-top:28px"' : ""}>${esc(t)}</p>`).join("\n    ")}
    <p class="src">원문: <a href="https://news.foxconnect.kr" ${ext}>폭스뉴스 news.foxconnect.kr</a></p>
    <div class="post-nav">
      ${older ? `<a class="btn line sm" href="${r}news/${older.num}/">← 이전 글</a>` : "<span></span>"}
      <a class="btn ghost sm" href="${r}news/">목록으로</a>
      ${newer ? `<a class="btn line sm" href="${r}news/${newer.num}/">다음 글 →</a>` : "<span></span>"}
    </div>
  </article>
</div></div>`,
  });
});

// ── 폭스 소식 (센터 소식 + 영상) ──────────────────────────
// 센터 소식: 네이버 스마트플레이스 '소식' (scripts/sync-naver.mjs → data/naver.json)
const NAVER_FEED = "https://map.naver.com/p/entry/place/1874946138?placePath=%2Ffeed";
const ymd = (d) => `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
const noticeCard = (r, n, hidden = false) => `<a class="card notice-card" href="${r}notice/${n.feedId}/"${hidden ? " hidden" : ""}>
        <div class="poster">${n.photos ? `<img src="${r}naver-img/${n.feedId}/0.jpg" alt="${esc(n.title)} 포스터" loading="lazy">` : ""}</div>
        <div class="card-body">
          <div class="date">${ymd(n.date)}</div>
          <h3 class="card-title">${esc(n.title)}</h3>
        </div>
      </a>`;
const noticeExcerpt = (t) => { const one = t.replace(/\s+/g, " ").trim(); return one.length > 70 ? one.slice(0, 70) + "…" : one; };

page({
  file: "videos/index.html", key: "news/videos", title: "폭스 소식",
  description: "폭스러닝센터의 프로그램·행사 소식과 활동 영상을 만나 보세요.",
  body: (r) => `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">FOX NEWS</div>
  <h1>폭스 소식</h1>
  <p>폭스러닝센터의 프로그램·행사 소식과 활동 영상을 만나 보세요</p>
  <nav class="jump" aria-label="폭스 소식 구역">${notices.length ? `<a href="#notices">센터 소식</a>` : ""}<a href="#videos">영상</a></nav>
</div></div>
<div class="page-body"><div class="wrap">${notices.length ? `
  <section id="notices" aria-labelledby="notices-title">
    <h2 class="sub-head" id="notices-title">센터 소식</h2>
    <div class="notice-grid" id="noticeGrid">
      ${notices.map((n, i) => noticeCard(r, n, i >= 8)).join("\n      ")}
    </div>
    <nav class="pager" id="noticePager" aria-label="센터 소식 페이지"></nav>
    <p class="subtle"><a href="${NAVER_FEED}" ${ext}>네이버 플레이스 소식 바로가기</a></p>
  </section>` : ""}
  <section id="videos" aria-labelledby="videos-title"${notices.length ? ' class="videos-sec"' : ""}>
    <h2 class="sub-head" id="videos-title">영상</h2>
    <div class="grid3" id="videoGrid">
      <noscript>${videos.slice(0, 9).map((v) => videoCard(v, "h3")).join("")}</noscript>
    </div>
    <nav class="pager" id="videoPager" aria-label="영상 페이지"></nav>
    <p class="subtle"><a href="${YT_CHANNEL}" ${ext}>유튜브 채널 바로가기</a></p>
    <script type="application/json" id="videoData">${JSON.stringify(videos).replace(/</g, "\\u003c")}</script>
  </section>
</div></div>`,
});

notices.forEach((n, i) => {
  const newer = notices[i - 1], older = notices[i + 1];
  page({
    file: `notice/${n.feedId}/index.html`, key: "news/videos", title: n.title,
    ogType: "article", jsonld: articleLd(n.title, `${n.date.slice(0, 4)}-${n.date.slice(4, 6)}-${n.date.slice(6, 8)}`, n.photos ? `naver-img/${n.feedId}/0.jpg` : "", `notice/${n.feedId}/`),
    description: noticeExcerpt(n.text), image: n.photos ? `naver-img/${n.feedId}/0.jpg` : undefined,
    body: (r) => `
<div class="page-body" style="padding-top:56px"><div class="wrap">
  <article class="notice">
    ${(() => {
      const ps = [
        ...Array.from({ length: n.photos }, (_, k) => ({ src: `${r}naver-img/${n.feedId}/${k}.jpg`, alt: `${n.title} 포스터` })),
        ...(noticePosters[n.feedId] || []).map((p) => ({ src: `${r}img/notice/${encodeURIComponent(p.file)}`, alt: p.alt || `${n.title} 포스터` })),
      ];
      const imgs = ps.map((p, k) => `<a class="np-slide" href="${p.src}" ${ext}${k ? " hidden" : ""}><img src="${p.src}" alt="${esc(p.alt)}${ps.length > 1 ? ` (${k + 1}/${ps.length})` : ""}"${k ? ' loading="lazy"' : ""}></a>`).join("\n        ");
      return ps.length > 1 ? `<div class="notice-posters np-slider" role="region" aria-roledescription="포스터 넘겨보기" aria-label="포스터 ${ps.length}장">
      <div class="np-stage">
        ${imgs}
        <button class="promo-nav prev" type="button" aria-label="이전 포스터">‹</button>
        <button class="promo-nav next" type="button" aria-label="다음 포스터">›</button>
        <span class="promo-count" aria-live="polite">1 / ${ps.length}</span>
      </div>
    </div>` : `<div class="notice-posters">
      ${imgs}
    </div>`;
    })()}
    <div class="notice-body">
      <p class="date">${ymd(n.date)}${n.period ? ` · 기간 ${esc(n.period)}` : ""}</p>
      <h1>${esc(n.title)}</h1>
      <div class="notice-text">${esc(n.text).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" ${ext}>${u}</a>`)}</div>${(noticeFiles[n.feedId] || []).length ? `
      <div class="notice-files">
        <h2>첨부파일</h2>
        ${noticeFiles[n.feedId].map((f) => `<a class="file-link" href="${r}files/${encodeURIComponent(f.file)}" ${ext}><span class="file-ico" aria-hidden="true">PDF</span><span>${esc(f.name)}</span><span class="file-dl">열기 · 저장</span></a>`).join("")}
      </div>` : ""}
      <div class="notice-actions">
        <a class="btn navy sm" href="tel:14332700">전화 문의 1433-2700</a>
        <button class="btn kakao sm" type="button" data-copy="FOX_LC" data-msg="카카오톡 아이디 FOX_LC를 복사했습니다">카카오톡 FOX_LC</button>
      </div>
      <div class="toast" id="toast" aria-live="polite"></div>
      <p class="src">원문: <a href="${NAVER_FEED}" ${ext}>네이버 플레이스 소식</a></p>
    </div>
  </article>
  <div class="post-nav">
    ${older ? `<a class="btn line sm" href="${r}notice/${older.feedId}/">← 이전 소식</a>` : "<span></span>"}
    <a class="btn ghost sm" href="${r}videos/#notices">목록으로</a>
    ${newer ? `<a class="btn line sm" href="${r}notice/${newer.feedId}/">다음 소식 →</a>` : "<span></span>"}
  </div>
</div></div>`,
  });
});

// ── 성장관리 시스템 (감정체크 하위) ───────────────────────
page({
  file: "growth/index.html", key: "emotion/growth", title: "학생 성장관리 시스템",
  description: "각 연구소에서 관찰한 아이들의 활동과 반응, 변화의 모습을 학생별로 통합하고 체계적으로 기록하는 폭스러닝센터의 관리 체계입니다.",
  body: (r) => `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">GROWTH MANAGEMENT</div>
  <h1>학생 성장관리 시스템</h1>
</div></div>
<div class="page-body growth-page"><div class="wrap">
  <div class="gp-screen">
        <div class="mac-scene">
      <div class="laptop">
        <div class="lid">
          <div class="mac-screen">
            ${FILM.map(([alt], i) => `<div class="frame"><img src="${r}img/film/${i + 1}.jpg" alt="${esc(alt)}" loading="lazy"></div>`).join("\n                ")}
          </div>
        </div>
        <div class="base" aria-hidden="true"></div>
      </div>
      <div class="filmui" aria-hidden="true">
        <div class="fcap">${FILM.map(([, cap]) => `<span>${esc(cap)}</span>`).join("")}</div>
        <div class="fbar">${FILM.map(() => "<span></span>").join("")}</div>
      </div>
    </div>
    <p class="filmnote">실제 화면입니다. 학생 이름·학교는 예시로 바꾸고, 서술 문단은 가상의 문장으로 대체했습니다.</p>
  </div>
  <div class="gp-text">
    <p>폭스러닝센터는 다섯 연구소의 교육 활동을 통해 교육 전문가와 심리 전문가가 아이들의 배움과 성장을 다각도로 살펴봅니다.</p>
    <p>학생 성장관리 시스템은 각 연구소에서 관찰한 아이들의 활동과 반응, 변화의 모습을 학생별로 통합하고 체계적으로 기록하는 관리 체계입니다. 개별 활동에서 포착한 다양한 관찰 기록을 하나로 연결함으로써, 단편적인 모습만으로는 파악하기 어려운 아이의 성장 과정과 변화의 흐름을 종합적으로 이해할 수 있습니다.</p>
    <p>폭스러닝센터는 이러한 관찰 데이터와 성장의 흐름을 바탕으로 아이에게 필요한 교육적 지원과 다음 단계의 지도 방향을 구체화하며, 성장 리포트를 통해 그 과정과 결과를 학부모님께 공유합니다.</p>
  </div>
  <section class="gp-steps" aria-labelledby="steps-title">
    <div class="sec-head">
      <div class="eyebrow">PROCESS</div>
      <h2 id="steps-title">SEL 면담을 통해 학생을 이해하고,<br>활동을 살피며 다음 교육 방향을 정합니다.</h2>
    </div>
    <ol class="steps5">
      ${[["초기 상담<br>필요한 검사", "학생의 특성과<br>상황을 살펴봅니다."], ["학생 이해", "상담과 검사에서<br>알게 된 내용을 봅니다."], ["프로그램 제안", "학생에게 필요한<br>경험을 제안합니다."], ["활동·관찰·발견", "활동에서 보이는<br>모습을 기록합니다."], ["다음 단계 제안", "이해한 내용을 더해<br>다음 배움을 찾습니다."]].map(([t, d], i) => `<li><span class="no">0${i + 1}</span><b>${t}</b><p>${d}</p></li>`).join("")}
    </ol>
    <p class="steps5-note">SEL센터와 폭스러닝센터가 상담 내용과 활동 기록을 함께 봅니다.</p>
  </section>
</div></div>`,
});

// ── SEL 칼럼 (목록 · 글 · 쓰기) ─────────────────────────
// 글은 Cloudflare API(worker/)에 저장되고, 매일 빌드 때 data/columns.json 으로 받아 정식 페이지를 만든다.
// 아직 빌드되지 않은 새 글은 column/view/?id= 화면(board.js)에서 바로 보인다.
page({
  file: "column/index.html", key: "news/column", title: "SEL 칼럼", board: true,
  description: "폭스러닝센터 SEL센터 전문가가 전하는 사회정서학습과 심리검사·상담 이야기.",
  body: (r) => `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">SEL COLUMN</div>
  <h1>SEL 칼럼</h1>
  <p>SEL센터 전문가가 전하는 사회정서학습과 심리검사·상담 이야기</p>
</div></div>
<div class="page-body"><div class="wrap">
  <div class="rc-bar" id="colAdminBar" hidden>
    <a class="btn navy sm" href="${r}column/write/">글쓰기</a>
    <a class="btn line sm" href="${r}admin/">관리자</a>
  </div>
  <div class="col-filter" id="colFilter"></div>
  <div class="col-grid" id="colList" data-built="${esc(JSON.stringify(columns.map((c) => c.id)))}">
    ${columns.length ? columns.map((c) => colCard(r, c)).join("\n    ") : `<p class="rc-empty">첫 칼럼을 준비하고 있습니다.</p>`}
  </div>
  <p class="rc-foot"><a href="${r}column/write/">관리자 글쓰기</a></p>
</div></div>`,
});
columns.forEach((c, i) => {
  const newer = columns[i - 1], older = columns[i + 1];
  page({
    file: `column/${c.id}/index.html`, key: "news/column", title: c.title, board: true,
    description: mdPlain(c.body, 140), image: undefined,
    ogType: "article", jsonld: { ...articleLd(c.title, c.published, "", `column/${c.id}/`), image: [c.cover || SITE + "/img/hero.jpg"], author: { "@type": "Person", name: c.author || "폭스러닝센터" } },
    body: (r) => `
<div class="page-body" style="padding-top:56px"><div class="wrap">
  <article class="post col-post" data-col-id="${c.id}">
    ${c.category ? `<span class="col-cat">${esc(c.category)}</span>` : ""}
    <h1>${esc(c.title)}</h1>
    <div class="byline">
      <img src="${r}img/mark.png" alt="" width="36" height="36">
      <div><b>${esc(c.author || "폭스러닝센터")}</b><time datetime="${esc(c.published)}">${colDate(c.published)}</time></div>
    </div>
    <div class="col-body">${renderMd(c.body)}</div>
    <div class="col-admin" hidden></div>
    <div class="post-nav">
      ${older ? `<a class="btn line sm" href="${r}column/${older.id}/">← 이전 글</a>` : "<span></span>"}
      <a class="btn ghost sm" href="${r}column/">목록으로</a>
      ${newer ? `<a class="btn line sm" href="${r}column/${newer.id}/">다음 글 →</a>` : "<span></span>"}
    </div>
  </article>
</div></div>`,
  });
});
page({
  file: "column/view/index.html", key: "news/column", title: "SEL 칼럼", board: true, noindex: true,
  body: () => `<div class="page-body" style="padding-top:56px"><div class="wrap">
  <article class="post col-post" id="colView"><p class="rc-empty">불러오는 중입니다…</p></article>
</div></div>`,
});
page({
  file: "column/write/index.html", key: "news/column", title: "SEL 칼럼 쓰기", board: true, noindex: true,
  body: () => `<div class="page-head"><div class="wrap"><div class="eyebrow">SEL COLUMN</div><h1>SEL 칼럼 쓰기</h1></div></div>
<div class="page-body"><div class="wrap">
  <div id="colWrite"><p class="rc-empty">확인 중입니다…</p></div>
  <template id="colForm">
    <form class="rc-form col-form">
      <label class="full"><span>제목 <i>*</i></span><input name="title" maxlength="150" required></label>
      <label><span>분류</span><input name="category" maxlength="40" list="colCats" placeholder="예: 사회정서학습"></label>
      <label><span>상태</span><select name="status"><option value="published">공개</option><option value="draft">임시 저장 (관리자만 보기)</option></select></label>
      <datalist id="colCats"><option>사회정서학습</option><option>지능검사</option><option>심리검사</option><option>상담</option><option>부모교육</option><option>SEL 프로그램</option></datalist>
      <div class="full col-editor">
        <div class="col-tools" role="toolbar" aria-label="서식">
          <button type="button" data-md="h2">소제목</button>
          <button type="button" data-md="bold"><b>굵게</b></button>
          <button type="button" data-md="list">목록</button>
          <button type="button" data-md="quote">인용</button>
          <button type="button" data-md="link">링크</button>
          <label class="col-photo">사진 넣기<input type="file" accept="image/*" multiple hidden></label>
          <span class="col-size" role="group" aria-label="사진 크기">사진 크기 <button type="button" data-md="size40">작게</button><button type="button" data-md="size65">중간</button><button type="button" data-md="size100">꽉 차게</button></span>
          <span class="col-up" aria-live="polite"></span>
        </div>
        <div class="col-panes">
          <textarea name="body" required rows="22" placeholder="본문을 쓰세요. 빈 줄로 문단을 나눕니다.&#10;&#10;## 소제목&#10;**굵게** 쓰려면 별표 두 개로 감쌉니다.&#10;- 목록은 줄 앞에 - 를 붙입니다."></textarea>
          <div class="col-preview col-body" aria-label="미리보기"></div>
        </div>
        <p class="col-hint">카페 글을 옮길 때는 본문을 그대로 붙여 넣고, 사진은 '사진 넣기'로 다시 올려 주세요. 오른쪽은 실제로 보일 모습입니다.</p>
      </div>
      <div class="full rc-form-actions"><button class="btn navy" type="submit">저장</button><a class="btn line" href="../">취소</a></div>
      <div class="full rc-msg" role="status"></div>
    </form>
  </template>
</div></div>`,
});

// ── 감정체크 체험 ───────────────────────────────────────
page({
  file: "emotion-check/index.html", key: "emotion", title: "감정체크 체험",
  description: "아이들이 센터에서 실제로 쓰는 감정체크 화면을 직접 체험해 보세요. 입력한 내용은 저장되지 않습니다.",
  body: (r) => `
<div class="page-body" style="padding-top:56px"><div class="wrap">
  <div class="ec-intro">
    <div class="head">
      <div class="eyebrow left">EMOTION CHECK</div>
      <h1>감정체크,<br>직접 체험해 보세요</h1>
    </div>
    <section>
      <p class="lede">아이는 센터에 들어올 때와 나갈 때 화면에서 직접 답합니다. 지금 기분과 마음의 에너지, 걱정되는 일이 있는지, 오늘 무엇에 집중할지, 마음이 어려워지면 무엇을 할지를 스스로 고릅니다. 답을 고르는 동안 아이가 자기 상태를 한 번 돌아보게 됩니다.</p>
      <p class="lede">연구원은 활동이 끝날 때마다 정해진 항목으로 기록합니다. 집중도, 또래와의 상호작용, 어려운 상황이 있었는지와 아이가 어떻게 대처했는지, 안내를 받아들이는 모습, 그날 돋보인 강점. 항목을 정해 두어야 유난히 좋았던 하루나 힘들었던 하루에 흔들리지 않고 되풀이되는 모습을 찾을 수 있습니다.</p>
      <div class="try"><b>체험판 안내</b> · 실제 아이들이 쓰는 화면과 같지만 질문 수를 줄였어요 (입실 5문항, 퇴실 4문항). 입력한 내용은 <b>어디에도 저장되지 않습니다.</b> 아래 화면에서 ‘입실 체크’ 또는 ‘퇴실 체크’를 눌러 시작해 보세요. 소리가 함께 나와요.</div>
    </section>
    <ol class="ec-steps">
      <li><div class="num">1</div><div><b>지금 기분 고르기</b><span>열두 가지 감정 중에서 지금 마음에 가장 가까운 것을 고릅니다.</span></div></li>
      <li><div class="num">2</div><div><b>오늘의 목표 정하기</b><span>입실할 때 오늘 집중할 목표와 그 목표를 위해 해볼 행동을 스스로 정합니다.</span></div></li>
      <li><div class="num">3</div><div><b>힘들 때 나의 약속</b><span>마음이 어려워지면 무엇을 할지 미리 골라 ‘다짐할게요!’ 도장을 찍습니다.</span></div></li>
      <li><div class="num">4</div><div><b>하루 돌아보기</b><span>퇴실할 때 기억에 남는 활동, 스스로 자랑스러운 점, 내일 실천할 한 가지를 고릅니다.</span></div></li>
    </ol>
  </div>
  <div class="device">
    <div class="screen" id="screen" style="background-image:url(${r}demo/images/landing-bg.webp)">
      <div class="loading" id="loading">감정체크를 불러오는 중이에요…</div>
      <iframe id="app" title="감정체크 체험판" allow="autoplay" src="${r}demo/"></iframe>
    </div>
  </div>
  <p class="note">체험판 · 입력한 내용은 저장되지 않아요</p>
</div></div>`,
});

// ── 채용공고 (목록 · 보기 · 쓰기) · 관리자 ─────────────────
// 글은 Cloudflare Worker(worker/)의 D1 데이터베이스에 있고, 화면은 static/js/board.js 가 그린다.
const recruitHead = (title, sub) => `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">RECRUIT</div>
  <h1>${title}</h1>${sub ? `
  <p>${sub}</p>` : ""}
</div></div>`;
page({
  file: "recruit/index.html", key: "recruit", title: "채용공고", board: true,
  description: "폭스러닝센터와 함께 아이들의 성장을 도울 선생님을 찾습니다.",
  body: (r) => `${recruitHead("채용공고", "폭스러닝센터와 함께 아이들의 성장을 도울 선생님을 찾습니다")}
<div class="page-body"><div class="wrap">
  <div class="rc-bar" id="rcAdminBar" hidden>
    <a class="btn navy sm" href="${r}recruit/write/">글쓰기</a>
    <a class="btn line sm" href="${r}admin/">관리자</a>
  </div>
  <div id="rcList"><p class="rc-empty">채용공고를 불러오는 중입니다…</p></div>
  <nav class="pager" id="rcPager" aria-label="페이지"></nav>
  <p class="rc-foot"><a href="${r}recruit/write/">관리자 글쓰기</a></p>
  <noscript><p class="rc-empty">채용공고를 보려면 브라우저의 JavaScript 를 켜 주세요.</p></noscript>
</div></div>`,
});
page({
  file: "recruit/view/index.html", key: "recruit", title: "채용공고", board: true,
  body: () => `<div class="page-body" style="padding-top:56px"><div class="wrap">
  <article class="rc-post" id="rcView"><p class="rc-empty">불러오는 중입니다…</p></article>
</div></div>`,
});
page({
  file: "recruit/write/index.html", key: "recruit", title: "채용공고 쓰기", board: true, noindex: true,
  body: () => `${recruitHead("채용공고 쓰기")}
<div class="page-body"><div class="wrap">
  <div class="rc-write" id="rcWrite"><p class="rc-empty">확인 중입니다…</p></div>
  <template id="rcForm">
    <form class="rc-form">
      <label class="full"><span>제목 <i>*</i></span><input name="title" maxlength="120" required placeholder="예: SEL 연구소 연구원 채용"></label>
      <label>구분 (모집 분야)<input name="category" maxlength="60" placeholder="예: SEL 연구소"></label>
      <label>근무 형태<select name="employment"><option value="">선택 안 함</option><option>정규직</option><option>계약직</option><option>파트타임</option><option>프리랜서</option><option>인턴</option></select></label>
      <label>마감일<input name="deadline" type="date"></label>
      <label class="check"><input name="always" type="checkbox"> 상시 채용 (마감일 없음)</label>
      <label>상태<select name="status"><option value="open">모집중</option><option value="closed">마감</option></select></label>
      <label class="full"><span>내용 <i>*</i></span><textarea name="body" maxlength="20000" required rows="16" placeholder="담당 업무, 자격 요건, 우대 사항, 근무 조건, 지원 방법 등을 적어 주세요."></textarea></label>
      <div class="full rc-form-actions"><button class="btn navy" type="submit">저장</button><a class="btn line" href="../">취소</a></div>
      <div class="full rc-msg" role="status"></div>
    </form>
  </template>
</div></div>`,
});
page({
  file: "admin/index.html", key: "admin", title: "관리자", board: true, noindex: true,
  body: () => `<div class="page-head"><div class="wrap"><div class="eyebrow">ADMIN</div><h1>관리자</h1></div></div>
<div class="page-body"><div class="wrap">
  <div class="rc-admin" id="rcAdmin"><p class="rc-empty">확인 중입니다…</p></div>
  <template id="rcAdminTpl">
    <p class="rc-who">로그인: <b id="rcWho"></b> <button class="btn line sm" id="rcLogout" type="button">로그아웃</button></p>
    <p class="rc-first" id="rcFirst" hidden>처음 로그인하셨습니다. 아래에서 <b>비밀번호를 먼저 바꿔 주세요.</b></p>
    <div class="rc-panels">
      <form class="rc-panel" id="rcPw">
        <h2>비밀번호 변경</h2>
        <label>현재 비밀번호<input name="current" type="password" autocomplete="current-password" required></label>
        <label>새 비밀번호 (8자 이상)<input name="next" type="password" autocomplete="new-password" minlength="8" required></label>
        <label>새 비밀번호 확인<input name="next2" type="password" autocomplete="new-password" minlength="8" required></label>
        <button class="btn navy sm" type="submit">변경</button>
        <div class="rc-msg" role="status"></div>
      </form>
      <form class="rc-panel" id="rcAdd">
        <h2>관리자 추가</h2>
        <label>아이디 (영문 소문자·숫자)<input name="username" pattern="[a-z0-9._-]{3,40}" required></label>
        <label>이름<input name="name" maxlength="40"></label>
        <label>임시 비밀번호 (8자 이상)<input name="password" type="text" minlength="8" required></label>
        <button class="btn navy sm" type="submit">추가</button>
        <div class="rc-msg" role="status"></div>
        <h3>계정 목록</h3>
        <ul id="rcUsers" class="rc-users"></ul>
      </form>
    </div>
  </template>
</div></div>`,
});

// ── 개인정보처리방침 ────────────────────────────────────
// 시행일·보호책임자·보유 기간을 바꾸면 여기서 고친다.
const PRIVACY_EFFECTIVE = "2026년 11월 19일";
// ── 사이트맵 (사람이 보는 전체 메뉴) ─────────────────
page({
  file: "sitemap/index.html", key: "sitemap", title: "사이트맵",
  description: "폭스러닝센터 홈페이지의 전체 메뉴를 한눈에 볼 수 있습니다.",
  body: (r) => {
    const L = (href, text, out) => `<li><a href="${out ? href : r + href}"${out ? ` ${ext} class="ext"` : ""}>${text}</a></li>`;
    const groups = [
      ["센터 소개", [L("about/", "About Us"), L("about/institutes/", "연구소 소개"), L("about/facilities/", "센터 시설"), L("about/experts/", "전문가 소개"), L("about/agreements/", "교육 협약"), L("about/directions/", "오시는 길")]],
      ["폭스 소식", [L("news/", "폭스뉴스"), L("videos/", "폭스 소식"), L("column/", "SEL 칼럼"), L("videos/#videos", "폭스 YouTube")]],
      ["감정체크", [L("emotion-check/", "감정체크 체험"), L("growth/", "성장관리 시스템")]],
      ["프로그램", [L(CAMP_URL, "글로벌캠프", true), L(INST_URL, "기관 체험", true)]],
      ["문의 · 안내", [L("#contact", "문의하기"), L("recruit/", "채용공고"), L("privacy/", "개인정보처리방침")]],
    ];
    return `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">SITEMAP</div>
  <h1>사이트맵</h1>
  <p>폭스러닝센터 홈페이지의 전체 메뉴입니다</p>
</div></div>
<div class="page-body"><div class="wrap">
  <div class="sm-grid">
    <section class="sm-group sm-home"><h2><a href="${r}">홈</a></h2></section>
    ${groups.map(([t, items]) => `<section class="sm-group"><h2>${t}</h2><ul>${items.join("")}</ul></section>`).join("\n    ")}
  </div>
</div></div>`;
  },
});

page({
  file: "privacy/index.html", key: "privacy", title: "개인정보처리방침",
  description: "폭스러닝센터 홈페이지의 개인정보처리방침입니다.",
  body: () => {
    const sec = (n, title, html) => `<section class="pv-sec" id="pv-${n}"><h2>제${n}조 (${title})</h2>${html}</section>`;
    const sections = [
      ["처리 목적", `<p>폭스러닝센터(이하 '센터')는 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 다음 목적 이외의 용도로 이용하지 않으며, 목적이 바뀌는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 하겠습니다.</p>
        <ul><li><b>홈페이지 문의 처리:</b> 문의 내용 확인, 답변 및 상담 안내를 위한 연락</li></ul>`],
      ["처리하는 개인정보 항목", `<table class="pv-table"><thead><tr><th>구분</th><th>항목</th><th>수집 방법</th></tr></thead>
        <tbody><tr><td>홈페이지 문의</td><td>이름, 연락처(전화번호), 문의 내용</td><td>홈페이지 '문의하기' 양식에 이용자가 직접 입력</td></tr></tbody></table>
        <p>센터 홈페이지는 회원가입 기능이 없으며, 위 항목 외의 개인정보를 수집하지 않습니다. '감정체크 체험' 화면에 입력한 내용은 어디에도 전송·저장되지 않습니다.</p>`],
      ["처리 및 보유 기간", `<p>센터는 이용자의 동의를 받은 기간 동안 개인정보를 처리·보유합니다.</p>
        <ul><li><b>홈페이지 문의:</b> 문의 처리 완료 후 <b>1년</b>까지 보관 후 파기합니다. 다만 이용자가 삭제를 요청하면 지체 없이 파기합니다.</li></ul>`],
      ["제3자 제공", `<p>센터는 이용자의 개인정보를 제1조의 목적 범위 안에서만 처리하며, 이용자의 동의나 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우를 제외하고는 제3자에게 제공하지 않습니다.</p>`],
      ["처리 위탁 및 국외 이전", `<p>센터는 홈페이지 문의 내용을 안전하게 보관하기 위하여 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
        <table class="pv-table"><thead><tr><th>수탁자</th><th>위탁 업무</th><th>이전 국가</th></tr></thead>
        <tbody><tr><td>Google LLC</td><td>문의 내용 저장(Google 스프레드시트) 및 알림 메일 발송</td><td>미국 등 Google 데이터센터 소재 국가 (문의 접수 시 네트워크를 통해 전송)</td></tr></tbody></table>
        <p>이전되는 항목은 이름, 연락처, 문의 내용이며, 보유 기간은 제3조와 같습니다. 국외 이전을 원하지 않으시면 온라인 문의 대신 전화(1433-2700)나 카카오톡(FOX_LC)으로 문의하실 수 있습니다.</p>`],
      ["파기 절차 및 방법", `<p>센터는 보유 기간이 지나거나 처리 목적이 달성된 개인정보를 지체 없이 파기합니다. 전자적 파일 형태의 정보는 복구할 수 없는 방법으로 삭제하고, 종이에 출력된 정보는 분쇄하거나 소각합니다.</p>`],
      ["정보주체의 권리와 행사 방법", `<p>이용자는 언제든지 센터에 대해 개인정보 열람, 정정, 삭제, 처리 정지를 요구할 수 있습니다. 권리 행사는 전화(1433-2700) 또는 카카오톡(FOX_LC)으로 하실 수 있으며, 센터는 지체 없이 조치하겠습니다. 법정대리인이나 위임을 받은 사람을 통해서도 하실 수 있습니다.</p>`],
      ["만 14세 미만 아동의 개인정보", `<p>센터 홈페이지의 문의 양식은 보호자(학부모) 또는 기관 담당자를 대상으로 합니다. 만 14세 미만 아동이 문의하려는 경우에는 보호자가 대신 문의해 주시기 바랍니다.</p>`],
      ["안전성 확보 조치", `<p>센터는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 하고 있습니다.</p>
        <ul><li>문의 내용에 접근할 수 있는 담당자를 최소한으로 지정</li><li>접근 권한이 있는 계정의 비밀번호 관리</li><li>홈페이지와 문의 전송 구간의 암호화 통신(HTTPS) 적용</li></ul>`],
      ["쿠키 등 자동 수집 장치", `<p>센터 홈페이지는 이용자를 식별하는 쿠키를 직접 설치·운영하지 않습니다. 다만 홈페이지에 포함된 외부 서비스(YouTube 영상, Google 지도, Google 글꼴)는 해당 서비스 제공자의 정책에 따라 쿠키 등을 사용할 수 있습니다. 이용자는 웹 브라우저 설정에서 쿠키 저장을 거부할 수 있습니다.</p>`],
      ["개인정보 보호책임자", `<p>센터는 개인정보 처리에 관한 업무를 총괄하고, 관련 불만 처리와 피해 구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
        <table class="pv-table"><tbody><tr><th>담당</th><td>폭스러닝센터 운영실</td></tr><tr><th>연락처</th><td>1433-2700 · 카카오톡 FOX_LC</td></tr><tr><th>주소</th><td>${ADDRESS}</td></tr></tbody></table>`],
      ["권익 침해 구제 방법", `<p>개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다.</p>
        <ul><li>개인정보침해신고센터: (국번 없이) 118 · privacy.kisa.or.kr</li><li>개인정보분쟁조정위원회: 1833-6972 · www.kopico.go.kr</li><li>대검찰청: (국번 없이) 1301 · www.spo.go.kr</li><li>경찰청: (국번 없이) 182 · ecrm.police.go.kr</li></ul>`],
      ["처리방침의 변경", `<p>이 개인정보처리방침은 ${PRIVACY_EFFECTIVE}부터 적용됩니다. 내용이 추가·삭제·수정되는 경우 시행 7일 전부터 홈페이지를 통해 알리겠습니다.</p>`],
    ];
    return `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">PRIVACY POLICY</div>
  <h1>개인정보처리방침</h1>
  <p>시행일: ${PRIVACY_EFFECTIVE}</p>
</div></div>
<div class="page-body"><div class="wrap">
  <div class="pv">
    <p class="pv-intro">폭스러닝센터는 「개인정보 보호법」 제30조에 따라 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.</p>
    <nav class="pv-toc" aria-label="목차"><ol>${sections.map(([t], i) => `<li><a href="#pv-${i + 1}">${t}</a></li>`).join("")}</ol></nav>
    ${sections.map(([t, h], i) => sec(i + 1, t, h)).join("\n    ")}
  </div>
</div></div>`;
  },
});

// ── 404 ─────────────────────────────────────────────────
// 404 페이지는 어느 깊이에서든 뜰 수 있어서 siteUrl 이 있으면 절대 경로를 쓴다.
page({
  file: "404.html", key: "", title: "페이지를 찾을 수 없습니다",
  body: (r) => `
<div class="page-body" style="padding-top:72px"><div class="wrap">
  <div class="soon">
    <h2>페이지를 찾을 수 없습니다</h2>
    <p>주소가 바뀌었거나 없는 페이지입니다.</p>
    <a class="btn navy" href="${r || "./"}">홈으로 가기</a>
  </div>
</div></div>`,
});

// ── 쓰기 ────────────────────────────────────────────────
await rm(DIST, { recursive: true, force: true });
await cp(path.join(ROOT, "static"), DIST, { recursive: true });
for (const p of pages) {
  const out = path.join(DIST, p.file);
  await mkdir(path.dirname(out), { recursive: true });
  let html = layout(p);
  if (p.file === "404.html" && config.siteUrl) {
    // 깊은 주소에서도 404 페이지의 CSS·링크가 깨지지 않게 절대 주소로 바꾼다.
    const base = config.siteUrl.replace(/\/$/, "") + "/";
    html = html.replace("<head>", `<head>\n<base href="${esc(base)}">`);
  }
  await writeFile(out, html);
}
if (config.siteUrl) {
  const base = config.siteUrl.replace(/\/$/, "") + "/";
  const listed = pages.filter((p) => p.file !== "404.html" && !p.noindex);
  const lastmod = (p) => (p.jsonld && p.jsonld.datePublished) || "";
  await writeFile(path.join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${listed.map((p) => `<url><loc>${esc(base + p.file.replace(/index\.html$/, ""))}</loc>${lastmod(p) ? `<lastmod>${lastmod(p)}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
  // RSS: 네이버 서치어드바이저에 제출하는 최신 글 목록 (센터 소식 + 폭스뉴스, 최신 40개)
  const items = listed.filter((p) => p.ogType === "article").map((p) => ({ title: p.title, link: base + p.file.replace(/index\.html$/, ""), date: p.jsonld.datePublished, desc: p.description }))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);
  const rfc = (d) => new Date(d + "T09:00:00+09:00").toUTCString();
  await writeFile(path.join(DIST, "rss.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>폭스러닝센터 소식</title><link>${esc(base)}</link><description>${esc(DESC)}</description><language>ko</language>
${items.map((it) => `<item><title>${esc(it.title)}</title><link>${esc(it.link)}</link><guid>${esc(it.link)}</guid><pubDate>${rfc(it.date)}</pubDate><description>${esc(it.desc)}</description></item>`).join("\n")}
</channel></rss>
`);
  await writeFile(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
}
await writeFile(path.join(DIST, ".nojekyll"), "");
console.log(`빌드 완료: ${pages.length}쪽 (폭스뉴스 ${news.length}개, 영상 ${videos.length}개) → dist/`);
