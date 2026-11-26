/* 연구원 자료실: 바로가기 · 직원 게시판 · 캘린더 (승인된 직원 · 관리자만)
   화면 이동은 주소의 # 으로 한다: #links · #board · #post/12 · #write · #edit/12 · #calendar */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var API = (document.querySelector('meta[name="foxlc-api"]') || {}).content || "";
  var ROOT = (document.querySelector('meta[name="foxlc-root"]') || {}).content || "./";
  var KEY = "foxlc_token";
  var root = $("#staffRoom");
  if (!root || !API) return;
  var token = function () { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } };
  function api(method, path, data) {
    var h = { "Content-Type": "application/json" }, t = token(); if (t) h.Authorization = "Bearer " + t;
    return fetch(API + path, { method: method, headers: h, body: data ? JSON.stringify(data) : undefined }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.error || "요청을 처리하지 못했습니다."); e.status = r.status; throw e; }
        return d;
      });
    });
  }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null && c !== false) e.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c); });
    return e;
  }
  var kst = function (s) { var d = new Date(String(s).replace(" ", "T") + "Z"); return isNaN(d) ? "" : new Date(d.getTime() + 9 * 3600e3); };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var when = function (s) { var k = kst(s); return k ? k.getUTCFullYear() + "." + pad(k.getUTCMonth() + 1) + "." + pad(k.getUTCDate()) + " " + pad(k.getUTCHours()) + ":" + pad(k.getUTCMinutes()) : ""; };
  var ymd = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var view = $("#srView"), tabs = $("#srTabs"), who = $("#srWho");
  var info = null;

  /* ── 접근 확인 ── */
  function gate(msg, login) {
    tabs.hidden = true; view.innerHTML = "";
    view.appendChild(el("div", { class: "sr-gate" }, [
      el("span", { class: "mb-lock", "aria-hidden": "true" }),
      el("h2", { text: "연구원 자료실은 직원 전용입니다" }),
      el("p", { text: msg }),
      login ? el("div", { class: "sr-gate-act" }, [el("a", { class: "btn navy", href: ROOT + "member/?next=staff/", text: "로그인" }), el("a", { class: "btn line", href: ROOT + "member/join/", text: "직원 회원가입 신청" })]) : null
    ]));
  }
  if (!token()) { gate("폭스러닝센터 직원 계정으로 로그인해 주세요. 계정이 없으면 회원가입에서 '직원'으로 신청하면 승인 후 이용할 수 있습니다.", true); return; }
  api("GET", "/api/staff/home").then(function (d) {
    info = d; tabs.hidden = false;
    who.textContent = d.me.name + "님";
    addEventListener("hashchange", route); route();
  }, function (e) { gate(e.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : e.message, e.status === 401); });

  function route() {
    var h = location.hash.replace(/^#/, "") || "links", parts = h.split("/");
    [].forEach.call(tabs.querySelectorAll("a"), function (a) {
      var t = a.getAttribute("href").slice(1);
      a.setAttribute("aria-current", String(t === parts[0] || (t === "board" && /^(post|write|edit)$/.test(parts[0]))));
    });
    view.innerHTML = "";
    if (parts[0] === "board") board();
    else if (parts[0] === "post") post(parts[1]);
    else if (parts[0] === "write") write();
    else if (parts[0] === "edit") write(parts[1]);
    else if (parts[0] === "calendar") calendar(parts[1]);
    else links();
    window.scrollTo(0, Math.min(scrollY, root.offsetTop - 80));
  }
  var err = function (box) { return function (e) { box.innerHTML = ""; box.appendChild(el("p", { class: "rc-empty", text: e.message })); }; };

  /* ── 바로가기 ── */
  var ICON = {
    growth: '<svg viewBox="0 0 24 24"><path d="M3 20h18"/><path d="M6 16v-4M11 16V8M16 16v-6M21 4l-6 6-4-3-5 5"/></svg>',
    emotion: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.3 2 3.5 2 3.5-2 3.5-2"/><path d="M9 9.5h.01M15 9.5h.01"/></svg>'
  };
  function links() {
    var g = el("div", { class: "sr-links" });
    info.links.forEach(function (l) {
      var ic = el("span", { class: "sr-ic", "aria-hidden": "true" }); ic.innerHTML = ICON[l.icon] || ICON.growth;
      g.appendChild(el("a", { class: "sr-link", href: l.url, target: "_blank", rel: "noopener" }, [ic, el("b", { text: l.title }), el("span", { text: l.desc }), el("em", { text: "열기 ↗" })]));
    });
    view.appendChild(el("h2", { class: "sr-h", text: "바로가기" }));
    view.appendChild(g);
    var preview = el("div", { class: "sr-preview" }, [el("p", { class: "rc-empty", text: "불러오는 중…" })]);
    view.appendChild(el("div", { class: "sr-split" }, [
      el("section", {}, [el("h2", { class: "sr-h" }, ["최근 게시글 ", el("a", { href: "#board", text: "전체 보기 →" })]), preview]),
      el("section", {}, [el("h2", { class: "sr-h" }, ["다가오는 일정 ", el("a", { href: "#calendar", text: "캘린더 →" })]), upcoming()])
    ]));
    api("GET", "/api/staff/posts").then(function (d) {
      preview.innerHTML = "";
      if (!d.posts.length) { preview.appendChild(el("p", { class: "rc-empty", text: "아직 게시글이 없습니다." })); return; }
      var ul = el("ul", { class: "sr-mini" });
      d.posts.slice(0, 5).forEach(function (p) { ul.appendChild(el("li", {}, [el("a", { href: "#post/" + p.id, text: (p.pinned ? "📌 " : "") + p.title }), el("small", { text: p.author_name + " · " + when(p.created_at).slice(0, 10) })])); });
      preview.appendChild(ul);
    }, err(preview));
  }
  function upcoming() {
    var box = el("div", { class: "sr-preview" }, [el("p", { class: "rc-empty", text: "불러오는 중…" })]);
    var t = new Date(), to = new Date(t.getTime() + 30 * 864e5);
    api("GET", "/api/staff/events?from=" + ymd(t) + "&to=" + ymd(to)).then(function (d) {
      box.innerHTML = "";
      if (!d.events.length) { box.appendChild(el("p", { class: "rc-empty", text: "30일 안에 등록된 일정이 없습니다." })); return; }
      var ul = el("ul", { class: "sr-mini" });
      d.events.slice(0, 6).forEach(function (e) { ul.appendChild(el("li", {}, [el("a", { href: "#calendar/" + e.start_date.slice(0, 7) }, [el("i", { class: "sr-dot c-" + e.color }), e.title]), el("small", { text: e.start_date.slice(5).replace("-", ".") + (e.end_date !== e.start_date ? " ~ " + e.end_date.slice(5).replace("-", ".") : "") + (e.time ? " · " + e.time : "") })])); });
      box.appendChild(ul);
    }, err(box));
    return box;
  }

  /* ── 게시판 ── */
  function board() {
    var box = el("div", {}, [el("p", { class: "rc-empty", text: "불러오는 중…" })]);
    view.appendChild(el("div", { class: "sr-bar" }, [el("h2", { class: "sr-h", text: "직원 게시판" }), el("a", { class: "btn navy sm", href: "#write", text: "글쓰기" })]));
    view.appendChild(box);
    api("GET", "/api/staff/posts").then(function (d) {
      box.innerHTML = "";
      if (!d.posts.length) { box.appendChild(el("p", { class: "rc-empty", text: "첫 글을 남겨 보세요." })); return; }
      var ul = el("ul", { class: "sr-list" });
      d.posts.forEach(function (p) {
        ul.appendChild(el("li", { class: p.pinned ? "pin" : "" }, [el("a", { href: "#post/" + p.id }, [
          p.pinned ? el("span", { class: "sr-pin", text: "공지" }) : null,
          el("b", { text: p.title }), p.comments ? el("span", { class: "sr-cc", text: "[" + p.comments + "]" }) : null,
          el("small", { text: p.author_name + " · " + when(p.created_at) })
        ])]));
      });
      box.appendChild(ul);
    }, err(box));
  }
  function post(id) {
    var box = el("div", {}, [el("p", { class: "rc-empty", text: "불러오는 중…" })]);
    view.appendChild(box);
    var load = function () {
      api("GET", "/api/staff/posts/" + id).then(function (d) {
        var p = d.post; box.innerHTML = "";
        var art = el("article", { class: "sr-post" }, [
          el("a", { class: "sr-back", href: "#board", text: "← 게시판" }),
          el("h2", { text: p.title }),
          el("p", { class: "sr-meta", text: p.author_name + " · " + when(p.created_at) + (p.updated_at !== p.created_at ? " (수정됨)" : "") }),
          el("div", { class: "sr-body", text: p.body })
        ]);
        if (p.can_edit) art.appendChild(el("div", { class: "sr-acts" }, [
          el("a", { class: "btn line sm", href: "#edit/" + p.id, text: "수정" }),
          el("button", { class: "btn line sm", type: "button", text: "삭제", onclick: function () { if (confirm("이 글을 삭제할까요?")) api("DELETE", "/api/staff/posts/" + p.id).then(function () { location.hash = "board"; }, function (e) { alert(e.message); }); } })
        ]));
        var cl = el("ul", { class: "sr-comments" });
        d.comments.forEach(function (c) {
          cl.appendChild(el("li", {}, [el("div", { class: "sr-meta" }, [el("b", { text: c.author_name }), " · " + when(c.created_at),
            c.can_delete ? el("button", { class: "sr-del", type: "button", text: "삭제", onclick: function () { if (confirm("댓글을 삭제할까요?")) api("DELETE", "/api/staff/comments/" + c.id).then(load, function (e) { alert(e.message); }); } }) : null]),
            el("p", { text: c.body })]));
        });
        var ta = el("textarea", { rows: "3", maxlength: "2000", placeholder: "댓글을 남겨 주세요", "aria-label": "댓글" });
        var f = el("form", { class: "sr-cform" }, [ta, el("button", { class: "btn navy sm", type: "submit", text: "등록" })]);
        f.onsubmit = function (e) { e.preventDefault(); if (!ta.value.trim()) return; api("POST", "/api/staff/posts/" + id + "/comments", { body: ta.value }).then(load, function (er) { alert(er.message); }); };
        art.appendChild(el("h3", { class: "sr-ch", text: "댓글 " + d.comments.length }));
        art.appendChild(cl); art.appendChild(f);
        box.appendChild(art);
      }, err(box));
    };
    load();
  }
  function write(id) {
    var f = el("form", { class: "rc-form sr-form" }, [
      el("label", { class: "full" }, [el("span", { text: "제목" }), el("input", { name: "title", maxlength: "120", required: "" })]),
      el("label", { class: "full" }, [el("span", { text: "내용" }), el("textarea", { name: "body", rows: "14", required: "" })]),
      info.me.admin ? el("label", { class: "check full" }, [el("input", { type: "checkbox", name: "pinned" }), " 공지로 맨 위에 고정"]) : null,
      el("div", { class: "full rc-form-actions" }, [el("button", { class: "btn navy", type: "submit", text: id ? "수정 저장" : "등록" }), el("a", { class: "btn line", href: id ? "#post/" + id : "#board", text: "취소" })]),
      el("div", { class: "full rc-msg", role: "status" })
    ]);
    view.appendChild(el("h2", { class: "sr-h", text: id ? "글 수정" : "글쓰기" }));
    view.appendChild(f);
    if (id) api("GET", "/api/staff/posts/" + id).then(function (d) { f.title.value = d.post.title; f.body.value = d.post.body; if (f.pinned) f.pinned.checked = !!d.post.pinned; }, function (e) { $(".rc-msg", f).textContent = e.message; });
    f.onsubmit = function (e) {
      e.preventDefault();
      var data = { title: f.title.value, body: f.body.value, pinned: f.pinned ? f.pinned.checked : false };
      (id ? api("PUT", "/api/staff/posts/" + id, data).then(function () { return { id: id }; }) : api("POST", "/api/staff/posts", data))
        .then(function (d) { location.hash = "post/" + d.id; }, function (er) { var m = $(".rc-msg", f); m.textContent = er.message; m.className = "full rc-msg err"; });
    };
  }

  /* ── 캘린더 ── */
  var COLORS = [["navy", "기본"], ["mint", "수업"], ["orange", "행사"], ["purple", "회의"], ["red", "중요"], ["gray", "기타"]];
  function calendar(ym) {
    var now = new Date(), y = now.getFullYear(), m = now.getMonth();
    if (/^\d{4}-\d{2}$/.test(ym || "")) { y = +ym.slice(0, 4); m = +ym.slice(5) - 1; }
    var first = new Date(y, m, 1), start = new Date(y, m, 1 - first.getDay()), end = new Date(start.getTime() + 41 * 864e5);
    var key = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1); };
    var prev = key(new Date(y, m - 1, 1)), next = key(new Date(y, m + 1, 1));
    var grid = el("div", { class: "sr-cal", role: "grid", "aria-label": y + "년 " + (m + 1) + "월" });
    ["일", "월", "화", "수", "목", "금", "토"].forEach(function (d, i) { grid.appendChild(el("div", { class: "sr-dow" + (i === 0 ? " sun" : i === 6 ? " sat" : ""), text: d })); });
    var cells = {};
    for (var i = 0; i < 42; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), k = ymd(d);
      var c = el("div", { class: "sr-day" + (d.getMonth() !== m ? " out" : "") + (k === ymd(now) ? " today" : "") + (d.getDay() === 0 ? " sun" : d.getDay() === 6 ? " sat" : ""), "data-day": k }, [
        el("button", { class: "sr-dnum", type: "button", text: String(d.getDate()), "aria-label": k + " 일정 추가", onclick: (function (k) { return function () { editEvent({ start_date: k, end_date: k }); }; })(k) })
      ]);
      cells[k] = c; grid.appendChild(c);
    }
    view.appendChild(el("div", { class: "sr-bar" }, [
      el("div", { class: "sr-month" }, [el("a", { class: "sr-nav", href: "#calendar/" + prev, "aria-label": "이전 달", text: "‹" }), el("h2", { class: "sr-h", text: y + "년 " + (m + 1) + "월" }), el("a", { class: "sr-nav", href: "#calendar/" + next, "aria-label": "다음 달", text: "›" }), el("a", { class: "btn line sm", href: "#calendar", text: "오늘" })]),
      el("button", { class: "btn navy sm", type: "button", text: "일정 추가", onclick: function () { editEvent({ start_date: ymd(now), end_date: ymd(now) }); } })
    ]));
    view.appendChild(el("p", { class: "sr-tip", text: "날짜 숫자를 누르면 그날 일정을 추가할 수 있습니다." }));
    view.appendChild(grid);
    var list = el("div", { class: "sr-agenda" });
    view.appendChild(list);
    api("GET", "/api/staff/events?from=" + ymd(start) + "&to=" + ymd(end)).then(function (d) {
      var month = [];
      d.events.forEach(function (e) {
        var a = new Date(e.start_date + "T00:00:00"), b = new Date(e.end_date + "T00:00:00");
        for (var t = new Date(a); t <= b; t.setDate(t.getDate() + 1)) {
          var c = cells[ymd(t)]; if (!c) continue;
          c.appendChild(el("button", { class: "sr-ev c-" + e.color, type: "button", title: e.title, onclick: function () { editEvent(e); } }, [e.time && ymd(t) === e.start_date ? el("small", { text: e.time }) : null, e.title]));
        }
        if (e.end_date >= ymd(first) && e.start_date <= ymd(new Date(y, m + 1, 0))) month.push(e);
      });
      list.appendChild(el("h3", { class: "sr-ch", text: (m + 1) + "월 일정 " + month.length + "건" }));
      var ul = el("ul", { class: "sr-mini" });
      month.forEach(function (e) { ul.appendChild(el("li", {}, [el("button", { class: "sr-link-btn", type: "button", onclick: function () { editEvent(e); } }, [el("i", { class: "sr-dot c-" + e.color }), e.title]), el("small", { text: e.start_date.slice(5).replace("-", ".") + (e.end_date !== e.start_date ? " ~ " + e.end_date.slice(5).replace("-", ".") : "") + (e.time ? " · " + e.time : "") + " · " + e.author_name })])); });
      if (month.length) list.appendChild(ul);
    }, err(list));
  }
  function editEvent(e) {
    var dlg = el("dialog", { class: "sr-dlg", "aria-label": "일정" });
    var ro = e.id && !e.can_edit;
    var f = el("form", { class: "rc-form sr-form", method: "dialog" }, [
      el("h2", { class: "full sr-h", text: e.id ? (ro ? "일정" : "일정 수정") : "일정 추가" }),
      el("label", { class: "full" }, [el("span", { text: "제목" }), el("input", { name: "title", maxlength: "80", required: "" })]),
      el("label", {}, [el("span", { text: "시작일" }), el("input", { name: "start_date", type: "date", required: "" })]),
      el("label", {}, [el("span", { text: "종료일" }), el("input", { name: "end_date", type: "date" })]),
      el("label", {}, [el("span", { text: "시간 (비우면 종일)" }), el("input", { name: "time", type: "time" })]),
      el("label", {}, [el("span", { text: "분류" }), el("select", { name: "color" }, COLORS.map(function (c) { return el("option", { value: c[0], text: c[1] }); }))]),
      el("label", { class: "full" }, [el("span", { text: "메모" }), el("textarea", { name: "note", rows: "3", maxlength: "1000" })]),
      e.id ? el("p", { class: "full sr-meta", text: "등록: " + e.author_name }) : null,
      el("div", { class: "full rc-form-actions" }, [
        ro ? null : el("button", { class: "btn navy", type: "submit", value: "save", text: "저장" }),
        e.id && !ro ? el("button", { class: "btn line", type: "button", text: "삭제", onclick: function () { if (confirm("이 일정을 삭제할까요?")) api("DELETE", "/api/staff/events/" + e.id).then(function () { dlg.close(); route(); }, function (er) { alert(er.message); }); } }) : null,
        el("button", { class: "btn line", type: "button", text: "닫기", onclick: function () { dlg.close(); } })
      ]),
      el("div", { class: "full rc-msg", role: "status" })
    ]);
    ["title", "start_date", "end_date", "time", "color", "note"].forEach(function (k) { if (e[k] != null) f[k].value = e[k]; if (ro) f[k].disabled = true; });
    f.onsubmit = function (ev) {
      ev.preventDefault();
      var data = { title: f.title.value, start_date: f.start_date.value, end_date: f.end_date.value || f.start_date.value, time: f.time.value, color: f.color.value, note: f.note.value };
      (e.id ? api("PUT", "/api/staff/events/" + e.id, data) : api("POST", "/api/staff/events", data)).then(function () { dlg.close(); route(); }, function (er) { var m = $(".rc-msg", f); m.textContent = er.message; m.className = "full rc-msg err"; });
    };
    dlg.appendChild(f); document.body.appendChild(dlg);
    dlg.addEventListener("close", function () { dlg.remove(); });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
    dlg.showModal(); if (!ro) f.title.focus();
  }
})();
