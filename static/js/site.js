/* 폭스러닝센터 사이트 공통 스크립트: 메뉴, 복사 버튼, 갤러리, 페이지 번호, 문의 폼 */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

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
  /* ── 스크롤 애니메이션 ──
     아래 요소들이 화면에 들어오면 .in 을 붙여 살짝 떠오르게 한다.
     같은 줄에 놓인 카드들은 0.08초씩 차례로 나타난다. */
  var REVEAL = [
    ".sec-head", ".page-head .wrap", ".about > *", ".step", ".grid3 > .card", ".grid3 > .quote",
    ".growth > *", ".gallery button", ".contact > *", ".inst", ".dir > *", ".soon",
    ".ec-intro > *", ".device", ".post > h1", ".post > .byline", ".post > p", ".post figure"
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
