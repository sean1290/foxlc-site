/* 회원(학부모 · 직원): 로그인 · 가입 신청 · 폭스뉴스 본문 보기 · (관리자) 회원 승인
   API 주소는 <meta name="foxlc-api"> 에서 읽고, 로그인 토큰은 board.js 와 같은 localStorage 칸을 쓴다. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var API = (document.querySelector('meta[name="foxlc-api"]') || {}).content || "";
  var ROOT = (document.querySelector('meta[name="foxlc-root"]') || {}).content || "./";
  var KEY = "foxlc_token";
  var getToken = function () { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } };
  var setToken = function (t) { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) {} };
  if (!API) return;

  function api(method, path, data) {
    var h = { "Content-Type": "application/json" };
    var t = getToken(); if (t) h.Authorization = "Bearer " + t;
    return fetch(API + path, { method: method, headers: h, body: data ? JSON.stringify(data) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (r.status === 401 && t) setToken("");
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
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  var msg = function (box, text, err) { box.textContent = text; box.className = "rc-msg" + (err ? " err" : ""); };
  var param = function (k) { var m = new RegExp("[?&]" + k + "=([^&]+)").exec(location.search); return m ? decodeURIComponent(m[1]) : ""; };
  var me = function () { return getToken() ? api("GET", "/api/auth/me").then(function (d) { return d.user; }, function () { return null; }) : Promise.resolve(null); };
  var canRead = function (u) { return u && (u.role === "admin" || (u.role === "member" && u.status === "approved")); };
  var phoneFmt = function (p) { p = String(p || ""); return p.length === 11 ? p.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3") : p.length === 10 ? p.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3") : p; };
  /* 상단 로그인 버튼도 바로 바꾼다 (site.js 와 같은 모양) */
  var headWho = function (u) {
    var btn = $(".nav-login"); if (!btn) return;
    try { u ? sessionStorage.setItem("foxlc_me", JSON.stringify({ t: getToken().slice(-16), u: { name: u.name, username: u.username } })) : sessionStorage.removeItem("foxlc_me"); } catch (e) {}
    btn.textContent = ""; btn.classList.toggle("in", !!u);
    if (!u) { btn.textContent = "로그인"; return; }
    var sp = document.createElement("span"); btn.appendChild(sp); sp.appendChild(document.createTextNode("안녕하세요, "));
    var b = document.createElement("b"); b.textContent = u.name || u.username; sp.appendChild(b);
    sp.appendChild(document.createTextNode("님"));
  };
  var safeNext = function (n) { return /^[a-z0-9\/_-]*$/i.test(n || "") ? n : ""; };

  /* ── 폭스뉴스 목록: 로그인한 학부모에게는 안내를 바꾼다 ── */
  var note = $("#mbNote");
  if (note) me().then(function (u) {
    if (!canRead(u)) return;
    note.classList.add("ok");
    note.innerHTML = "";
    note.appendChild(el("span", { class: "mb-lock open", "aria-hidden": "true" }));
    note.appendChild(el("p", {}, [el("b", { text: (u.name || u.username) + "님, " }), "회원으로 로그인되어 있습니다. 글을 누르면 본문과 사진을 볼 수 있습니다."]));
  });

  /* ── 폭스뉴스 글: 승인된 학부모에게만 본문 · 사진 ── */
  var box = $("#mbNews");
  if (box) me().then(function (u) {
    var gate = $(".mb-gate", box);
    if (u && u.role === "member" && u.status === "pending") {
      $("h2", gate).textContent = "가입 승인을 기다리고 있습니다";
      $("p", gate).textContent = "센터에서 확인 후 승인해 드립니다. 승인되면 이 글의 본문과 사진을 볼 수 있습니다. 문의: 1433-2700";
      $(".mb-gate-act", gate).innerHTML = "";
      return;
    }
    if (!canRead(u)) return;
    $("h2", gate).textContent = "본문을 불러오는 중입니다…"; $("p", gate).textContent = ""; $(".mb-gate-act", gate).innerHTML = "";
    var num = box.getAttribute("data-num");
    api("GET", "/api/news/" + num).then(function (d) {
      var n = d.news, body = el("div", { class: "mb-body" });
      if (n.before) body.appendChild(el("p", { text: n.before }));
      for (var i = 0; i < n.photos; i++) (function (i) {
        var fig = el("figure", { class: "mb-photo loading" });
        var img = el("img", { alt: n.title + " 사진 " + (i + 1) });
        fig.appendChild(img); body.appendChild(fig);
        fetch(API + "/api/news/" + num + "/photo/" + i, { headers: { Authorization: "Bearer " + getToken() } })
          .then(function (r) { if (!r.ok) throw 0; return r.blob(); })
          .then(function (b) { img.src = URL.createObjectURL(b); fig.classList.remove("loading"); })
          .catch(function () { fig.remove(); });
      })(i);
      (n.after || []).forEach(function (t) { body.appendChild(el("p", { text: t })); });
      box.innerHTML = ""; box.appendChild(body);
    }).catch(function (e) {
      $("h2", gate).textContent = "본문을 불러오지 못했습니다"; $("p", gate).textContent = e.message;
    });
  });

  /* ── 학부모 로그인 화면 ── */
  var home = $("#mbHome");
  if (home) {
    var next = safeNext(param("next"));
    var loginForm = function () {
      home.innerHTML = "";
      var f = el("form", { class: "rc-form mb-login" }, [
        el("label", { class: "full" }, [el("span", { text: "아이디" }), el("input", { name: "username", autocomplete: "username", required: "" })]),
        el("label", { class: "full" }, [el("span", { text: "비밀번호" }), el("input", { name: "password", type: "password", autocomplete: "current-password", required: "" })]),
        el("div", { class: "full rc-form-actions" }, [el("button", { class: "btn navy", type: "submit", text: "로그인" }), el("a", { class: "btn line", href: ROOT + "member/join/", text: "회원가입 신청" })]),
        el("div", { class: "full rc-msg", role: "status" }),
        el("p", { class: "full mb-help", text: "비밀번호를 잊으셨다면 센터(1433-2700 · 카카오톡 FOX_LC)로 연락해 주세요. 임시 비밀번호를 알려 드립니다." })
      ]);
      f.onsubmit = function (e) {
        e.preventDefault();
        var m = $(".rc-msg", f); msg(m, "로그인 중입니다…");
        api("POST", "/api/auth/login", { username: f.username.value, password: f.password.value }).then(function (d) {
          setToken(d.token); headWho(d.user);
          if (next && canRead(d.user) && !d.user.must_change) { location.href = ROOT + next; return; }
          show(d.user);
        }, function (err) { msg(m, err.message, true); });
      };
      home.appendChild(f);
    };
    var show = function (u) {
      home.innerHTML = "";
      if (u.role === "admin") {
        home.appendChild(el("p", { class: "mb-status ok" }, ["관리자 계정(", el("b", { text: u.username }), ")으로 로그인되어 있습니다. 회원 승인은 ", el("a", { href: ROOT + "admin/", text: "관리자 화면" }), "에서 할 수 있습니다."]));
      } else {
        var st = { pending: ["승인 대기", "센터에서 확인 후 승인해 드립니다. 승인되면 폭스뉴스 본문과 사진을 볼 수 있습니다."], approved: ["승인 완료", "폭스뉴스의 모든 글을 볼 수 있습니다."] }[u.status] || ["확인 필요", "센터로 문의해 주세요."];
        home.appendChild(el("div", { class: "mb-status " + (u.status === "approved" ? "ok" : "wait") }, [
          el("span", { class: "mb-badge", text: st[0] }),
          el("p", {}, [el("b", { text: (u.name || u.username) + "님" }), " (" + (u.kind === "staff" ? "직원" : "학부모") + " · " + u.username + ") · " + st[1]])
        ]));
      }
      var acts = el("div", { class: "rc-form-actions mb-acts" });
      if (canRead(u)) acts.appendChild(el("a", { class: "btn navy", href: ROOT + "news/", text: "폭스뉴스 보기" }));
      var out = el("button", { class: "btn line", type: "button", text: "로그아웃" });
      out.onclick = function () { setToken(""); headWho(null); loginForm(); };
      acts.appendChild(out);
      home.appendChild(acts);

      /* 비밀번호 변경 (관리자가 임시 비밀번호를 준 경우 먼저) */
      var pw = el("form", { class: "rc-form mb-pw" }, [
        el("h2", { class: "full", text: u.must_change ? "임시 비밀번호를 새 비밀번호로 바꿔 주세요" : "비밀번호 변경" }),
        el("label", {}, [el("span", { text: "현재 비밀번호" }), el("input", { name: "current", type: "password", autocomplete: "current-password", required: "" })]),
        el("label", {}, [el("span", { text: "새 비밀번호 (8자 이상)" }), el("input", { name: "next", type: "password", autocomplete: "new-password", minlength: "8", required: "" })]),
        el("div", { class: "full rc-form-actions" }, [el("button", { class: "btn navy sm", type: "submit", text: "변경" })]),
        el("div", { class: "full rc-msg", role: "status" })
      ]);
      pw.onsubmit = function (e) {
        e.preventDefault();
        var m = $(".rc-msg", pw);
        api("POST", "/api/auth/password", { current: pw.current.value, next: pw.next.value }).then(function () { msg(m, "비밀번호를 바꿨습니다."); pw.reset(); }, function (err) { msg(m, err.message, true); });
      };
      var pwWrap = u.must_change ? pw : el("details", { class: "mb-more" }, [el("summary", { text: "비밀번호 변경" }), pw]);
      home.appendChild(pwWrap);

      if (u.role === "member") {
        var del = el("form", { class: "rc-form mb-del" }, [
          el("p", { class: "full", text: "탈퇴하면 회원 정보가 바로 삭제되며 되돌릴 수 없습니다." }),
          el("label", { class: "full" }, [el("span", { text: "비밀번호 확인" }), el("input", { name: "password", type: "password", autocomplete: "current-password", required: "" })]),
          el("div", { class: "full rc-form-actions" }, [el("button", { class: "btn line sm", type: "submit", text: "회원 탈퇴" })]),
          el("div", { class: "full rc-msg", role: "status" })
        ]);
        del.onsubmit = function (e) {
          e.preventDefault();
          if (!confirm("정말 탈퇴할까요? 회원 정보가 삭제됩니다.")) return;
          api("DELETE", "/api/members/me", { password: del.password.value }).then(function () { setToken(""); headWho(null); home.innerHTML = ""; home.appendChild(el("p", { class: "mb-status", text: "탈퇴 처리되었습니다. 그동안 이용해 주셔서 감사합니다." })); },
            function (err) { msg($(".rc-msg", del), err.message, true); });
        };
        home.appendChild(el("details", { class: "mb-more" }, [el("summary", { text: "회원 탈퇴" }), del]));
      }
    };
    me().then(function (u) { u ? show(u) : loginForm(); });
  }

  /* ── 가입 신청 ── */
  var join = $("#mbJoin");
  if (join) {
    var kindOf = function () { var r = join.querySelector("input[name=kind]:checked"); return r ? r.value : "parent"; };
    var syncKind = function () {
      var staff = kindOf() === "staff";
      $(".mb-f-parent", join).hidden = staff; $(".mb-f-staff", join).hidden = !staff;
      $(".mb-name-l", join).innerHTML = (staff ? "이름" : "보호자 이름") + " <i>*</i>";
    };
    [].forEach.call(join.querySelectorAll("input[name=kind]"), function (r) { r.addEventListener("change", syncKind); });
    syncKind();
    join.phone.addEventListener("input", function () {
      var d = join.phone.value.replace(/\D/g, "").slice(0, 11);
      join.phone.value = d.length > 7 ? d.replace(/(\d{3})(\d{3,4})(\d{0,4})/, function (_, a, b, c) { return a + "-" + b + (c ? "-" + c : ""); }) : d.length > 3 ? d.slice(0, 3) + "-" + d.slice(3) : d;
    });
    join.onsubmit = function (e) {
      e.preventDefault();
      var m = $(".rc-msg", join), f = join;
      if (!/^[a-z0-9._-]{4,30}$/.test(f.username.value.trim().toLowerCase())) return msg(m, "아이디는 영문 소문자·숫자·._- 4~30자로 정해 주세요.", true);
      if (f.password.value.length < 8) return msg(m, "비밀번호는 8자 이상이어야 합니다.", true);
      if (f.password.value !== f.password2.value) return msg(m, "비밀번호 확인이 일치하지 않습니다.", true);
      var kind = kindOf();
      if (!f.name.value.trim()) return msg(m, kind === "staff" ? "이름을 입력해 주세요." : "보호자 이름을 입력해 주세요.", true);
      if (kind === "parent" && !f.child.value.trim()) return msg(m, "자녀 이름을 입력해 주세요.", true);
      if (kind === "staff" && !f.dept.value.trim()) return msg(m, "소속·담당을 입력해 주세요.", true);
      if (!/^0\d{8,10}$/.test(f.phone.value.replace(/\D/g, ""))) return msg(m, "연락처를 정확히 입력해 주세요.", true);
      if (!f.consent.checked) return msg(m, "개인정보 수집·이용에 동의해 주세요.", true);
      msg(m, "신청하는 중입니다…"); $("button[type=submit]", f).disabled = true;
      api("POST", "/api/members/signup", {
        username: f.username.value.trim().toLowerCase(), password: f.password.value, name: f.name.value, phone: f.phone.value,
        kind: kind, child: f.child.value, dept: f.dept.value, consent: true, website: f.website.value
      }).then(function () {
        var done = el("div", { class: "mb-box mb-done" }, [
          el("span", { class: "mb-lock open", "aria-hidden": "true" }),
          el("h2", { text: "가입 신청이 접수되었습니다" }),
          el("p", { text: "센터에서 확인 후 승인해 드립니다. 승인되면 폭스뉴스의 본문과 활동 사진을 볼 수 있습니다. 빠른 승인을 원하시면 센터(1433-2700)로 알려 주세요." }),
          el("a", { class: "btn navy", href: ROOT + "member/", text: "로그인 화면으로" })
        ]);
        f.replaceWith(done);
      }, function (err) { msg(m, err.message, true); $("button[type=submit]", f).disabled = false; });
    };
  }

  /* ── 관리자: 회원(학부모 · 직원) 승인 ── */
  var adm = $("#mbAdmin");
  if (adm) {
    var listBox = $("#mbList", adm), count = $("#mbCount", adm), tabs = $("#mbTabs", adm), started = false, filter = "all", all = [];
    var row = function (m) {
      var st = { pending: "승인 대기", approved: "승인", rejected: "거절" }[m.status] || m.status;
      var acts = el("div", { class: "mb-row-act" });
      var act = function (label, path, method, confirmText, cls) {
        var b = el("button", { class: "btn sm " + (cls || "line"), type: "button", text: label });
        b.onclick = function () {
          if (confirmText && !confirm(confirmText)) return;
          b.disabled = true;
          api(method || "POST", "/api/admin/members/" + m.id + path).then(function (d) {
            if (d.password) prompt(m.name + "님 임시 비밀번호입니다. 전달 후 첫 로그인 때 바꾸도록 안내해 주세요.", d.password);
            load();
          }, function (e) { alert(e.message); b.disabled = false; });
        };
        acts.appendChild(b);
      };
      if (m.status !== "approved") act("승인", "/approve", "POST", null, "navy");
      if (m.status === "pending") act("거절", "/reject", "POST", m.name + "님의 가입 신청을 거절할까요?");
      if (m.status === "approved") act("임시 비밀번호", "/reset", "POST", m.name + "님의 비밀번호를 임시 비밀번호로 바꿀까요?");
      if (m.status === "approved" && m.kind === "staff") act("관리자 지정", "/promote", "POST", m.name + "님에게 관리자 권한(SEL 칼럼·채용공고 글쓰기, 회원 승인)을 줄까요?\n관리자 목록으로 옮겨집니다.");
      act("삭제", "", "DELETE", m.name + "님 회원 정보를 삭제할까요? 되돌릴 수 없습니다.");
      return el("li", { class: "mb-row " + m.status }, [
        el("span", { class: "mb-badge", text: st }),
        el("span", { class: "mb-kind-b " + (m.kind === "staff" ? "is-staff" : "is-parent"), text: m.kind === "staff" ? "직원" : "학부모" }),
        el("div", { class: "mb-row-info" }, [
          el("b", { text: m.name }), el("span", { text: " · " + phoneFmt(m.phone) + " · 아이디 " + m.username }),
          el("small", { text: (m.kind === "staff" ? "소속: " + m.dept : "자녀: " + m.child) + " · 신청 " + (m.created_at || "").slice(0, 16) })
        ]),
        acts
      ]);
    };
    var load = function () {
      api("GET", "/api/admin/members").then(function (d) {
        all = d.members || [];
        var pending = all.filter(function (x) { return x.status === "pending"; }).length;
        count.textContent = pending ? "승인 대기 " + pending + "명" : "";
        render();
      }, function (e) { listBox.innerHTML = ""; listBox.appendChild(el("p", { class: "rc-empty", text: e.message })); });
    };
    var render = function () {
      var n = function (k) { return all.filter(function (x) { return k === "all" || x.kind === k; }).length; };
      tabs.innerHTML = "";
      [["all", "전체"], ["parent", "학부모"], ["staff", "직원"]].forEach(function (t) {
        var b = el("button", { type: "button", role: "tab", "aria-selected": String(filter === t[0]), text: t[1] + " " + n(t[0]) });
        b.onclick = function () { filter = t[0]; render(); };
        tabs.appendChild(b);
      });
      var ms = all.filter(function (x) { return filter === "all" || x.kind === filter; });
      listBox.innerHTML = "";
      if (!ms.length) { listBox.appendChild(el("p", { class: "rc-empty", text: "아직 가입 신청이 없습니다." })); return; }
      var ul = el("ul", { class: "mb-rows" });
      ms.forEach(function (m) { ul.appendChild(row(m)); });
      listBox.appendChild(ul);
    };
    var check = function () {
      if (started) return;
      me().then(function (u) {
        if (u && u.role === "admin" && !u.must_change) { started = true; adm.hidden = false; load(); }
        else setTimeout(check, 1500);
      });
    };
    check();
  }
})();
