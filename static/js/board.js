/* 채용공고 · 관리자 화면 (API: worker/ 의 Cloudflare Worker)
   API 주소는 <meta name="foxlc-api"> 에서 읽는다. 로그인 토큰은 이 브라우저의 localStorage 에만 둔다. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var API = (document.querySelector('meta[name="foxlc-api"]') || {}).content || "";
  var ROOT = (document.querySelector('meta[name="foxlc-root"]') || {}).content || "./";
  var KEY = "foxlc_token";
  var getToken = function () { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } };
  var setToken = function (t) { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) {} };

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
  var day = function (s) { return (s || "").slice(0, 10).replace(/-/g, "."); };
  var param = function (k) { var m = new RegExp("[?&]" + k + "=([^&]+)").exec(location.search); return m ? decodeURIComponent(m[1]) : ""; };
  var isClosed = function (p) {
    if (p.status === "closed") return true;
    if (!p.deadline) return false;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(p.deadline + "T23:59:59") < today;
  };
  var badge = function (p) { return el("span", { class: "rc-badge" + (isClosed(p) ? " closed" : ""), text: isClosed(p) ? "마감" : "모집중" }); };
  var msg = function (box, text, err) { box.textContent = text; box.className = "rc-msg" + (err ? " err" : ""); };
  function noApi(box) {
    box.innerHTML = "";
    box.appendChild(el("p", { class: "rc-empty", text: "채용공고 게시판을 준비하고 있습니다. 문의: 1433-2700" }));
  }
  function me() { return getToken() ? api("GET", "/api/auth/me").then(function (d) { return d.user; }, function () { return null; }) : Promise.resolve(null); }

  /* ── 목록 ── */
  var list = $("#rcList");
  if (list) {
    if (!API) return noApi(list);
    me().then(function (u) { if (u && u.role === "admin") $("#rcAdminBar").hidden = false; });
    api("GET", "/api/recruit").then(function (d) {
      var posts = d.posts || [], per = 10, pager = $("#rcPager");
      list.innerHTML = "";
      if (!posts.length) { list.appendChild(el("p", { class: "rc-empty", text: "현재 등록된 채용공고가 없습니다." })); return; }
      var table = el("table", { class: "rc-table" }, [
        el("thead", {}, [el("tr", {}, ["번호", "구분", "제목", "마감일", "등록일", "조회"].map(function (t, i) {
          return el("th", { scope: "col", class: ["c-no", "c-st", "c-title", "c-dl", "c-date", "c-views"][i], text: t });
        }))]),
        el("tbody")
      ]);
      list.appendChild(table);
      var tbody = $("tbody", table);
      var show = function (p) {
        tbody.innerHTML = "";
        posts.slice((p - 1) * per, p * per).forEach(function (post, i) {
          var a = el("a", { href: ROOT + "recruit/view/?id=" + post.id, text: post.title });
          var meta = [post.category, post.employment].filter(Boolean).join(" · ");
          tbody.appendChild(el("tr", {}, [
            el("td", { class: "c-no", text: String(posts.length - ((p - 1) * per + i)) }),
            el("td", { class: "c-st" }, [badge(post)]),
            el("td", { class: "c-title" }, [a, meta ? el("small", { text: meta }) : null]),
            el("td", { class: "c-dl", text: post.deadline ? day(post.deadline) : "상시" }),
            el("td", { class: "c-date", text: day(post.created_at) }),
            el("td", { class: "c-views", text: String(post.views) })
          ]));
        });
        pager.innerHTML = "";
        var pages = Math.ceil(posts.length / per);
        if (pages > 1) for (var n = 1; n <= pages; n++) (function (n) {
          var b = el("button", { type: "button", text: String(n) });
          if (n === p) b.setAttribute("aria-current", "page");
          b.onclick = function () { show(n); };
          pager.appendChild(b);
        })(n);
      };
      show(1);
    }).catch(function (e) { list.innerHTML = ""; list.appendChild(el("p", { class: "rc-empty", text: "채용공고를 불러오지 못했습니다. (" + e.message + ")" })); });
  }

  /* ── 보기 ── */
  var view = $("#rcView");
  if (view) {
    if (!API) return noApi(view);
    var id = param("id");
    Promise.all([api("GET", "/api/recruit/" + encodeURIComponent(id)), me()]).then(function (r) {
      var p = r[0].post, u = r[1];
      document.title = p.title + " | 채용공고 | 폭스러닝센터";
      view.innerHTML = "";
      var facts = el("dl", { class: "rc-facts" });
      [["구분", p.category], ["근무 형태", p.employment], ["마감일", p.deadline ? day(p.deadline) : "상시 채용"], ["등록일", day(p.created_at)]].forEach(function (f) {
        if (f[1]) { facts.appendChild(el("dt", { text: f[0] })); facts.appendChild(el("dd", { text: f[1] })); }
      });
      view.appendChild(el("div", { class: "rc-head" }, [badge(p), el("h1", { text: p.title }), facts]));
      view.appendChild(el("div", { class: "rc-body", text: p.body }));   /* textContent: 입력한 그대로 (HTML 해석 안 함) */
      var actions = el("div", { class: "rc-actions" }, [el("a", { class: "btn ghost sm", href: ROOT + "recruit/", text: "목록으로" })]);
      if (u && u.role === "admin") {
        actions.appendChild(el("a", { class: "btn line sm", href: ROOT + "recruit/write/?id=" + p.id, text: "수정" }));
        var del = el("button", { class: "btn line sm rc-del", type: "button", text: "삭제" });
        del.onclick = function () {
          if (!confirm("이 채용공고를 삭제할까요? 되돌릴 수 없습니다.")) return;
          api("DELETE", "/api/recruit/" + p.id).then(function () { location.href = ROOT + "recruit/"; }, function (e) { alert(e.message); });
        };
        actions.appendChild(del);
      }
      view.appendChild(actions);
    }).catch(function (e) { view.innerHTML = ""; view.appendChild(el("p", { class: "rc-empty", text: e.message })); });
  }

  /* ── 로그인 상자 (쓰기 · 관리자 화면 공통) ── */
  function loginBox(target, done) {
    target.innerHTML = "";
    var f = el("form", { class: "rc-login" }, [
      el("h2", { text: "관리자 로그인" }),
      el("p", { class: "rc-note", text: "채용공고 작성은 폭스러닝센터 관리자만 할 수 있습니다." }),
      el("label", {}, ["아이디", el("input", { name: "username", autocomplete: "username", required: "" })]),
      el("label", {}, ["비밀번호", el("input", { name: "password", type: "password", autocomplete: "current-password", required: "" })]),
      el("button", { class: "btn navy", type: "submit", text: "로그인" }),
      el("div", { class: "rc-msg", role: "status" })
    ]);
    f.onsubmit = function (e) {
      e.preventDefault();
      var m = $(".rc-msg", f); msg(m, "확인 중입니다…");
      api("POST", "/api/auth/login", { username: f.username.value, password: f.password.value }).then(function (d) {
        setToken(d.token); done(d.user);
      }, function (err) { msg(m, err.message, true); });
    };
    target.appendChild(f);
  }
  function needAdmin(target, then) {
    if (!API) return noApi(target);
    me().then(function (u) {
      if (u && u.role === "admin") return then(u);
      if (u) { target.innerHTML = ""; target.appendChild(el("p", { class: "rc-empty", text: "관리자 계정만 사용할 수 있습니다." })); return; }
      loginBox(target, function (user) {
        if (user.role !== "admin") { target.innerHTML = ""; target.appendChild(el("p", { class: "rc-empty", text: "관리자 계정만 사용할 수 있습니다." })); return; }
        then(user);
      });
    });
  }

  /* ── 쓰기 · 수정 ── */
  var write = $("#rcWrite");
  if (write) {
    needAdmin(write, function (u) {
      if (u.must_change) { location.href = ROOT + "admin/?first=1"; return; }
      var id = param("id");
      var f = $("#rcForm").content.cloneNode(true).firstElementChild;
      write.innerHTML = ""; write.appendChild(f);
      var always = f.always, dl = f.deadline;
      always.onchange = function () { dl.disabled = always.checked; if (always.checked) dl.value = ""; };
      var fill = id ? api("GET", "/api/recruit/" + encodeURIComponent(id)).then(function (d) {
        var p = d.post; var h1 = $(".page-head h1"); if (h1) h1.textContent = "채용공고 수정";
        f.title.value = p.title; f.category.value = p.category; f.employment.value = p.employment;
        f.body.value = p.body; f.status.value = p.status;
        if (p.deadline) dl.value = p.deadline; else { always.checked = true; dl.disabled = true; }
      }) : Promise.resolve();
      fill.catch(function (e) { msg($(".rc-msg", f), e.message, true); });
      f.onsubmit = function (e) {
        e.preventDefault();
        var data = { title: f.title.value, category: f.category.value, employment: f.employment.value,
          deadline: always.checked ? "" : dl.value, status: f.status.value, body: f.body.value };
        var m = $(".rc-msg", f); msg(m, "저장 중입니다…");
        $("button[type=submit]", f).disabled = true;
        (id ? api("PUT", "/api/recruit/" + id, data).then(function () { return { id: id }; }) : api("POST", "/api/recruit", data))
          .then(function (d) { location.href = ROOT + "recruit/view/?id=" + d.id; })
          .catch(function (err) { msg(m, err.message, true); $("button[type=submit]", f).disabled = false; });
      };
    });
  }

  /* ── 관리자 화면: 비밀번호 변경 · 관리자 추가 · 로그아웃 ── */
  var admin = $("#rcAdmin");
  if (admin) {
    needAdmin(admin, function (u) {
      var tpl = $("#rcAdminTpl").content.cloneNode(true);
      admin.innerHTML = ""; admin.appendChild(tpl);
      $("#rcWho").textContent = (u.name ? u.name + " · " : "") + u.username;
      if (u.must_change) $("#rcFirst").hidden = false;
      var pw = $("#rcPw");
      pw.onsubmit = function (e) {
        e.preventDefault();
        var m = $(".rc-msg", pw);
        if (pw.next.value !== pw.next2.value) return msg(m, "새 비밀번호가 서로 다릅니다.", true);
        api("POST", "/api/auth/password", { current: pw.current.value, next: pw.next.value }).then(function () {
          pw.reset(); $("#rcFirst").hidden = true; msg(m, "비밀번호를 바꿨습니다.");
        }, function (err) { msg(m, err.message, true); });
      };
      var users = $("#rcUsers");
      var loadUsers = function () {
        api("GET", "/api/admin/users").then(function (d) {
          users.innerHTML = "";
          d.users.forEach(function (x) { users.appendChild(el("li", {}, [el("b", { text: x.username }), " " + (x.name || "") + " · " + (x.role === "admin" ? "관리자" : "회원")])); });
        });
      };
      loadUsers();
      var add = $("#rcAdd");
      add.onsubmit = function (e) {
        e.preventDefault();
        var m = $(".rc-msg", add);
        api("POST", "/api/admin/users", { username: add.username.value, name: add.name.value, password: add.password.value, role: "admin" }).then(function () {
          msg(m, "관리자 '" + add.username.value + "' 계정을 만들었습니다. 첫 로그인 때 비밀번호를 바꾸도록 안내해 주세요.");
          add.reset(); loadUsers();
        }, function (err) { msg(m, err.message, true); });
      };
      $("#rcLogout").onclick = function () { setToken(""); location.href = ROOT + "recruit/"; };
    });
  }
})();
