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
      el("p", { class: "rc-note", text: "글 작성은 폭스러닝센터 관리자만 할 수 있습니다." }),
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
      if (u.must_change) { $("#rcFirst").hidden = false; $("#rcPwFold").open = true; }
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
  /* ═══ SEL 칼럼 ═══ */
  var colDate = function (d) { return (d || "").slice(0, 10).replace(/-/g, "."); };
  var isAdmin = function (u) { return u && u.role === "admin"; };

  /* 카페용 복사: 서식(HTML)과 글자를 함께 복사 → 네이버 카페 글쓰기에 붙여 넣기 */
  function copyForCafe(title, bodyMd, btn) {
    var html = "<h2>" + title.replace(/</g, "&lt;") + "</h2>" + window.renderMd(bodyMd);
    var text = title + "\n\n" + bodyMd.replace(/!\[[^\]]*\]\(([^)]*)\)/g, "$1").replace(/\*\*/g, "").replace(/^#{2,3}\s+/gm, "");
    var done = function () { var t = btn.textContent; btn.textContent = "복사했습니다 ✓"; setTimeout(function () { btn.textContent = t; }, 2000); };
    if (navigator.clipboard && window.ClipboardItem) {
      navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]).then(done, function () { navigator.clipboard.writeText(text).then(done); });
    } else if (navigator.clipboard) { navigator.clipboard.writeText(text).then(done); }
  }
  function adminTools(box, c) {
    box.innerHTML = ""; box.hidden = false;
    var edit = el("a", { class: "btn line sm", href: ROOT + "column/write/?id=" + c.id, text: "수정" });
    var copy = el("button", { class: "btn line sm", type: "button", text: "카페용 복사" });
    copy.onclick = function () { copyForCafe(c.title, c.body, copy); };
    var del = el("button", { class: "btn line sm rc-del", type: "button", text: "삭제" });
    del.onclick = function () {
      if (!confirm("이 칼럼을 삭제할까요? 되돌릴 수 없습니다.")) return;
      api("DELETE", "/api/columns/" + c.id).then(function () { location.href = ROOT + "column/"; }, function (e) { alert(e.message); });
    };
    box.appendChild(el("span", { class: "col-admin-label", text: "관리자" }));
    [edit, copy, del].forEach(function (b) { box.appendChild(b); });
  }

  /* 목록: 빌드된 카드 + 아직 빌드 안 된 새 글/임시 글(관리자) + 분류 필터 */
  var colList = $("#colList");
  if (colList) {
    var built = []; try { built = JSON.parse(colList.getAttribute("data-built") || "[]"); } catch (e) {}
    var buildFilter = function () {
      var box = $("#colFilter"), cards = [].slice.call(colList.querySelectorAll(".col-card"));
      var cats = []; cards.forEach(function (c) { var k = c.getAttribute("data-cat"); if (k && cats.indexOf(k) < 0) cats.push(k); });
      box.innerHTML = ""; if (cats.length < 2) return;
      ["전체"].concat(cats).forEach(function (k, i) {
        var b = el("button", { type: "button", text: k }); if (!i) b.setAttribute("aria-current", "true");
        b.onclick = function () {
          [].forEach.call(box.children, function (x) { x.removeAttribute("aria-current"); }); b.setAttribute("aria-current", "true");
          cards.forEach(function (c) { c.hidden = i && c.getAttribute("data-cat") !== k; });
        };
        box.appendChild(b);
      });
    };
    buildFilter();
    if (API) me().then(function (u) {
      if (isAdmin(u)) $("#colAdminBar").hidden = false;
      return api("GET", "/api/columns" + (isAdmin(u) ? "?all=1" : ""));
    }).then(function (d) {
      var add = (d.columns || []).filter(function (c) { return built.indexOf(c.id) < 0; });
      if (!add.length) return;
      var empty = colList.querySelector(".rc-empty"); if (empty) empty.remove();
      add.reverse().forEach(function (c) {
        var a = el("a", { class: "card col-card", href: ROOT + "column/view/?id=" + c.id, "data-cat": c.category || "", "data-stat": "column", "data-stat-id": String(c.id) }, [
          el("div", { class: "col-thumb" }, [c.cover ? el("img", { src: c.cover, alt: "", loading: "lazy" }) : el("span", { text: "SEL" })]),
          el("div", { class: "card-body" }, [
            el("div", { class: "col-meta" }, [c.status === "draft" ? el("span", { class: "col-draft", text: "임시 저장" }) : null, c.category ? el("span", { class: "col-cat", text: c.category }) : null, el("span", { text: colDate(c.published_at || c.created_at) })]),
            el("h2", { class: "card-title", text: c.title })
          ])
        ]);
        colList.insertBefore(a, colList.firstChild);
        if (window.foxlcStats) window.foxlcStats();
      });
      buildFilter();
    }).catch(function () {});
  }

  /* 빌드된 글 페이지: 관리자면 수정·카페용 복사·삭제 */
  var colPost = $(".col-post[data-col-id]");
  if (colPost && API) me().then(function (u) {
    if (!isAdmin(u)) return;
    api("GET", "/api/columns/" + colPost.getAttribute("data-col-id")).then(function (d) { adminTools($(".col-admin", colPost), d.column); });
  });

  /* 새 글 바로 보기 (빌드 전) */
  var colView = $("#colView");
  if (colView) {
    if (!API) return noApi(colView);
    Promise.all([api("GET", "/api/columns/" + encodeURIComponent(param("id"))), me()]).then(function (r) {
      var c = r[0].column, u = r[1];
      document.title = c.title + " | SEL 칼럼 | 폭스러닝센터";
      colView.innerHTML = "";
      if (c.category) colView.appendChild(el("span", { class: "col-cat", text: c.category }));
      colView.appendChild(el("h1", { text: c.title }));
      colView.appendChild(el("div", { class: "byline" }, [el("img", { src: ROOT + "img/mark.png", alt: "", width: "36", height: "36" }), el("div", {}, [el("b", { text: c.author_name || "폭스러닝센터" }), el("time", { text: colDate(c.published_at || c.created_at) })])]));
      var body = el("div", { class: "col-body" }); body.innerHTML = window.renderMd(c.body); colView.appendChild(body);
      var box = el("div", { class: "col-admin", hidden: "" }); colView.appendChild(box);
      if (isAdmin(u)) adminTools(box, c);
      if (c.status === "published") {   /* 좋아요 · 댓글 (react.js) */
        var rxSec = el("section", { class: "rx", "data-rx": "column", "data-rx-id": String(c.id), "aria-label": "좋아요와 댓글", hidden: "" });
        colView.appendChild(rxSec);
        if (window.foxlcRx) window.foxlcRx(rxSec);
      }
      colView.appendChild(el("div", { class: "post-nav" }, [el("span"), el("a", { class: "btn ghost sm", href: ROOT + "column/", text: "목록으로" }), el("span")]));
    }).catch(function (e) { colView.innerHTML = ""; colView.appendChild(el("p", { class: "rc-empty", text: e.message })); });
  }

  /* 쓰기 · 수정 */
  var colWrite = $("#colWrite");
  if (colWrite) {
    needAdmin(colWrite, function (u) {
      if (u.must_change) { location.href = ROOT + "admin/?first=1"; return; }
      var id = param("id");
      var f = $("#colForm").content.cloneNode(true).firstElementChild;
      colWrite.innerHTML = ""; colWrite.appendChild(f);
      var ta = f.body, pv = $(".col-preview", f), up = $(".col-up", f);
      var preview = function () { pv.innerHTML = window.renderMd(ta.value) || '<p class="col-empty">미리보기</p>'; };
      ta.addEventListener("input", preview); preview();
      var wrap = function (before, after, ph) {
        var a = ta.selectionStart, b = ta.selectionEnd, sel = ta.value.slice(a, b) || ph;
        ta.setRangeText(before + sel + after, a, b, "end"); ta.focus(); preview();
      };
      var block = function (txt) {
        var a = ta.selectionStart, v = ta.value;
        var pre = a && v[a - 1] !== "\n" ? "\n\n" : (a && v[a - 2] !== "\n" ? "\n" : "");
        ta.setRangeText(pre + txt + "\n\n", a, ta.selectionEnd, "end"); ta.focus(); preview();
      };
      [].forEach.call(f.querySelectorAll("[data-md]"), function (b) {
        b.onclick = function () {
          var k = b.getAttribute("data-md");
          if (k === "bold") wrap("**", "**", "굵은 글씨");
          if (k === "h2") block("## " + (ta.value.slice(ta.selectionStart, ta.selectionEnd) || "소제목"));
          if (k === "list") block("- 첫째 항목\n- 둘째 항목");
          if (k === "quote") block("> " + (ta.value.slice(ta.selectionStart, ta.selectionEnd) || "인용할 문장"));
          if (k.indexOf("size") === 0) resize(+k.slice(4));
          if (k === "link") { var url = prompt("연결할 주소를 넣어 주세요 (https://…)"); if (url && /^https?:\/\//.test(url)) wrap("[", "](" + url + ")", "링크 글자"); }
        };
      });
      /* 사진 크기: 커서가 있는 사진 줄(없으면 커서 앞의 가장 가까운 사진)의 끝에 50% 같은 크기를 붙인다 */
      var resize = function (pct) {
        var v = ta.value, pos = ta.selectionStart, re = /^!\[[^\]]*\]\([^)\s]+\)(?:\s*\d{1,3}%)?[ \t]*$/gm, m, hit = null, first = null;
        while ((m = re.exec(v))) {
          if (!first) first = m;
          if (m.index <= pos) hit = m; else break;
        }
        hit = hit || first;
        if (!hit) { up.textContent = "먼저 '사진 넣기'로 사진을 넣어 주세요."; return; }
        var line = hit[0].replace(/\s*\d{1,3}%[ \t]*$/, "").replace(/[ \t]+$/, "");
        var next = line + (pct < 100 ? " " + pct + "%" : "");
        ta.setRangeText(next, hit.index, hit.index + hit[0].length, "start");
        ta.selectionStart = ta.selectionEnd = hit.index + next.length; ta.focus(); preview();
        up.textContent = "사진 크기를 " + ({ 40: "작게", 65: "중간" }[pct] || "꽉 차게") + " 바꿨습니다. (커서가 있는 사진에 적용돼요)";
      };
      /* 사진: 브라우저에서 긴 변 1600px JPEG 로 줄여 올린다 */
      var shrink = function (file) {
        return new Promise(function (res, rej) {
          var img = new Image(), u = URL.createObjectURL(file);
          img.onload = function () {
            var k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
            c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
            var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
            URL.revokeObjectURL(u); c.toBlob(function (b) { b ? res(b) : rej(new Error("사진을 읽지 못했습니다.")); }, "image/jpeg", 0.84);
          };
          img.onerror = function () { rej(new Error("사진을 읽지 못했습니다.")); }; img.src = u;
        });
      };
      var upload = function (blob) {
        return fetch(API + "/api/images", { method: "POST", headers: { "Content-Type": "image/jpeg", Authorization: "Bearer " + getToken() }, body: blob })
          .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "업로드 실패"); return d.url; }); });
      };
      $(".col-photo input", f).onchange = function (e) {
        var files = [].slice.call(e.target.files || []); e.target.value = "";
        var n = 0, chain = Promise.resolve();
        files.forEach(function (file) {
          chain = chain.then(function () { up.textContent = "사진 올리는 중… (" + (++n) + "/" + files.length + ")"; return shrink(file); })
            .then(upload).then(function (url) { block("![](" + url + ")"); });
        });
        chain.then(function () { up.textContent = files.length ? "사진 " + files.length + "장을 넣었습니다. 사진 설명은 ![ ] 괄호 안에 쓸 수 있어요." : ""; }, function (err) { up.textContent = err.message; });
      };
      if (id) api("GET", "/api/columns/" + encodeURIComponent(id)).then(function (d) {
        var c = d.column; var h1 = $(".page-head h1"); if (h1) h1.textContent = "SEL 칼럼 수정";
        f.title.value = c.title; f.category.value = c.category || ""; f.status.value = c.status; ta.value = c.body; preview();
      }, function (e) { msg($(".rc-msg", f), e.message, true); });
      f.onsubmit = function (e) {
        e.preventDefault();
        var data = { title: f.title.value, category: f.category.value, status: f.status.value, body: ta.value };
        var m = $(".rc-msg", f); msg(m, "저장 중입니다…"); $("button[type=submit]", f).disabled = true;
        (id ? api("PUT", "/api/columns/" + id, data).then(function () { return { id: id }; }) : api("POST", "/api/columns", data))
          .then(function (d) { location.href = ROOT + "column/view/?id=" + d.id; })
          .catch(function (err) { msg(m, err.message, true); $("button[type=submit]", f).disabled = false; });
      };
    });
  }
})();
