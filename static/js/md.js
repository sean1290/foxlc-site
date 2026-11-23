/* SEL 칼럼 본문 서식 (브라우저 미리보기와 사이트 빌드가 같이 쓴다)
   지원:  ## 소제목   ### 작은 소제목   **굵게**   [글자](https://주소)
          ![사진 설명](https://사진주소)  (한 줄에 따로)   - 목록   > 인용
   빈 줄로 문단을 나눈다. HTML 은 모두 글자로 바뀌어 실행되지 않는다. */
function renderMd(src) {
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function safeUrl(u) { return /^https?:\/\/[^\s"'<>]+$/.test(u) ? u : ""; }
  function inline(t) {
    t = esc(t);
    t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, label, url) {
      return '<a href="' + url + '" target="_blank" rel="noopener">' + label + "</a>";
    });
    return t;
  }
  var blocks = String(src || "").replace(/\r\n/g, "\n").split(/\n{2,}/);
  var out = [];
  blocks.forEach(function (b) {
    b = b.replace(/^\n+|\n+$/g, "");
    if (!b.trim()) return;
    var img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(b.trim());
    if (img && safeUrl(img[2])) {
      out.push('<figure><img src="' + esc(img[2]) + '" alt="' + esc(img[1]) + '" loading="lazy">' + (img[1] ? "<figcaption>" + esc(img[1]) + "</figcaption>" : "") + "</figure>");
      return;
    }
    var h = /^(#{2,3})\s+(.+)$/.exec(b);
    if (h && b.indexOf("\n") < 0) { out.push("<h" + h[1].length + ">" + inline(h[2]) + "</h" + h[1].length + ">"); return; }
    var lines = b.split("\n");
    if (lines.every(function (l) { return /^\s*[-•]\s+/.test(l); })) {
      out.push("<ul>" + lines.map(function (l) { return "<li>" + inline(l.replace(/^\s*[-•]\s+/, "")) + "</li>"; }).join("") + "</ul>");
      return;
    }
    if (lines.every(function (l) { return /^>\s?/.test(l); })) {
      out.push("<blockquote>" + lines.map(function (l) { return inline(l.replace(/^>\s?/, "")); }).join("<br>") + "</blockquote>");
      return;
    }
    out.push("<p>" + lines.map(inline).join("<br>") + "</p>");
  });
  return out.join("\n");
}
/* 목록·검색용 요약: 서식 기호를 뺀 글자 */
function mdPlain(src, n) {
  var t = String(src || "").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{2,3}\s+/gm, "").replace(/\*\*/g, "").replace(/^[>\-•]\s?/gm, "").replace(/\s+/g, " ").trim();
  return n && t.length > n ? t.slice(0, n) + "…" : t;
}
if (typeof window !== "undefined") { window.renderMd = renderMd; window.mdPlain = mdPlain; }
