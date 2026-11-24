/* 폭스러닝센터 사이트 공통 스크립트: 메뉴, 복사 버튼, 갤러리, 페이지 번호, 문의 폼 */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── 첫 화면: 서체와 사진이 준비되면 한꺼번에 시작한다 ── */
  var hero = $(".hero"), heroPhoto = $(".hero-photo");
  if (hero) {
    var started = false;
    var start = function () {
      if (started) return; started = true;
      hero.classList.add("ready");
      if (heroPhoto) heroPhoto.classList.add("loaded");
    };
    var waits = [];
    if (document.fonts && document.fonts.load) {
      waits.push(Promise.all([
        document.fonts.load("700 112px Oswald", "LEARN TODAY, LEAD TOMORROW."),
        document.fonts.load('700 28px "Noto Sans KR"', "상담 전문가와 교육 전문가가 함께하는 사회정서학습 기반"),
        document.fonts.load('800 64px "Noto Sans KR"', "폭스러닝센터"),
        document.fonts.load('400 17px "Noto Sans KR"', "폭스러닝센터는 전문성과 따뜻함으로 아이의 성장을 지원합니다."),
        document.fonts.load('700 15px "Noto Sans KR"', "연구소 소개 문의하기")
      ]).catch(function () {}));
    }
    if (heroPhoto) {
      var m = /url\(["']?([^"')]+)/.exec(heroPhoto.style.backgroundImage);
      if (m) waits.push(new Promise(function (res) {
        var im = new Image(); im.onload = res; im.onerror = res; im.src = m[1];
        if (im.complete) res();
      }));
    }
    Promise.all(waits).then(start, start);
    setTimeout(start, 2500);   /* 너무 오래 걸리면 기다리지 않는다 */
  }

  /* ── 메인 첫 화면 팝업: '24시간 동안 다시 열람하지 않습니다' 를 누르면 이 브라우저에서 하루 동안 안 뜬다 ── */
  var promo = $("#promo");
  if (promo && promo.showModal) {
    var key = "foxlc_promo_" + promo.getAttribute("data-id");
    var hiddenUntil = 0;
    try { hiddenUntil = parseInt(localStorage.getItem(key) || "0", 10); } catch (e) {}
    var end = promo.getAttribute("data-end");
    var expired = end && new Date() > new Date(end + "T23:59:59+09:00");
    if (!expired && Date.now() > hiddenUntil) {
      var show = function () { if (!promo.open) { promo.showModal(); promo.focus(); } };
      if (document.readyState === "complete") setTimeout(show, 300);
      else window.addEventListener("load", function () { setTimeout(show, 300); });
    }
    $(".promo-close", promo).addEventListener("click", function () { promo.close(); });
    $(".promo-skip", promo).addEventListener("click", function () {
      try { localStorage.setItem(key, String(Date.now() + 24 * 3600 * 1000)); } catch (e) {}
      promo.close();
    });
    promo.addEventListener("click", function (e) { if (e.target === promo) promo.close(); });
    var slides = $$(".promo-slide", promo), si = 0, pcount = $(".promo-count", promo), zoom = $(".promo-zoom", promo);
    var go = function (i) {
      if (slides.length < 2) return;
      si = (i + slides.length) % slides.length;
      slides.forEach(function (im, k) { im.hidden = k !== si; });
      if (pcount) pcount.textContent = (si + 1) + " / " + slides.length;
      if (zoom) zoom.href = slides[si].getAttribute("src");
      var nx = slides[(si + 1) % slides.length]; if (nx.loading === "lazy") nx.loading = "eager";
    };
    var pv = $(".promo-nav.prev", promo), nv = $(".promo-nav.next", promo);
    if (pv) pv.addEventListener("click", function () { go(si - 1); });
    if (nv) nv.addEventListener("click", function () { go(si + 1); });
    promo.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { go(si - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { go(si + 1); e.preventDefault(); }
    });
    var tx = null, stage = $(".promo-stage", promo);
    stage.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 40) go(si + (dx < 0 ? 1 : -1));
    });
    if (slides[1]) slides[1].loading = "eager";
  }

  /* 소식 포스터 넘겨보기 */
  $$(".np-slider").forEach(function (sl) {
    var ss = $$(".np-slide", sl), i = 0, cnt = $(".promo-count", sl);
    var go = function (k) {
      i = (k + ss.length) % ss.length;
      ss.forEach(function (a, j) { a.hidden = j !== i; });
      cnt.textContent = (i + 1) + " / " + ss.length;
      var nx = $("img", ss[(i + 1) % ss.length]); if (nx && nx.loading === "lazy") nx.loading = "eager";
    };
    $(".promo-nav.prev", sl).addEventListener("click", function () { go(i - 1); });
    $(".promo-nav.next", sl).addEventListener("click", function () { go(i + 1); });
    sl.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") go(i - 1);
      if (e.key === "ArrowRight") go(i + 1);
    });
    var tx = null;
    sl.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    sl.addEventListener("touchend", function (e) {
      if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
    });
    var n1 = $("img", ss[1]); if (n1) n1.loading = "eager";
  });

  /* ── 메뉴: 데스크톱은 CSS hover, 휴대폰은 탭해서 펼친다 ── */
  var head = $(".site-head"), menuBtn = $(".menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = head.classList.toggle("menu-open");
      menuBtn.setAttribute("aria-expanded", open);
    });
    $$(".sub-toggle").forEach(function (b) {
      b.addEventListener("click", function () {
        var open = b.parentNode.classList.toggle("open");
        b.setAttribute("aria-expanded", open);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        head.classList.remove("menu-open");
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      }
    });
    $$(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { head.classList.remove("menu-open"); });
    });
  }

  /* ── 상단 로그인 버튼: 로그인되어 있으면 "안녕하세요, OOO님" ── */
  (function () {
    var btn = $(".nav-login");
    var api = (document.querySelector('meta[name="foxlc-api"]') || {}).content || "";
    if (!btn || !api) return;
    var token = "", cache = null;
    try { token = localStorage.getItem("foxlc_token") || ""; cache = JSON.parse(sessionStorage.getItem("foxlc_me") || "null"); } catch (e) {}
    var show = function (u) {
      if (!u) { btn.textContent = "로그인"; btn.classList.remove("in"); btn.removeAttribute("title"); return; }
      var who = u.name || u.username;
      btn.textContent = "";
      var sp = document.createElement("span"); btn.appendChild(sp); sp.appendChild(document.createTextNode("안녕하세요, "));
      var b = document.createElement("b"); b.textContent = who; sp.appendChild(b);
      sp.appendChild(document.createTextNode("님"));
      btn.title = "내 계정 보기"; btn.classList.add("in");
    };
    if (!token) { try { sessionStorage.removeItem("foxlc_me"); } catch (e) {} return; }
    if (cache && cache.t === token.slice(-16)) show(cache.u);
    fetch(api + "/api/auth/me", { headers: { Authorization: "Bearer " + token } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var u = d && d.user ? { name: d.user.name, username: d.user.username } : null;
        if (!u) { try { localStorage.removeItem("foxlc_token"); sessionStorage.removeItem("foxlc_me"); } catch (e) {} }
        else { try { sessionStorage.setItem("foxlc_me", JSON.stringify({ t: token.slice(-16), u: u })); } catch (e) {} }
        show(u);
      }, function () {});
  })();

  /* ── 방문 기록 (쿠키 없음 · 관리자 화면 방문 통계용) ── */
  (function () {
    var api = (document.querySelector('meta[name="foxlc-api"]') || {}).content || "";
    var root = (document.querySelector('meta[name="foxlc-root"]') || {}).content || "./";
    if (!api || navigator.webdriver) return;
    var base = new URL(root, location.href).pathname, path = location.pathname;
    var p = "/" + (path.indexOf(base) === 0 ? path.slice(base.length) : path.replace(/^\//, ""));
    if (p.indexOf("/admin") === 0) return;
    var qs = new URLSearchParams(location.search);
    var body = JSON.stringify({ p: p, t: document.title, r: document.referrer || "", u: qs.get("utm_source") || "", g: qs.has("gclid") ? 1 : 0 });
    try { fetch(api + "/api/stat/hit", { method: "POST", body: body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(function () {}); } catch (e) {}
  })();

  /* ── 목록 카드: 조회수 · 좋아요 수 ── */
  (function () {
    var api = (document.querySelector('meta[name="foxlc-api"]') || {}).content || "";
    if (!api) return;
    var cache = {};
    var get = function (kind) {
      if (!cache[kind]) cache[kind] = fetch(api + "/api/rx/stats?kind=" + kind).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
      return cache[kind];
    };
    var fmt = function (n) { return n >= 10000 ? (Math.round(n / 1000) / 10) + "만" : String(n); };
    var run = function () {
      $$("[data-stat]:not([data-stat-done])").forEach(function (card) {
        var kind = card.getAttribute("data-stat"), id = card.getAttribute("data-stat-id");
        card.setAttribute("data-stat-done", "1");
        get(kind).then(function (d) {
          if (!d) return;
          var body = card.querySelector(".card-body") || card;
          var box = document.createElement("div");
          box.className = "card-stats";
          box.setAttribute("aria-label", "조회 " + ((d.views[id]) || 0) + "회, 좋아요 " + ((d.likes[id]) || 0) + "개");
          [["st-view", "조회 ", d.views[id] || 0], ["st-like", "좋아요 ", d.likes[id] || 0]].forEach(function (s) {
            var sp = document.createElement("span"); sp.className = s[0]; sp.setAttribute("aria-hidden", "true");
            sp.textContent = fmt(s[2]); sp.title = s[1] + s[2];
            box.appendChild(sp);
          });
          body.appendChild(box);
        });
      });
    };
    window.foxlcStats = run;
    run();
  })();

  /* ── 복사 버튼: <button data-copy="글자" data-msg="안내"> ── */
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.getAttribute("data-copy");
      var toast = $("#" + (b.getAttribute("data-toast") || "toast"));
      var done = function () {
        if (!toast) return;
        toast.textContent = b.getAttribute("data-msg") || "복사했습니다";
        setTimeout(function () { toast.textContent = ""; }, 2500);
      };
      var fallback = function () {
        var t = document.createElement("textarea");
        t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(t); done();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }
    });
  });

  /* ── F.O.X : X 단어 바꾸기 ── */
  (function () {
  var fw = $(".foxx-word");
  if (fw) {
    var fwords = fw.getAttribute("data-words").split("|"), fk = -1, ftimer = null;
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var paint = function (w) {
      var html = "", hit = false;
      for (var c = 0; c < w.length; c++) {
        var ch = w[c].toUpperCase(), x = !hit && ch === "X";
        if (x) hit = true;
        html += '<span class="fl' + (x ? " fx" : "") + '" style="--d:' + (c * 38) + 'ms">' + ch + "</span>";
      }
      return html;
    };
    var next = function () {
      fk = (fk + 1) % fwords.length;
      var w = fwords[fk], last = fk === fwords.length - 1;
      if (still) { fw.innerHTML = paint(w); fw.classList.toggle("all", last); }
      else {
        fw.classList.add("out");
        setTimeout(function () {
          fw.classList.remove("out");
          fw.classList.toggle("all", last);
          fw.innerHTML = paint(w);
        }, 420);
      }
      ftimer = setTimeout(next, last ? 3800 : 2100);
    };
    var started = false;
    var start = function () { if (!started) { started = true; ftimer = setTimeout(next, 1400); } };
    var fbox = fw.closest(".foxx") || fw;
    var seen = function () { var r = fbox.getBoundingClientRect(); return r.top < innerHeight * 0.8 && r.bottom > innerHeight * 0.2; };
    var check = function () { if (seen()) { start(); removeEventListener("scroll", check); } };
    addEventListener("scroll", check, { passive: true }); check();
    document.addEventListener("visibilitychange", function () {
      if (!started) return;
      if (document.hidden) clearTimeout(ftimer); else { clearTimeout(ftimer); ftimer = setTimeout(next, 900); }
    });
  }
  })();

  /* ── F.O.X : 점과 선으로 그려지는 여우 마크 ── */
  (function () {
    var svg = $(".foxx-mark");
    if (!svg) return;
    var els = $$("[data-on]", svg), step = 0, timer = null, running = false;
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var apply = function (n) {
      els.forEach(function (el) {
        var on = +el.getAttribute("data-on"), off = +(el.getAttribute("data-off") || 99);
        el.classList.toggle("on", n >= on && n < off);
      });
      svg.classList.toggle("done", n >= 7);
    };
    if (still) { apply(7); return; }
    var LAST = 7;
    var tick = function () {
      step++;
      if (step <= LAST) { apply(step); timer = setTimeout(tick, step === LAST ? 3600 : 720); }
      else { svg.classList.add("fade"); timer = setTimeout(function () { svg.classList.remove("fade"); step = 0; apply(0); timer = setTimeout(tick, 500); }, 900); }
    };
    var box = svg.closest(".foxx") || svg;
    var vis = function () { var r = box.getBoundingClientRect(); return r.top < innerHeight * 0.8 && r.bottom > innerHeight * 0.2; };
    var go = function () { if (!running && vis()) { running = true; removeEventListener("scroll", go); timer = setTimeout(tick, 600); } };
    addEventListener("scroll", go, { passive: true }); go();
    document.addEventListener("visibilitychange", function () {
      if (!running) return;
      clearTimeout(timer);
      if (!document.hidden) { svg.classList.remove("fade"); step = 0; apply(0); timer = setTimeout(tick, 500); }
    });
  })();

  /* ── 갤러리 크게 보기 ── */
  var lb = $("#lightbox");
  if (lb && lb.showModal) {
    $$(".gallery button").forEach(function (b) {
      b.addEventListener("click", function () {
        var img = $("img", b);
        $("img", lb).src = img.src; $("img", lb).alt = img.alt;
        lb.showModal();
      });
    });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  /* ── 센터 시설 사진 크게 보기 ── */
  var flb = $("#facLb");
  if (flb && flb.showModal) {
    var ft = $$(".fac-tile"), fi = 0, fimg = $("img", flb), fcap = $("figcaption", flb);
    var fshow = function (k) {
      fi = (k + ft.length) % ft.length;
      fimg.src = ft[fi].getAttribute("data-full"); fimg.alt = $("img", ft[fi]).alt;
      fcap.textContent = $(".fac-cap", ft[fi]).textContent + "  ·  " + (fi + 1) + " / " + ft.length;
      var nx = new Image(); nx.src = ft[(fi + 1) % ft.length].getAttribute("data-full");
    };
    ft.forEach(function (b, k) { b.addEventListener("click", function () { fshow(k); flb.showModal(); }); });
    $(".promo-nav.prev", flb).addEventListener("click", function () { fshow(fi - 1); });
    $(".promo-nav.next", flb).addEventListener("click", function () { fshow(fi + 1); });
    $(".fac-lb-x", flb).addEventListener("click", function () { flb.close(); });
    flb.addEventListener("click", function (e) { if (e.target === flb) flb.close(); });
    flb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") fshow(fi - 1);
      if (e.key === "ArrowRight") fshow(fi + 1);
    });
    var ftx = null;
    flb.addEventListener("touchstart", function (e) { ftx = e.touches[0].clientX; }, { passive: true });
    flb.addEventListener("touchend", function (e) {
      if (ftx === null) return; var dx = e.changedTouches[0].clientX - ftx; ftx = null;
      if (Math.abs(dx) > 40) fshow(fi + (dx < 0 ? 1 : -1));
    });
  }

  /* ── 페이지 번호 ── */
  function pager(nav, pages, current, go) {
    nav.innerHTML = "";
    if (pages <= 1) return;
    function btn(label, target, aria) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = label;
      if (aria) b.setAttribute("aria-label", aria);
      if (target === current && !aria) b.setAttribute("aria-current", "page");
      if (target < 1 || target > pages) b.disabled = true;
      else b.addEventListener("click", function () { go(target); });
      nav.appendChild(b);
    }
    btn("‹", current - 1, "이전 페이지");
    for (var i = 1; i <= pages; i++) btn(String(i), i);
    btn("›", current + 1, "다음 페이지");
  }
  function pageFromUrl() {
    var m = /[?&]page=(\d+)/.exec(location.search);
    return m ? Math.max(1, parseInt(m[1], 10)) : 1;
  }
  function setUrl(p) {
    try { history.replaceState(null, "", p > 1 ? "?page=" + p : location.pathname); } catch (e) {}
  }
  function scrollToList(el) {
    var y = el.getBoundingClientRect().top + window.pageYOffset - 110;
    window.scrollTo(0, Math.max(0, y));
  }

  /* 폭스뉴스 목록: 카드는 이미 HTML에 있고, 9개씩 나눠 보여 준다 */
  var newsGrid = $("#newsGrid");
  if (newsGrid) {
    var cards = $$(".post-card", newsGrid), per = 9, navN = $("#newsPager");
    var showNews = function (p, scroll) {
      var pages = Math.max(1, Math.ceil(cards.length / per));
      p = Math.min(p, pages);
      cards.forEach(function (c, i) { c.hidden = i < (p - 1) * per || i >= p * per; });
      pager(navN, pages, p, function (t) { showNews(t, true); });
      setUrl(p);
      if (scroll) scrollToList(newsGrid);
    };
    showNews(pageFromUrl(), false);
  }

  /* 폭스 소식 > 센터 소식: 8개씩 나눠 보여 준다 (주소의 ?page 는 영상 목록이 쓰므로 건드리지 않는다) */
  var noticeGrid = $("#noticeGrid");
  if (noticeGrid) {
    var ncards = $$(".notice-card", noticeGrid), nper = 8, navNt = $("#noticePager");
    var showNotices = function (p, scroll) {
      var pages = Math.max(1, Math.ceil(ncards.length / nper));
      ncards.forEach(function (c, i) { c.hidden = i < (p - 1) * nper || i >= p * nper; });
      pager(navNt, pages, p, function (t) { showNotices(t, true); });
      if (scroll) scrollToList(noticeGrid);
    };
    showNotices(1, false);
  }

  /* 폭스 소식 영상 목록: 보이는 페이지의 플레이어만 만든다 */
  var videoGrid = $("#videoGrid");
  if (videoGrid) {
    var videos = JSON.parse($("#videoData").textContent), navV = $("#videoPager");
    var el = function (tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text) e.textContent = text;
      return e;
    };
    var showVideos = function (p, scroll) {
      var n = 9, pages = Math.max(1, Math.ceil(videos.length / n));
      p = Math.min(p, pages);
      videoGrid.innerHTML = "";
      videos.slice((p - 1) * n, p * n).forEach(function (v) {
        var card = el("article", "card"), player = el("div", "player"), f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(v.videoId) + "?rel=0&playsinline=1";
        f.title = v.title; f.loading = "lazy"; f.allowFullscreen = true;
        f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        player.appendChild(f); card.appendChild(player);
        var body = el("div", "card-body");
        body.appendChild(el("h2", "card-title", v.title));
        if (v.duration) body.appendChild(el("div", "card-meta", "영상 길이 " + v.duration));
        if (v.description) body.appendChild(el("p", "card-desc", v.description));
        card.appendChild(body); videoGrid.appendChild(card);
      });
      pager(navV, pages, p, function (t) { showVideos(t, true); });
      setUrl(p);
      if (scroll) scrollToList(videoGrid);
    };
    showVideos(pageFromUrl(), false);
  }

  /* ── 문의 폼 ──
     data-endpoint 에 Google Apps Script 웹 앱 주소가 있으면 그곳으로 보낸다 (contact/contact.gs 참고).
     비어 있으면 보내지 않고 전화·카카오톡 안내만 보여 준다. */
  var form = $("#contactForm");
  if (form) {
    var msg = $("#formMsg"), submit = $("button[type=submit]", form);
    var say = function (text, err) { msg.textContent = text; msg.className = "form-msg" + (err ? " err" : ""); };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var endpoint = form.getAttribute("data-endpoint");
      if (form.website.value) return; /* 스팸 봇 */
      if (form.agree && !form.agree.checked) { say("개인정보 수집·이용에 동의해 주세요.", true); return; }
      if (!endpoint) {
        say("온라인 문의 접수는 준비 중입니다. 전화 1433-2700 또는 카카오톡 FOX_LC로 문의해 주세요.", true);
        return;
      }
      submit.disabled = true; say("보내는 중입니다…");
      var body = new URLSearchParams();
      body.set("name", form.name.value.trim());
      body.set("phone", form.phone.value.trim());
      body.set("message", form.message.value.trim());
      body.set("page", location.href);
      body.set("agree", "yes");
      fetch(endpoint, { method: "POST", mode: "no-cors", body: body }).then(function () {
        form.reset();
        say("문의가 접수되었습니다. 확인 후 연락드리겠습니다. 감사합니다.");
      }).catch(function () {
        say("전송하지 못했습니다. 전화 1433-2700 또는 카카오톡 FOX_LC로 문의해 주세요.", true);
      }).then(function () { submit.disabled = false; });
    });
  }

  /* ── 감정체크 체험판: 1180x820 화면을 태블릿 틀에 맞춰 줄인다.
     화면 내용이 820보다 길어지면 더 줄여서, 태블릿 안에서는 스크롤이 생기지 않는다. ── */
  var frame = $("#app"), screen = $("#screen");
  if (frame && screen) {
    var BASE_W = 1180, BASE_H = 820;
    var FIT_CSS = "html,body{overflow:hidden!important}.scr{min-height:820px!important}#qBox{min-height:500px!important}";
    var doc = function () { try { return frame.contentDocument; } catch (e) { return null; } };
    var inject = function (d) {
      if (d && d.head && !d.getElementById("fitNoScroll")) {
        var st = d.createElement("style"); st.id = "fitNoScroll"; st.textContent = FIT_CSS;
        d.head.appendChild(st);
      }
    };
    var fit = function () {
      var d = doc(), h = BASE_H;
      if (d && d.documentElement) {
        inject(d);
        frame.style.height = BASE_H + "px";
        h = Math.max(BASE_H, d.documentElement.scrollHeight, d.body ? d.body.scrollHeight : 0);
        d.documentElement.scrollTop = 0; if (d.body) d.body.scrollTop = 0;
      }
      frame.style.height = h + "px";
      var sw = screen.clientWidth, sh = screen.clientHeight;
      var k = Math.min(sw / BASE_W, sh / h);
      frame.style.transform = "translate(" + (sw - BASE_W * k) / 2 + "px,0) scale(" + k + ")";
    };
    var ready = function () {
      var d = doc();
      if (!d || !d.body || frame.getAttribute("data-ready")) return;
      frame.setAttribute("data-ready", "1");
      var loading = $("#loading"); if (loading) loading.style.display = "none";
      fit();
      ["click", "pointerup", "keyup", "input"].forEach(function (ev) {
        d.addEventListener(ev, function () { setTimeout(fit, 60); setTimeout(fit, 500); setTimeout(fit, 1200); }, true);
      });
      setInterval(fit, 700);
    };
    fit();
    window.addEventListener("resize", fit);
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(screen);
    frame.addEventListener("load", ready);
    var d0 = doc();
    if (d0 && d0.readyState === "complete" && d0.location.href !== "about:blank") ready();
  }
  /* ── 교육 협약: 협약서 사본 크게 보기 ── */
  var agViewer = $(".ag-viewer");
  if (agViewer && agViewer.showModal) {
    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest("[data-ag-doc]");
      if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      $("h2", agViewer).textContent = link.getAttribute("data-ag-doc") + " 협약서";
      var pages = $(".ag-viewer-pages", agViewer);
      pages.innerHTML = "";
      pages.appendChild(link.parentNode.querySelector("template").content.cloneNode(true));
      agViewer.showModal();
      agViewer.scrollTop = 0;
    });
    agViewer.addEventListener("click", function (e) { if (e.target === agViewer) agViewer.close(); });
  }

  /* ── 연구소 '자세히 보기': 창 열기, 사진 넘기기, 주소(#sel 등)로 바로 열기 ── */
  var openInst = function (id) {
    var dlg = document.getElementById("inst-" + id);
    if (!dlg || !dlg.showModal || dlg.open) return;
    dlg.showModal(); dlg.scrollTop = 0;
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
  };
  $$(".inst-more, .inst-photo").forEach(function (b) {
    b.addEventListener("click", function () { openInst(b.getAttribute("data-inst")); });
  });
  $$(".inst-modal").forEach(function (dlg) {
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () {
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    });
    var main = $(".im-main img", dlg), cap = $(".im-main figcaption", dlg), count = $(".im-count", dlg);
    var thumbs = $$(".im-thumb", dlg), cur = 0;
    var show = function (i) {
      if (!thumbs.length) return;
      cur = (i + thumbs.length) % thumbs.length;
      var t = thumbs[cur];
      main.src = t.getAttribute("data-src"); main.alt = t.getAttribute("data-alt") || "";
      cap.textContent = t.getAttribute("data-caption") || "";
      if (count) count.textContent = (cur + 1) + " / " + thumbs.length;
      thumbs.forEach(function (o) { o.removeAttribute("aria-current"); });
      t.setAttribute("aria-current", "true");
      var strip = t.parentNode;
      strip.scrollTo({ left: t.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 + t.clientWidth / 2, behavior: "smooth" });
    };
    thumbs.forEach(function (t, i) { t.addEventListener("click", function () { show(i); }); });
    var prev = $(".im-nav.prev", dlg), next = $(".im-nav.next", dlg);
    if (prev) prev.addEventListener("click", function () { show(cur - 1); });
    if (next) next.addEventListener("click", function () { show(cur + 1); });
    dlg.addEventListener("keydown", function (e) {
      if (!thumbs.length) return;
      if (e.key === "ArrowLeft") { show(cur - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { show(cur + 1); e.preventDefault(); }
    });
    /* 휴대폰: 큰 사진을 옆으로 밀어서 넘기기 */
    var x0 = null;
    main.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    main.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    });
  });
  if (location.hash && $(".inst-modal")) openInst(location.hash.slice(1));
  window.addEventListener("hashchange", function () { if ($(".inst-modal") && location.hash) openInst(location.hash.slice(1)); });

  /* ── 스크롤 애니메이션 ──
     아래 요소들이 화면에 들어오면 .in 을 붙여 살짝 떠오르게 한다.
     같은 줄에 놓인 카드들은 0.08초씩 차례로 나타난다. */
  var REVEAL = [
    ".sec-head", ".page-head .wrap", ".about > *", ".step", ".grid3 > .card", ".grid3 > .quote",
    ".growth > *", ".gallery button", ".contact > *", ".inst", ".dir > *", ".soon",
    ".ec-intro > *", ".device", ".ag-card", ".ag-partner", ".notice-card", ".notice-posters", ".notice-body", ".person", ".expert", ".research-list li", ".global-grid article", ".org-team", ".role", ".steps5 li", ".gp-screen", ".gp-text p", ".tl-side", ".tl-list li", ".au-hero-text", ".au-card", ".au-invite-box", ".post > h1", ".post > .byline", ".post > p", ".post figure"
  ].join(",");
  var targets = $$(REVEAL);
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || reduce) {
    targets.forEach(function (t) { t.classList.add("in"); });
  } else {
    targets.forEach(function (t) {
      var sibs = Array.prototype.filter.call(t.parentNode.children, function (c) { return c.matches(REVEAL); });
      var i = sibs.indexOf(t) % 3;
      if (i > 0) t.style.setProperty("--d", i * 0.08 + "s");
      t.classList.add("reveal");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  }
})();
