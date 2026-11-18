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
const notices = existsSync(path.join(ROOT, "data/naver.json")) ? await json("data/naver.json") : [];

const CAMP_URL = "https://freddy1590.github.io/fox-global-camp-usa-page/camp-global/index.html";
const INST_URL = "https://fox-institutions-v2.wnsals539.workers.dev/#/";
const NAVER_MAP = "https://map.naver.com/p/search/" + encodeURIComponent("폭스러닝센터 대전");
const ADDRESS = "대전 유성구 엑스포로97번길 40 2층 204호 폭스러닝센터";
const YT_CHANNEL = "https://www.youtube.com/@future_x_foxconnect/videos";
const DESC = "상담 전문가와 교육 전문가가 함께하는 사회정서학습(SEL) 기반 교육 기관, 대전 폭스러닝센터입니다.";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ext = 'target="_blank" rel="noopener"';

// ── 공통 틀 ─────────────────────────────────────────────
// file: dist 기준 경로 (예: "about/institutes/index.html"), key: 메뉴에서 현재 위치 표시용
function layout({ file, key, title, description = DESC, body, image }) {
  const depth = file.split("/").length - 1;
  const r = "../".repeat(depth);              // 사이트 루트로 가는 상대 경로
  const cur = (k) => (k === key ? ' aria-current="page"' : "");
  const top = (k) => (key && key.startsWith(k) ? ' aria-current="true"' : "");
  const pageTitle = title ? `${title} | 폭스러닝센터` : "폭스러닝센터 | 사회정서학습(SEL) 기반 교육 기관";
  const url = config.siteUrl ? config.siteUrl.replace(/\/$/, "") + "/" + file.replace(/index\.html$/, "") : "";
  const ogImage = config.siteUrl ? config.siteUrl.replace(/\/$/, "") + "/" + (image || "img/hero.jpg") : "";
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="폭스러닝센터">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(description)}">${url ? `
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(ogImage)}">
<link rel="canonical" href="${esc(url)}">` : ""}
<link rel="icon" href="${r}img/favicon.png">
<link rel="apple-touch-icon" href="${r}img/mark.png">
${file === "index.html" ? `<link rel="preload" as="image" href="${r}img/hero.jpg" fetchpriority="high">
<link rel="preload" as="font" type="font/woff2" href="${r}fonts/oswald-700.woff2" crossorigin>
` : ""}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&display=swap">
<link rel="stylesheet" href="${r}css/site.css">
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
        <a class="nav-top" href="${r}about/institutes/"${top("about")}>센터 소개</a>
        <button class="sub-toggle" type="button" aria-label="센터 소개 하위 메뉴" aria-expanded="false"></button>
        <ul class="sub">
          <li><a href="${r}about/institutes/"${cur("about/institutes")}>연구소 소개</a></li>
          <li><a href="${r}about/researchers/"${cur("about/researchers")}>연구원 소개<small>준비중</small></a></li>
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
        </ul>
      </div>
      <div class="nav-item">
        <a class="nav-top" href="${CAMP_URL}" ${ext}>글로벌캠프</a>
        <button class="sub-toggle" type="button" aria-label="글로벌캠프 하위 메뉴" aria-expanded="false"></button>
        <ul class="sub">
          <li><a class="ext" href="${CAMP_URL}" ${ext}>글로벌캠프</a></li>
        </ul>
      </div>
      <div class="nav-item"><a class="nav-top" href="${r}emotion-check/"${top("emotion")}>감정체크</a></div>
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
        <p>SEL 기반의 아동 발달 연구실</p>
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
        <p><a href="${r}about/directions/">골프존 조이마루 2층,<br>폭스러닝센터</a></p>
      </div>
    </div>
    <p class="copy">© 2026 폭스러닝센터</p>
  </div>
</footer>
<script src="${r}js/site.js" defer></script>
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
const QUOTES = [
  ["폭스러닝센터에서 사회정서학습에 대해 처음으로 접하게 되었고, 얼마나 중요한 교육인지 알게 되었습니다. 체계적인 관리 시스템도 인상적입니다.", "김O지 학부모", "14세 아동 학부모"],
  ["아이가 정서적으로 안정된 상태에서 더 열심히 배우는 모습을 보며 큰 기쁨을 느꼈습니다. 전문적인 교육과 연구원님들의 따뜻한 분위기가 정말 특별합니다.", "이O호 학부모", "11세 아동 학부모"],
  ["대전에 미술과 영어, AI와 사회정서학습까지 다양한 경험을 할 수 있는 배움의 환경이 있어 너무 좋습니다. 아이가 스스로 생각하고 배우는 능력을 키우는 곳, 폭스러닝센터는 정말 최상의 선택입니다.", "박O찬 학부모", "9세 아동 학부모"],
];

page({
  file: "index.html", key: "home", title: "",
  body: (r) => `
<section class="hero">
  <div class="hero-photo" style="background-image:url(${r}img/hero.jpg)"></div>
  <div class="wrap">
    <p class="tag" lang="en"><span>LEARN TODAY,</span><span>LEAD TOMORROW.</span></p>
    <h1><span class="l1">상담 전문가와 교육 전문가가 함께하는</span><span class="l2"><em>사회정서학습</em> 기반</span><span class="l3">폭스러닝센터</span></h1>
    <p>폭스러닝센터는 전문성과 따뜻함으로 아이의 성장을 지원합니다.</p>
    <div class="actions">
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
    <ol class="steps3">
      <li class="step"><div class="circle"><div class="no">STEP 01</div><h3>관찰</h3></div><p>학생의 행동과 감정을 세심하게 살핍니다.</p></li>
      <li class="step"><div class="circle"><div class="no">STEP 02</div><h3>발견</h3></div><p>강점과 필요를 찾아 성장의 단서를 발견합니다.</p></li>
      <li class="step"><div class="circle"><div class="no">STEP 03</div><h3>반응</h3></div><p>맞춤형 지원으로 아이의 성장에 응답합니다.</p></li>
    </ol>
  </div>
</section>

<section class="sec tint">
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

<section class="sec">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">FOX YOUTUBE</div>
      <h2>폭스 YouTube</h2>
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
    <div class="growth">
      <div>
        <div class="eyebrow left">GROWTH MANAGEMENT</div>
        <h2>학생 성장관리 시스템</h2>
        <p>폭스러닝센터는 다섯 연구소의 교육 활동을 통해 교육 전문가와 심리 전문가가 아이들의 배움과 성장을 다각도로 살펴봅니다.</p>
        <p>학생 성장관리 시스템은 각 연구소에서 관찰한 아이들의 활동과 반응, 변화의 모습을 학생별로 통합하고 체계적으로 기록하는 관리 체계입니다. 개별 활동에서 포착한 다양한 관찰 기록을 하나로 연결함으로써, 단편적인 모습만으로는 파악하기 어려운 아이의 성장 과정과 변화의 흐름을 종합적으로 이해할 수 있습니다.</p>
        <p>폭스러닝센터는 이러한 관찰 데이터와 성장의 흐름을 바탕으로 아이에게 필요한 교육적 지원과 다음 단계의 지도 방향을 구체화하며, 성장 리포트를 통해 그 과정과 결과를 학부모님께 공유합니다.</p>
      </div>
      <div>
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
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">GALLERY</div>
      <h2>폭스러닝센터의 순간들</h2>
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

<section class="sec tint">
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

<section class="sec" id="contact">
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
        <button class="btn navy" type="submit">문의 보내기</button>
        <div class="form-msg" id="formMsg" role="status" aria-live="polite"></div>
        <small>남겨 주신 이름과 연락처는 문의 답변을 위해서만 사용합니다.</small>
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
  { id: "id", label: "FOX ID", tagline: "검사, 상담 및 마음성장 프로그램", name: "SEL 센터", hl: true,
    desc: "아이의 특성과 발달을 더 깊이 이해할 수 있도록 아이 상담 및 마음 성장 프로그램, 검사와 부모 상담을 진행하고 있습니다.",
    items: ["종합심리검사 - 웩슬러, TCI/JTCI, 정서행동검사", "개별 상담 - 아동 청소년 심리상담", "부모 상담 - 부모 양육 상담", "SEL 프로그램 - 그림책, 놀이, 미술 등을 활용한 사회정서 역량 활동"],
    note: "폭스러닝센터 SEL 연구소의 전문 연구원들과 함께 검사 해석 활동을 함께 설계합니다." },
];

page({
  file: "about/institutes/index.html", key: "about/institutes", title: "연구소 소개",
  description: "SEL·AI·언어·미술·수리 다섯 연구소와 SEL 센터를 소개합니다.",
  body: (r) => `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">INSTITUTES</div>
  <h1>연구소 소개</h1>
  <p>다섯 연구소와 SEL 센터가 아이의 배움과 성장을 함께 살핍니다</p>
</div></div>
<div class="page-body"><div class="wrap">
  <div class="inst-grid">
    ${INSTITUTES.map((x) => `<article class="inst${x.hl ? " hl" : ""}">
      <img src="${r}img/institutes/${x.id}.jpg" alt="${esc(x.name)} 활동 공간" loading="lazy" width="900" height="675">
      <div class="inst-body">
        <span class="label">${x.label}</span>
        <div class="tagline">${esc(x.tagline)}</div>
        <h2>${esc(x.name)}</h2>
        <p>${esc(x.desc)}</p>
        <ul>${x.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>${x.note ? `
        <p class="note">${esc(x.note)}</p>` : ""}
      </div>
    </article>`).join("\n    ")}
  </div>
</div></div>`,
});

// ── 연구원 소개 (준비 중) ────────────────────────────────
page({
  file: "about/researchers/index.html", key: "about/researchers", title: "연구원 소개",
  body: (r) => `
<div class="page-head"><div class="wrap">
  <div class="eyebrow">RESEARCHERS</div>
  <h1>연구원 소개</h1>
</div></div>
<div class="page-body"><div class="wrap">
  <div class="soon">
    <img src="${r}img/mark.png" alt="" width="72" height="72">
    <h2>준비 중입니다</h2>
    <p>폭스러닝센터 연구원 소개를 곧 만나 보실 수 있습니다.</p>
    <a class="btn ghost" href="${r}about/institutes/">연구소 소개 보기</a>
  </div>
</div></div>`,
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
  <ul class="ag-list" role="list">
    ${agreementData.agreements.map((a) => `<li class="ag-card">
      <h2>${esc(a.institution)}</h2>
      <p class="ag-date"><time datetime="${isoDate(a.date)}">${dateLabel(a.date)}</time> 체결${a.ended ? ' <span class="ag-status">협약 종료</span>' : ""}</p>
      ${agreementDoc(r, a.institution, a.pages, a.caption)}
      <p class="ag-topic">${esc(a.topic)}</p>
      <p>${esc(a.description)}</p>
    </li>`).join("\n    ")}
  </ul>
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

// ── 오시는 길 ───────────────────────────────────────────
page({
  file: "about/directions/index.html", key: "about/directions", title: "오시는 길",
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
    description: noticeExcerpt(n.text), image: n.photos ? `naver-img/${n.feedId}/0.jpg` : undefined,
    body: (r) => `
<div class="page-body" style="padding-top:56px"><div class="wrap">
  <article class="notice">
    <div class="notice-posters">
      ${Array.from({ length: n.photos }, (_, k) => `<a href="${r}naver-img/${n.feedId}/${k}.jpg" ${ext}><img src="${r}naver-img/${n.feedId}/${k}.jpg" alt="${esc(n.title)} 포스터${n.photos > 1 ? ` ${k + 1}` : ""}"${k ? ' loading="lazy"' : ""}></a>`).join("\n      ")}
    </div>
    <div class="notice-body">
      <p class="date">${ymd(n.date)}${n.period ? ` · 기간 ${esc(n.period)}` : ""}</p>
      <h1>${esc(n.title)}</h1>
      <div class="notice-text">${esc(n.text)}</div>
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
  const urls = pages.filter((p) => p.file !== "404.html").map((p) => base + p.file.replace(/index\.html$/, ""));
  await writeFile(path.join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${esc(u)}</loc></url>`).join("\n")}\n</urlset>\n`);
  await writeFile(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
}
await writeFile(path.join(DIST, ".nojekyll"), "");
console.log(`빌드 완료: ${pages.length}쪽 (폭스뉴스 ${news.length}개, 영상 ${videos.length}개) → dist/`);
