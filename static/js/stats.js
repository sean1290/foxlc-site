/* 관리자 화면: 회원 승인 · 방문 통계 탭
   방문 통계는 /api/admin/stats 를 그린다. 숫자 하나짜리 막대 차트 + 항목별 가로 막대. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var API = (document.querySelector('meta[name="foxlc-api"]') || {}).content || "";
  var KEY = "foxlc_token";
  var tabs = $("#admTabs"), box = $("#stAdmin");
  if (!API || !tabs || !box) return;
  var token = function () { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } };
  var api = function (path) {
    return fetch(API + path, { headers: { Authorization: "Bearer " + token() } }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error || "불러오지 못했습니다."); return d; });
    });
  };
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c); });
    return e;
  }
  var SVG = "http://www.w3.org/2000/svg";
  function svg(tag, attrs) { var e = document.createElementNS(SVG, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  var num = function (n) { return Number(n || 0).toLocaleString("ko-KR"); };

  /* ── 탭 ── */
  var panes = { members: $("#mbAdmin"), stats: box };
  var current = "members", loaded = false;
  var show = function (k) {
    current = k;
    [].forEach.call(tabs.querySelectorAll("button"), function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-tab") === k)); });
    panes.members.classList.toggle("tab-off", k !== "members");
    box.hidden = k !== "stats";
    if (k === "stats" && !loaded) { loaded = true; load(30); }
    try { sessionStorage.setItem("foxlc_admtab", k); } catch (e) {}
  };
  [].forEach.call(tabs.querySelectorAll("button"), function (b) { b.onclick = function () { show(b.getAttribute("data-tab")); }; });
  /* 회원 승인 칸이 보이면(관리자 로그인 완료) 탭도 보인다 */
  var wait = function () {
    if (panes.members && !panes.members.hidden) {
      tabs.hidden = false;
      var k = "members"; try { k = sessionStorage.getItem("foxlc_admtab") || "members"; } catch (e) {}
      show(k);
    } else setTimeout(wait, 600);
  };
  wait();

  /* ── 통계 ── */
  var range = 30, metric = "uv", resizeOff = null;
  var kstDay = function (ms) { return new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); };
  function fillDays(d) {
    var map = {}, out = [];
    (d.series || []).forEach(function (r) { map[r.day] = r; });
    var start = new Date(d.from + "T00:00:00Z").getTime(), end = new Date(d.today + "T00:00:00Z").getTime();
    for (var t = start; t <= end; t += 864e5) {
      var k = new Date(t).toISOString().slice(0, 10);
      out.push({ day: k, pv: (map[k] || {}).pv || 0, uv: (map[k] || {}).uv || 0 });
    }
    return out;
  }
  /* 90일 → 주별, 1년 → 월별로 묶는다 (방문 수 = 날마다 센 방문자의 합) */
  function group(rows, g) {
    if (g === "day") return rows.map(function (r) { return { key: r.day, label: r.day.slice(5).replace("-", "."), tip: r.day.replace(/-/g, "."), pv: r.pv, uv: r.uv }; });
    var out = [], idx = {};
    rows.forEach(function (r) {
      var key, label, tip;
      if (g === "week") {
        var dt = new Date(r.day + "T00:00:00Z"), dow = (dt.getUTCDay() + 6) % 7, mon = new Date(dt.getTime() - dow * 864e5).toISOString().slice(0, 10);
        key = mon; label = mon.slice(5).replace("-", "."); tip = mon.replace(/-/g, ".") + " 주";
      } else { key = r.day.slice(0, 7); label = Number(key.slice(5)) + "월"; tip = key.replace("-", "년 ") + "월"; }
      if (!(key in idx)) { idx[key] = out.length; out.push({ key: key, label: label, tip: tip, pv: 0, uv: 0 }); }
      out[idx[key]].pv += r.pv; out[idx[key]].uv += r.uv;
    });
    return out;
  }
  function niceMax(v) { if (v <= 5) return 5; var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }

  function chart(rows, W, tip) {
    var H = 240, L = 40, R = 8, T = 12, B = 28;
    var max = niceMax(Math.max.apply(null, rows.map(function (r) { return r[metric]; }).concat([1])));
    var div = [4, 5, 2].filter(function (k) { return max % k === 0; })[0] || 4;
    var n = rows.length, slot = (W - L - R) / n, bw = Math.max(2, Math.min(28, slot - 2));
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "st-chart", role: "img", "aria-label": (metric === "uv" ? "방문" : "페이지뷰") + " 추이" });
    for (var i = 0; i <= div; i++) {
      var y = T + (H - T - B) * (1 - i / div), v = Math.round(max * i / div);
      s.appendChild(svg("line", { x1: L, x2: W - R, y1: y, y2: y, class: i ? "st-grid" : "st-base" }));
      var tx = svg("text", { x: L - 8, y: y + 4, class: "st-ax", "text-anchor": "end" }); tx.textContent = num(v); s.appendChild(tx);
    }
    var every = Math.ceil(n / Math.max(3, Math.floor((W - L) / 70)));
    rows.forEach(function (r, i) {
      var v = r[metric], h = (H - T - B) * v / max, x = L + slot * i + (slot - bw) / 2, y = H - B - h;
      var g = svg("g", { class: "st-bar", tabindex: "0" });
      g.appendChild(svg("rect", { x: L + slot * i, y: T, width: slot, height: H - T - B, class: "st-hit" }));
      if (v > 0) g.appendChild(svg("path", { d: barPath(x, y, bw, h), class: "st-fill" }));
      var on = function () {
        tip.innerHTML = "";
        tip.appendChild(el("b", { text: r.tip }));
        tip.appendChild(el("span", { text: "방문 " + num(r.uv) + " · 페이지뷰 " + num(r.pv) }));
        var px = x + bw / 2;
        tip.style.left = Math.min(Math.max(px, 70), W - 70) + "px"; tip.style.top = Math.min(y, H - B - 4) + "px";
        tip.hidden = false; g.classList.add("on");
      };
      var off = function () { tip.hidden = true; g.classList.remove("on"); };
      g.addEventListener("mouseenter", on); g.addEventListener("mouseleave", off); g.addEventListener("focus", on); g.addEventListener("blur", off);
      s.appendChild(g);
      if (i % every === 0) { var lt = svg("text", { x: L + slot * i + slot / 2, y: H - 8, class: "st-ax", "text-anchor": "middle" }); lt.textContent = r.label; s.appendChild(lt); }
    });
    return s;
  }
  /* 위쪽만 둥근 막대 (반지름 4) */
  function barPath(x, y, w, h) {
    var r = Math.min(4, w / 2, h);
    return "M" + x + "," + (y + h) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y + "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) + "V" + (y + h) + "Z";
  }
  function bars(title, rows, opts) {
    opts = opts || {};
    var total = rows.reduce(function (a, r) { return a + r.n; }, 0) || 1, max = Math.max.apply(null, rows.map(function (r) { return r.n; }).concat([1]));
    var card = el("section", { class: "st-card" + (opts.wide ? " wide" : "") }, [el("h3", { text: title })]);
    if (!rows.length) { card.appendChild(el("p", { class: "st-none", text: opts.empty || "아직 데이터가 없습니다." })); return card; }
    var ul = el("ul", { class: "st-bars" });
    rows.forEach(function (r) {
      ul.appendChild(el("li", {}, [
        el("span", { class: "st-k", text: r.label || r.k || "(알 수 없음)", title: r.title || "" }),
        el("span", { class: "st-track", "aria-hidden": "true" }, [el("i", { style: "width:" + Math.max(2, r.n / max * 100) + "%" })]),
        el("span", { class: "st-n" }, [num(r.n), opts.noPct ? null : el("small", { text: " " + Math.round(r.n / total * 100) + "%" })])
      ]));
    });
    card.appendChild(ul);
    if (opts.note) card.appendChild(el("p", { class: "st-note", text: opts.note }));
    return card;
  }
  function delta(cur, prev) {
    if (!prev) return cur ? el("small", { class: "st-d up", text: "새로 집계" }) : null;
    var p = Math.round((cur - prev) / prev * 100);
    return el("small", { class: "st-d " + (p >= 0 ? "up" : "down"), text: (p >= 0 ? "▲ " : "▼ ") + Math.abs(p) + "% · 이전 기간 대비" });
  }
  var pageName = function (p, t) {
    if (p === "/") return "메인";
    var name = (t || "").replace(/\s*\|\s*폭스러닝센터.*$/, "").trim();
    return name || p;
  };

  function render(d) {
    box.innerHTML = "";
    var g = range <= 31 ? "day" : range <= 120 ? "week" : "month";
    var rows = group(fillDays(d), g);
    var sumUv = rows.reduce(function (a, r) { return a + r.uv; }, 0), sumPv = rows.reduce(function (a, r) { return a + r.pv; }, 0);

    var ctl = el("div", { class: "st-ctl" });
    var rg = el("div", { class: "st-seg", role: "group", "aria-label": "기간" });
    [[7, "7일"], [30, "30일"], [90, "90일"], [365, "1년"]].forEach(function (o) {
      var b = el("button", { type: "button", "aria-pressed": String(range === o[0]), text: o[1] });
      b.onclick = function () { range = o[0]; load(range); };
      rg.appendChild(b);
    });
    var mg = el("div", { class: "st-seg", role: "group", "aria-label": "지표" });
    [["uv", "방문"], ["pv", "페이지뷰"]].forEach(function (o) {
      var b = el("button", { type: "button", "aria-pressed": String(metric === o[0]), text: o[1] });
      b.onclick = function () { metric = o[0]; render(d); };
      mg.appendChild(b);
    });
    ctl.appendChild(rg); ctl.appendChild(mg);
    box.appendChild(ctl);

    var su = d.signups || [], sp = function (k) { return ((su.filter(function (x) { return x.k === k; })[0]) || {}).n || 0; };
    var kpi = el("div", { class: "st-kpis" }, [
      el("div", { class: "st-kpi" }, [el("span", { text: "오늘 방문" }), el("b", { text: num((d.todayRow || {}).uv) }), el("small", { text: "페이지뷰 " + num((d.todayRow || {}).pv) })]),
      el("div", { class: "st-kpi" }, [el("span", { text: "기간 방문" }), el("b", { text: num(sumUv) }), delta(sumUv, (d.prev || {}).uv)]),
      el("div", { class: "st-kpi" }, [el("span", { text: "기간 페이지뷰" }), el("b", { text: num(sumPv) }), delta(sumPv, (d.prev || {}).pv)]),
      el("div", { class: "st-kpi" }, [el("span", { text: "가입 신청" }), el("b", { text: num(sp("parent") + sp("staff")) }), el("small", { text: "학부모 " + sp("parent") + " · 직원 " + sp("staff") })]),
      el("div", { class: "st-kpi" }, [el("span", { text: "회원 로그인" }), el("b", { text: num((d.logins || {}).n) }), el("small", { text: "로그인한 회원 " + num((d.logins || {}).u) + "명" })])
    ]);
    box.appendChild(kpi);

    var tip = el("div", { class: "st-tip", hidden: "" }), plot = el("div", { class: "st-plot" }, [tip]);
    var cc = el("section", { class: "st-card wide st-chartcard" }, [
      el("h3", { text: (metric === "uv" ? "방문" : "페이지뷰") + " 추이 · " + (g === "day" ? "일별" : g === "week" ? "주별" : "월별") }),
      plot
    ]);
    var tbl = el("table", { class: "st-table" }, [el("thead", {}, [el("tr", {}, [el("th", { text: "기간" }), el("th", { text: "방문" }), el("th", { text: "페이지뷰" })])]), el("tbody")]);
    rows.slice().reverse().forEach(function (r) { $("tbody", tbl).appendChild(el("tr", {}, [el("td", { text: r.tip }), el("td", { text: num(r.uv) }), el("td", { text: num(r.pv) })])); });
    cc.appendChild(el("details", { class: "st-more" }, [el("summary", { text: "표로 보기" }), tbl]));
    box.appendChild(cc);
    /* 화면 폭에 맞춰 그린다 (휴대폰에서도 글자 크기 그대로) */
    var draw = function () {
      var old = $("svg", plot); if (old) old.remove();
      plot.insertBefore(chart(rows, Math.max(280, Math.round(plot.clientWidth || 760)), tip), tip);
    };
    draw();
    if (resizeOff) resizeOff();
    var t = null, onR = function () { clearTimeout(t); t = setTimeout(draw, 150); };
    addEventListener("resize", onR); resizeOff = function () { removeEventListener("resize", onR); };

    var grid = el("div", { class: "st-grid2" });
    grid.appendChild(bars("인기 페이지", (d.pages || []).map(function (p) { return { label: pageName(p.path, p.title), title: p.path, n: p.pv }; }), { wide: true, noPct: true, note: "숫자는 페이지뷰입니다." }));
    grid.appendChild(bars("유입 경로", (d.sources || []).map(function (s) { return { k: s.k, n: s.n }; }), { note: "'직접 방문'은 주소를 직접 입력했거나 즐겨찾기·앱에서 연 경우입니다." }));
    grid.appendChild(bars("검색어", (d.queries || []).map(function (s) { return { k: s.k, n: s.n }; }), { noPct: true, empty: "아직 없습니다. 네이버·다음 검색으로 들어온 경우만 검색어가 보입니다 (구글은 검색어를 알려 주지 않습니다).", note: "구글 검색어는 구글 서치 콘솔에서 볼 수 있습니다." }));
    grid.appendChild(bars("지역", (d.regions || []).map(function (s) { return { k: s.k, n: s.n }; })));
    grid.appendChild(bars("기기", (d.devices || []).map(function (s) { return { k: s.k, n: s.n }; })));
    grid.appendChild(bars("브라우저 · 앱", (d.browsers || []).map(function (s) { return { k: s.k, n: s.n }; })));
    grid.appendChild(bars("운영체제", (d.oses || []).map(function (s) { return { k: s.k, n: s.n }; })));
    box.appendChild(grid);
    box.appendChild(el("p", { class: "st-foot", text: "방문 = 하루에 같은 사람(기기)을 한 번 센 수입니다. 쿠키를 쓰지 않고 IP 주소도 저장하지 않으며, 관리자 화면 방문과 검색엔진 로봇은 세지 않습니다. 통계는 " + "2026년 11월 24일부터 쌓입니다." }));
  }
  function load(days) {
    box.innerHTML = ""; box.appendChild(el("p", { class: "rc-empty", text: "통계를 불러오는 중입니다…" }));
    api("/api/admin/stats?days=" + days).then(render, function (e) { box.innerHTML = ""; box.appendChild(el("p", { class: "rc-empty", text: e.message })); });
  }
})();
