/* 좋아요 · 댓글: 폭스뉴스 · SEL 칼럼 · 폭스 소식 글 아래 <section class="rx" data-rx="종류" data-rx-id="번호"> 에 그린다.
   읽기: 폭스뉴스는 승인된 회원만, SEL 칼럼 · 폭스 소식은 누구나.
   쓰기(좋아요 · 댓글): 승인된 회원과 관리자. 로그인 토큰은 board.js · member.js 와 같은 localStorage 칸을 쓴다. */
(function () {
  "use strict";
  var API = (document.querySelector('meta[name="foxlc-api"]') || {}).content || "";
  var ROOT = (document.querySelector('meta[name="foxlc-root"]') || {}).content || "./";
  var KEY = "foxlc_token";
  var MAX = 500;
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
  /* DB 시각(UTC) → 한국 시간 2026.11.24 13:05 */
  function when(s) {
    var d = new Date(String(s).replace(" ", "T") + "Z");
    if (isNaN(d)) return "";
    var k = new Date(d.getTime() + 9 * 3600 * 1000), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return k.getUTCFullYear() + "." + p(k.getUTCMonth() + 1) + "." + p(k.getUTCDate()) + " " + p(k.getUTCHours()) + ":" + p(k.getUTCMinutes());
  }
  /* 로그인 후 이 글로 돌아오기 */
  function loginHref() {
    var base = new URL(ROOT, location.href).pathname;
    var next = location.pathname.indexOf(base) === 0 ? location.pathname.slice(base.length) : "";
    return ROOT + "member/" + (/^[a-z0-9\/_-]+$/i.test(next) ? "?next=" + next : "");
  }

  function mount(box) {
    if (!box || box.getAttribute("data-rx-ready") || !API) return;
    box.setAttribute("data-rx-ready", "1");
    var kind = box.getAttribute("data-rx"), id = box.getAttribute("data-rx-id");
    var path = "/api/rx/" + kind + "/" + encodeURIComponent(id);
    /* 조회수: 같은 브라우저에서는 12시간에 한 번만 센다 */
    (function () {
      var k = "foxlc_v_" + kind + "_" + id, last = 0;
      try { last = Number(localStorage.getItem(k) || 0); } catch (e) {}
      if (Date.now() - last < 12 * 3600 * 1000) return;
      try { localStorage.setItem(k, String(Date.now())); } catch (e) {}
      fetch(API + path + "/view", { method: "POST" }).catch(function () {});
    })();
    var state = null, busy = false;

    var likeBtn = el("button", { class: "rx-like", type: "button", "aria-pressed": "false" });
    var count = el("span", { class: "rx-count" });
    var note = el("p", { class: "rx-note", role: "status", hidden: "" });
    var list = el("ol", { class: "rx-list" });
    var form = el("form", { class: "rx-form", hidden: "" });
    var ta = el("textarea", { name: "body", rows: "3", maxlength: String(MAX), placeholder: "댓글을 남겨 주세요", "aria-label": "댓글 내용" });
    var left = el("span", { class: "rx-left", text: "0 / " + MAX });
    var send = el("button", { class: "btn navy sm", type: "submit", text: "등록" });
    form.appendChild(ta);
    form.appendChild(el("div", { class: "rx-form-foot" }, [left, send]));
    var guest = el("p", { class: "rx-guest", hidden: "" });

    box.innerHTML = "";
    box.appendChild(el("h2", { class: "sr", text: "좋아요와 댓글" }));
    box.appendChild(el("div", { class: "rx-bar" }, [likeBtn, count]));
    box.appendChild(note);
    box.appendChild(list);
    box.appendChild(form);
    box.appendChild(guest);

    var say = function (t, err) { note.textContent = t || ""; note.hidden = !t; note.classList.toggle("err", !!err); };
    function drawLike() {
      likeBtn.textContent = "";
      likeBtn.appendChild(el("span", { class: "rx-heart", "aria-hidden": "true", text: state.liked ? "♥" : "♡" }));
      likeBtn.appendChild(document.createTextNode(" 좋아요 " + state.likes));
      likeBtn.setAttribute("aria-pressed", state.liked ? "true" : "false");
      likeBtn.classList.toggle("on", !!state.liked);
    }
    function draw() {
      drawLike();
      count.textContent = "댓글 " + state.comments.length;
      list.innerHTML = "";
      state.comments.forEach(function (c) {
        var head = el("div", { class: "rx-head" }, [
          el("b", { text: c.name }),
          c.staff ? el("span", { class: "rx-staff", text: "폭스러닝센터" }) : null,
          el("time", { text: when(c.created_at) }),
        ]);
        if (c.can_delete) {
          var del = el("button", { class: "rx-del", type: "button", text: "삭제", "aria-label": "댓글 삭제" });
          del.addEventListener("click", function () {
            if (!window.confirm("이 댓글을 지울까요?")) return;
            api("DELETE", "/api/rx/comments/" + c.id).then(load, function (e) { say(e.message, true); });
          });
          head.appendChild(del);
        }
        list.appendChild(el("li", { class: "rx-item" + (c.mine ? " mine" : "") }, [head, el("p", { class: "rx-body", text: c.body })]));
      });
      list.hidden = !state.comments.length;
      form.hidden = !state.can_write;
      guest.hidden = !!state.can_write;
      if (!state.can_write) {
        guest.innerHTML = "";
        if (getToken()) guest.appendChild(document.createTextNode("가입이 승인되면 좋아요와 댓글을 남길 수 있습니다."));
        else {
          guest.appendChild(el("a", { href: loginHref(), text: "로그인" }));
          guest.appendChild(document.createTextNode("하면 좋아요와 댓글을 남길 수 있습니다. 회원은 센터에서 승인한 학부모·직원입니다."));
        }
      }
      box.hidden = false;
    }
    function load() {
      return api("GET", path).then(function (d) { state = d; draw(); }, function () { box.hidden = true; });
    }

    likeBtn.addEventListener("click", function () {
      if (!state || busy) return;
      if (!state.can_write) { say(getToken() ? "가입이 승인되면 좋아요를 누를 수 있습니다." : "로그인하면 좋아요를 누를 수 있습니다.", true); return; }
      busy = true; say("");
      api("POST", path + "/like").then(function (d) { state.likes = d.likes; state.liked = d.liked; drawLike(); },
        function (e) { say(e.message, true); }).then(function () { busy = false; });
    });
    ta.addEventListener("input", function () { left.textContent = ta.value.length + " / " + MAX; });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var text = ta.value.trim();
      if (!text || busy) { if (!text) ta.focus(); return; }
      busy = true; send.disabled = true; say("");
      api("POST", path + "/comments", { body: text }).then(function (d) {
        state = d; ta.value = ""; left.textContent = "0 / " + MAX; draw();
      }, function (e) { say(e.message, true); }).then(function () { busy = false; send.disabled = false; });
    });
    load();
  }

  window.foxlcRx = mount;
  Array.prototype.forEach.call(document.querySelectorAll(".rx[data-rx]"), mount);
})();
