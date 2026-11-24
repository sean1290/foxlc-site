// 연구소 리플렛(브로슈어) 내용 → 연구소 소개 페이지의 '자세히 보기' 창
// 원본: 26 연구소별 브로슈어(4종)_v1.8 (AI 파일). 글은 브로슈어 그대로, 사진은 static/img/leaflet/<id>/ 에 있다.
// SEL · AI · 수리 · 언어 연구소 (미술 · 튼튼 · SEL 센터는 리플렛이 없어 기존 창을 쓴다).
// 브로슈어의 명백한 오타만 고쳤다 (궁국적→궁극적, 이갑니다→이어갑니다, 팔표→발표, 만들과→만들고).

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const LEAFLETS = {
  sel: (r) => {
    const im = (f) => `${r}img/leaflet/sel/${f}`;
    const kits = [
      ["Feeling Flowers", "Grow X SEL", "내가 느끼는 다양한 감정을 색깔과 꽃으로 나타내 나의 감정 상태를 표현할 수 있습니다."],
      ["My Magic Breath", "Grow X SEL", "나만의 바람개비를 제작하고 호흡 훈련을 통해 스스로 감정을 안정적으로 조절하는 방법을 배웁니다."],
      ["마음 인화 카메라", "네 마음을 들려줘!", "종이 카메라와 필름을 이용해 감정 변화를 나타내고 친구의 필름을 넘겨보며 친구의 생각과 입장에 공감합니다."],
      ["마음 날씨 일기 예보", "내 안의 구름과 햇살", "마음을 날씨에 비유해 아크릴판에 입체적으로 표현하고 기상캐스터가 되어 감정을 솔직하게 발표합니다."],
      ["Calming Jar", "Grow X SEL", "시각적 안정감을 주는 칼밍자를 직접 만들고 관찰하며 복잡한 감정을 차분하게 가라앉히는 능력을 기릅니다."],
      ["The Light in My Life", "Grow X SEL", "나에게 빛이 되어주는 존재를 떠올리며 LED 회로 카드를 제작하고 소중한 마음과 감사의 메시지를 전달합니다."],
      ["내 마음의 보물", "너에게 전하는 감정 보물 키링", "소중한 감정을 담은 슈링클스 키링을 서로 교환하며 각자의 감정이 지닌 가치를 존중하고 마음을 나눕니다."],
      ["마음의 거울 놀이", "닮은 듯 다른 우리", "투명 필름에 친구의 얼굴 선을 그리고 겹쳐보며 서로의 다름을 인정하고, 다름이 있어 서로가 아름다운 존재임을 인식합니다."],
      ["The Neural Web", "Grow X SEL", "실을 활용해 신경망 구조를 만들며 친구와 내가 좋아하는 것, 싫어하는 것의 공통점을 찾아 관계 속 연결과 협력의 가치를 배웁니다."],
      ["마음 꺼내기", "똑같은 상황, 안 똑같은 우리", "나무 판넬에 감정 타일을 만들며 같은 상황에서도 서로 다른 감정을 느낄 수 있음을 이해하고 각자의 마음을 편견 없이 존중하는 법을 배웁니다."],
      ["다를 수 있어", "햇살 아래 세운 마음의 성", "친구들과 만든 성벽을 연결해 성을 세우고 그림자의 색을 관찰하며 다름이 만드는 공동체의 아름다움을 경험합니다."],
      ["The We Tree", "Grow X SEL", "나뭇잎에 자신의 강점과 메시지를 담아 공동의 나무를 완성하며 공감과 소통, 협력의 중요성을 이해합니다."],
    ];
    return `
<section class="lf-hero">
  <div class="lf-hero-text">
    <span class="lf-pill">폭스러닝센터</span>
    <p class="lf-big">SEL 연구소</p>
    <p class="lf-slogan">나다움, 너다움, 우리다움으로 성장하는 아이들</p>
    <p class="lf-sub">친구와 마음껏 어울리며 '우리'를 배우고<br>다양한 표현 활동 속에서 '나'를 사랑하게 되는 특별한 경험</p>
  </div>
  <figure class="lf-hero-photo"><img src="${im("hero.jpg")}" alt="SEL 연구소 활동 중인 아이들" loading="lazy"><figcaption>놀이와 경험 속에서<br>마음을 배우는<br>SEL 프로그램</figcaption></figure>
</section>

<section class="lf-sec">
  <h3 class="lf-band">왜 SEL일까요?</h3>
  <div class="lf-two">
    <div>
      <h4 class="lf-h">우리 아이의 미래를 위해</h4>
      <p>SEL이란 <b>Social Emotional Learning</b>. <b>'사회정서학습'</b>의 약자로 자신을 이해하고 조절하는 능력부터 타인과의 관계를 건강하게 형성하는 힘까지 사회정서적 역량을 키워가는 과정입니다. 이를 통해 아이들은 더 나은 미래를 준비할 수 있습니다.</p>
      <p>SEL은 아이들의 성장과 원만한 학교생활은 물론 사회구성원으로서 필요한 역량을 기르는 중요한 기반이 됩니다.</p>
    </div>
    <ul class="lf-powers" aria-label="이런 힘이 자라납니다">
      <li><img src="${im("pw-express.png")}" alt=""><b>감정 표현</b><span>내 감정을 말로 표현하는 힘</span></li>
      <li><img src="${im("pw-empathy.png")}" alt=""><b>공감 능력</b><span>타인의 마음을 이해하는 힘</span></li>
      <li><img src="${im("pw-social.png")}" alt=""><b>사회성</b><span>관계를 만들어가는 힘</span></li>
      <li><img src="${im("pw-self.png")}" alt=""><b>자기 관리</b><span>감정 조절과 책임감 있게 행동하는 힘</span></li>
    </ul>
  </div>
</section>

<section class="lf-sec">
  <h3 class="lf-band">단단한 나, 유연한 너, 약속하는 우리</h3>
  <h4 class="lf-h center">마음 연결 SEL 프로젝트</h4>
  <ul class="lf-trio">
    <li><img src="${im("me.png")}" alt="'나'다움"><span class="lf-tag blue">나를 이해하고 조절하는 힘</span></li>
    <li><img src="${im("you.png")}" alt="'너'다움"><span class="lf-tag purple">나와 다른 마음을 이해하는 힘</span></li>
    <li><img src="${im("us.png")}" alt="'우리'다움"><span class="lf-tag green">사람들과 함께 협력하는 힘</span></li>
  </ul>
  <div class="lf-two lf-cards">
    <article><h4 class="lf-h">SEL 연구소란?</h4><p>아이들이 자신의 감정을 이해하고 조절하며 언어와 행동, 다양한 도구로 마음을 표현하고 또래와의 관계 속에서 자연스럽게 배우며 성장하는 공간입니다.</p></article>
    <article><h4 class="lf-h">SEL 센터란?</h4><p>다양한 심리검사와 상담을 통해 아이의 특성과 마음을 깊이 이해하고, 강점을 발견하여 건강한 성장을 지원하는 공간입니다.</p></article>
  </div>
</section>

<section class="lf-sec">
  <h4 class="lf-h center">폭스러닝센터만의 특별한 SEL 방식</h4>
  <ul class="lf-ways">
    <li><img src="${im("m-tools.png")}" alt=""><span>AI, 미술, 음악, 신체 활동 등<br>다양한 도구와 매체를 활용</span></li>
    <li><img src="${im("m-play.png")}" alt=""><span>직접 경험하는 놀이와<br>표현 중심의 감정교육</span></li>
    <li><img src="${im("m-growth.png")}" alt=""><span>연령별 단계 맞춤 활동 운영과<br>성장 기록 및 피드백 제공</span></li>
  </ul>
  <div class="lf-recommend">
    <h4 class="lf-h">이런 친구에게 추천해요!</h4>
    <ul><li>자신감과 자기 표현이 필요한 아이</li><li>친구 관계가 서툰 아이</li><li>공감과 소통 경험이 필요한 아이</li><li>감정표현이 어려운 아이</li></ul>
    <img class="lf-fox" src="${im("fox.png")}" alt="" loading="lazy">
  </div>
</section>

<section class="lf-sec">
  <h3 class="lf-band">Grow X SEL 기반 융합활동을 통한 글로벌 커뮤니케이션 역량 증진 활동 예시</h3>
  <div class="lf-photos">
    <figure><img src="${im("act-weather.jpg")}" alt="마음 날씨 일기 예보 활동" loading="lazy"><figcaption>마음 날씨 일기 예보<small>내 안의 구름과 햇살</small></figcaption></figure>
    <figure><img src="${im("act-calming.jpg")}" alt="Calming Jar 활동" loading="lazy"><figcaption>Calming Jar<small>Grow X SEL</small></figcaption></figure>
    <figure><img src="${im("act-neural.jpg")}" alt="The Neural Web 활동" loading="lazy"><figcaption>The Neural Web<small>Grow X SEL</small></figcaption></figure>
    <figure><img src="${im("act-feelings.jpg")}" alt="마음 꺼내기 활동" loading="lazy"><figcaption>마음 꺼내기<small>똑같은 상황, 안 똑같은 우리</small></figcaption></figure>
  </div>
</section>

<section class="lf-sec">
  <h3 class="lf-band">Grow X SEL과 함께하는 12가지 활동 키트</h3>
  <p class="lf-lead">Grow X와 SEL연구소에서 <b>12가지 활동 키트</b>를 개발 및 제작하였습니다. 사회정서학습에서 제시하는 5가지 핵심 역량에 글로벌 커뮤니케이션 역량을 더하여 FOX SEL 프로그램을 체계화하였습니다. 실제 SEL연구소 활동 자료로 활용되고 있습니다.</p>
  <ol class="lf-kits">
    ${kits.map(([name, sub, desc], i) => `<li><figure><img src="${im(`kit${String(i + 1).padStart(2, "0")}.jpg`)}" alt="${esc(name)} 활동 키트" loading="lazy"></figure><div><span class="lf-no">${i + 1}차시</span><b>${esc(name)}</b><small>${esc(sub)}</small><p>${esc(desc)}</p></div></li>`).join("\n    ")}
  </ol>
  <p class="lf-note">교육 활동 자료로 별도 구매 가능합니다.</p>
</section>

<section class="lf-sec">
  <h3 class="lf-band">성장 기록 시스템</h3>
  <div class="lf-two lf-mid">
    <p class="lf-quote">아이들은 매일 자신의 감정을 돌아보고 연구원은 또래 관계와 활동 속 모습을 세심하게 관찰합니다. 감정 체크 데이터와 관찰 기록을 바탕으로 아이의 정서와 사회성 변화를 부모님이 쉽게 이해할 수 있도록 <b>성장 리포트</b>를 전달합니다.</p>
    <div class="lf-screens"><img src="${im("growx-app.jpg")}" alt="감정 체크 화면" loading="lazy"><img src="${im("report.jpg")}" alt="성장 리포트 화면" loading="lazy"></div>
  </div>
</section>

<section class="lf-sec">
  <h3 class="lf-band">Grow X SEL</h3>
  <div class="lf-two">
    <div>
      <h4 class="lf-h">Grow X란?</h4>
      <p>Grow X는 학생들의 사회·정서적 역량을 향상시키기 위해 설계된 근거 기반의 온라인 학습 플랫폼으로 모든 학습과 건강한 성장을 위한 기반을 제공합니다. 모든 학습자가 학업 뿐만 아니라 사회적·정서적으로도 건강하게 성장할 수 있도록 SEL을 널리 확산하고 지속적으로 발전시키는 것이 우리의 사명입니다.</p>
      <p>San Francisco State University 심리학 연구진과 FOX Connect가 공동 개발한 연구 기반 사회정서학습(SEL) 플랫폼으로 감정 체크, 자기 성찰, 맞춤형 SEL 활동을 통해 아이들의 건강한 성장과 관계 형성을 지원합니다.</p>
      <p class="lf-small">Grow X SEL 인증 시스템은 미국 iKeepSafe의 FERPA · CSPC · COPPA 인증 기반의 학생 교육기록 및 개인정보 보호 기준을 충족한 안전한 SEL 플랫폼입니다.</p>
    </div>
    <div>
      <h4 class="lf-h">Grow X SEL 글로벌 교육 혁신</h4>
      <figure class="lf-figure"><img src="${im("growx-kenya.jpg")}" alt="Grow X Education 디지털 교육 프로젝트" loading="lazy"></figure>
      <p>교육부 산하 CEMASTEA 및 Starlink와 협력한 "Grow X Education"이 디지털 교육 프로젝트의 공식 사례로 선정되었습니다. 30개 학교, 3만 2천여 명의 학생과 1천여 명의 교사가 참여한 이 프로젝트는 Grow X의 AI 기반 SEL 플랫폼을 활용해 미래 교육의 혁신 사례로 주목받고 있습니다.</p>
    </div>
  </div>
  <h4 class="lf-h center">사회정서학습 역량</h4>
  <ul class="lf-comp"><li>자기인식</li><li>자기관리</li><li>대인관계</li><li>사회적 인식</li><li>책임 있는 의사결정</li><li class="plus">English<small>글로벌 커뮤니케이션</small></li></ul>
  <p class="lf-center">우리 아이들의 행복한 성장과 미래를 위해 필요한 소프트 기술인 SEL(Social &amp; Emotional Learning, 사회정서학습)을 프로그램에 적용하고 있습니다.</p>
</section>

<section class="lf-sec lf-info">
  <h4 class="lf-h">나를 이해하고 너를 알아가며 함께 성장하는 SEL연구소</h4>
  <dl>
    <dt>대상</dt><dd>유아, 초, 중, 고 수준별 맞춤 운영 · 성인 및 기관 연수 가능</dd>
    <dt>상담 및 문의</dt><dd>1433-2700 · 카카오톡 FOX_LC<br>대전광역시 유성구 엑스포로97번길 40, 2층 폭스러닝센터<br><small>체험 프로그램 신청 및 단체 교육은 문의주세요.</small></dd>
  </dl>
</section>`;
  },

  ai: (r) => {
    const im = (f) => `${r}img/leaflet/ai/${f}`;
    const table = (rows, start) => `<ol class="lf-ptable">${rows.map(([t, prog, d], i) => `<li><figure><img src="${im(`p${String(start + i).padStart(2, "0")}.jpg`)}" alt="${esc(t)} 활동 사진" loading="lazy"></figure><div><b>${esc(t)}</b><span class="lf-prog">${esc(prog)}</span><p>${esc(d)}</p></div></li>`).join("")}</ol>`;
    return `
<section class="lf-hero">
  <div class="lf-hero-text">
    <span class="lf-pill">폭스러닝센터</span>
    <p class="lf-big">AI 연구소</p>
    <p class="lf-slogan">호기심을 질문으로,<br>아이디어를 결과물로 만드는 아이</p>
    <p class="lf-sub">기초 개념 이해에서 아웃풋 도출까지!<br>AI · 코딩 프로젝트 교육</p>
  </div>
  <figure class="lf-hero-photo"><img src="${im("hero.jpg")}" alt="로봇과 태블릿으로 활동하는 아이들" loading="lazy"></figure>
</section>

<section class="lf-sec">
  <h3 class="lf-band">AI와 함께 무엇을 배울까요?</h3>
  <div class="lf-two lf-mid">
    <div>
      <h4 class="lf-h">AI는 •••</h4>
      <p><b>데이터를 바탕으로 정보를 분류하고 예측하거나, 글과 그림 등을 만들어 내는 기술입니다.</b></p>
      <p>궁금한 것을 알아보고 여러 설명과 표현을 비교하는 데 활용할 수 있습니다. 무엇을 알아볼지, 어떤 도움을 받아 어떻게 쓸지는 아이가 선택합니다.</p>
    </div>
    <div class="lf-callout">
      <h4 class="lf-h">AI 연구소의 궁극적인 목적은 단 하나입니다.</h4>
      <p>새롭게 배운 것을 자기 것으로 이해하고 무엇을 어떻게 활용하고 전할지 <b>스스로 판단하는 힘</b>을 기르는 것입니다.</p>
    </div>
  </div>
  <h4 class="lf-h center">활용 예시 · 내 이야기를 AI와 함께 그림책으로 만들어요</h4>
  <div class="lf-flow">
    <img class="lf-flow-art" src="${im("story.jpg")}" alt="" loading="lazy">
    <ol class="lf-steps">
      <li><img src="${im("st1.jpg")}" alt=""><div><b>이야기 정하기</b><p>어떤 이야기를 전할지 생각해요. 주인공과 사건을 정하고 이야기의 순서를 잡아요.</p></div></li>
      <li><img src="${im("st2.jpg")}" alt=""><div><b>글과 그림 만들기</b><p>원하는 장면을 AI에게 설명해요. 내 이야기와 어울리는 글과 그림을 고르고 필요한 부분을 고쳐요.</p></div></li>
      <li><img src="${im("st3.jpg")}" alt=""><div><b>완성하고 소개하기</b><p>이야기가 잘 이어지도록 그림책을 완성해요. 친구에게 책을 소개하고 글과 그림을 고른 이유를 설명해요.</p></div></li>
    </ol>
  </div>
</section>

<section class="lf-sec">
  <h3 class="lf-band">아이의 특성과 성장수준에 맞춰 활동을 구성합니다</h3>
  <ol class="lf-cycle">
    <li><b>이해 확인</b><p>아이의 설명과 풀이를 보고 어떤 개념을 이해했는지 확인합니다.</p></li>
    <li><b>목표와 난이도 설정</b><p>아이에게 필요한 개념과 기능을 정하고 활동의 난이도를 조절합니다.</p></li>
    <li><b>개념 설명</b><p>원리를 설명하고 예제를 함께 풀며 작품에 적용하는 방법을 알려줍니다.</p></li>
    <li><b>다음 활동 계획</b><p>아이의 설명과 작품에서 더 연습할 부분을 찾아 다음 활동에 반영합니다.</p></li>
  </ol>
</section>

<section class="lf-sec">
  <h3 class="lf-band">활동은 이렇게 이루어집니다.</h3>
  <p class="lf-lead">아이의 관심과 이해 역량에 맞춰 <b>기초 · 응용 · 프로젝트 활동</b>을 연결합니다.</p>
  <div class="lf-levels">
    <article><img src="${im("basic.jpg")}" alt=""><span class="lf-no">기초 활동</span><h4>기능과 원리 익히기</h4><dl><dt>아이는</dt><dd>짧은 예제를 따라 하며 필요한 기능과 원리를 익힙니다.</dd><dt>연구원은</dt><dd>원리를 설명하고 사용 방법을 보여 주며 함께 연습합니다.</dd></dl></article>
    <article><img src="${im("apply.jpg")}" alt=""><span class="lf-no">응용 활동</span><h4>바꾸어 만들고 비교하기</h4><dl><dt>아이는</dt><dd>배운 기능을 바꾸어 써 보고 자신의 생각을 작품으로 표현합니다.</dd><dt>연구원은</dt><dd>결과가 달라진 이유를 짚어 주고 아이디어에 맞는 제작 방법을 알려 줍니다.</dd></dl></article>
    <article><img src="${im("project.jpg")}" alt=""><span class="lf-no">프로젝트 활동</span><h4>주제를 정하고 완성하기</h4><dl><dt>아이는</dt><dd>주제에 맞는 방법을 골라 만들고 결과와 선택한 이유를 설명합니다.</dd><dt>연구원은</dt><dd>주제와 계획을 함께 정리하고 필요한 자료와 해결 방법을 제안합니다.</dd></dl></article>
  </div>
</section>

<section class="lf-sec">
  <h3 class="lf-band">작품을 소개하고 새로운 도전에 참여합니다.</h3>
  <h4 class="lf-h">주요 대외 활동</h4>
  <p>아이들이 만든 작품과 탐구한 내용을 발표에서 소개합니다. 관심 있는 주제는 팀 프로젝트와 대회로 이어갑니다.</p>
  <div class="lf-photos">
    <figure><img src="${im("ev-fll.jpg")}" alt="팀 프로젝트 발표" loading="lazy"><figcaption>팀 프로젝트 발표<small>FLL 도전반</small></figcaption></figure>
    <figure><img src="${im("ev-cos.jpg")}" alt="코딩 자격 도전" loading="lazy"><figcaption>코딩 자격 도전<small>COS 도전반</small></figcaption></figure>
    <figure><img src="${im("ev-wise.jpg")}" alt="아이디어 전시" loading="lazy"><figcaption>아이디어 전시<small>WISE 세계발명학교엑스포</small></figcaption></figure>
    <figure><img src="${im("ev-sci.jpg")}" alt="탐구 내용 발표" loading="lazy"><figcaption>탐구 내용 발표<small>무한상상 과학 탐구대회</small></figcaption></figure>
  </div>
  <h4 class="lf-h" style="margin-top:32px">향후 활동 계획</h4>
  <p>아이의 관심과 활동 목표에 맞춰 발표·전시·대회 참여를 준비합니다.</p>
  <dl class="lf-plan">
    <dt>비버챌린지</dt><dd>정보과학 기반의 다양한 과제를 해결하며 컴퓨팅 사고력과 논리적 문제 해결력 기르기</dd>
    <dt>COS 도전반</dt><dd>스크래치 프로그래밍 문제를 단계별로 해결하며 코딩 실력과 자격취득 준비하기</dd>
    <dt>바른 AI·디지털 생활 창작 활동</dt><dd>AI·디지털의 올바른 활용 방법을 탐색하고 글·그림으로 생각 표현하기</dd>
    <dt>WISE 세계발명학교엑스포</dt><dd>생활 속 문제를 발견하고 창의적인 발명 아이디어를 직접 구현하기</dd>
    <dt>FLL 도전반</dt><dd>시즌 주제를 탐구하며 팀원과 의견·역할을 나누고 LEGO를 이용하여 미션 수행하기</dd>
    <dt>무한상상 과학 탐구대회 준비반</dt><dd>과학적 호기심에서 출발해 탐구 주제를 정하고 실험·분석을 통해 결과 발표하기</dd>
  </dl>
</section>

<section class="lf-sec">
  <h3 class="lf-band">AI 연구소 프로그램 안내</h3>
  <h4 class="lf-h">표현에서 과학·로봇 탐구까지</h4>
  <p>생각을 글과 그림으로 전하고 모형과 로봇을 만들며 원리를 배웁니다. 관심 있는 주제에 맞춰 디지털 표현과 제작 활동을 연결합니다.</p>
  ${table([
    ["글과 그림으로 뜻 전하기", "생성형 AI 활용", "전하고 싶은 내용을 글과 그림으로 구성합니다. AI의 제안에서 어울리는 표현을 고르고 자신의 뜻에 맞게 다듬습니다."],
    ["문화유산과 보존·복원 알아보기", "AI·디지털 문화유산과 떠나는 역사 여행!", "문화유산을 탐구하고 보존·복원 과정을 체험합니다. 과거의 모습을 알아보는 데 AI·디지털 기술이 어떻게 쓰이는지 배웁니다."],
    ["힘과 움직임 알아보기", "레고 에듀케이션 브릭큐 모션 에센셜", "모형을 직접 움직이며 힘과 움직임의 관계를 배웁니다. 구조를 바꾸어 보고 달라진 움직임의 이유를 설명합니다."],
    ["코딩으로 모형 움직이기", "레고 스파이크 에센셜", "모형을 조립하고 명령의 순서를 정해 움직입니다. 원하는 동작에 맞춰 구조와 명령을 바꾸며 코딩의 기초를 익힙니다."],
    ["문제에 맞는 로봇 설계하기", "레고 스파이크 프라임", "해결할 문제에 맞춰 로봇의 구조와 동작을 설계합니다. 실제로 움직여 보며 구조와 코드를 조정하고 작동 원리를 설명합니다."],
    ["역할을 나누어 함께 구현하기", "마인크래프트 Education", "함께 정한 아이디어를 블록 코딩으로 구현합니다. 각자 맡은 부분을 연결하고 전체가 계획대로 작동하도록 조정합니다."],
  ], 1)}
  <h4 class="lf-h" style="margin-top:36px">코딩으로 순서와 규칙을 배웁니다.</h4>
  <p>이야기와 게임의 규칙, 수학의 풀이를 코드로 나타냅니다. 명령과 실행 결과의 관계를 이해하며 해결 방법을 다듬습니다.</p>
  ${table([
    ["이야기를 순서대로 표현하기", "어린이 스크래치", "동화 속 장면과 캐릭터의 움직임을 블록으로 표현합니다. 명령의 순서를 바꿔 실행하며 순서와 움직임의 관계를 배웁니다."],
    ["게임의 규칙을 코딩하기", "스크래치", "게임의 규칙을 정하고 조건과 반복을 코드로 표현합니다. 실행 결과가 규칙과 맞는지 확인하며 게임을 완성합니다."],
    ["해결 순서를 코드로 작성하기", "파이썬 언어", "기본 문법을 익히고 해결 과정을 여러 단계로 나누어 코드를 작성합니다. 실행 결과를 바탕으로 오류의 원인을 찾아 수정합니다."],
    ["수학 풀이를 코드로 표현하기", "알고리즘과 수학을 잇다", "수학 문제를 직접 풀고 풀이 과정을 알고리즘과 코드로 나타냅니다. 계산 결과를 비교하며 풀이가 성립하는 이유를 설명합니다."],
  ], 7)}
  <div class="lf-callout lf-callout-art"><img src="${im("robot1.jpg")}" alt=""><div><b>절차적 사고로 코드의 작동 원리를 이해합니다.</b><p>연구원은 아이의 코드와 설명을 바탕으로 막히는 부분을 파악하고 맞춤 예제와 연습을 제시합니다.</p></div></div>
  <h4 class="lf-h" style="margin-top:36px">관심 있는 주제로 도전합니다.</h4>
  <p>아이의 관심과 활동 목표에 맞춰 프로젝트와 대회, 자격 취득에 도전합니다.</p>
  ${table([
    ["조건과 규칙으로 문제 풀기", "비버챌린지", "문제의 조건과 규칙을 찾고 해결할 순서를 정합니다. 선택한 방법과 이유를 설명하며 컴퓨팅 사고력을 기릅니다."],
    ["코딩 자격 취득에 도전하기", "COS 도전반", "자격 취득에 필요한 스크래치 기능과 문제 해결 방법을 익힙니다. 문제의 조건에 맞는 명령을 선택하고 실행 결과를 확인하며 준비합니다."],
    ["팀의 아이디어 만들고 발표하기", "FLL 도전반", "팀으로 주제를 탐구하고 역할을 나눠 모형을 설계·제작합니다. 아이디어를 선택한 이유와 제작 과정을 발표하며 대회를 준비합니다."],
    ["탐구한 내용을 근거로 설명하기", "무한상상 과학 탐구대회 준비반", "주변의 궁금한 점을 탐구 문제로 정하고 해결 아이디어를 구체화합니다. 조사한 내용과 선택한 방법을 근거로 발표하고 토론합니다."],
  ], 11)}
  <div class="lf-callout lf-callout-art"><img src="${im("robot2.jpg")}" alt=""><div><b>목표에 맞춰 단계별 과정을 설계합니다.</b><p>연구원과 함께 필요한 개념을 익히고 제작과 발표를 준비합니다.</p></div></div>
</section>

<section class="lf-sec lf-info">
  <h4 class="lf-h">AI 연구소</h4>
  <dl>
    <dt>대상</dt><dd>유아, 초, 중, 고 수준별 맞춤 운영 · 성인 및 기관 연수 가능</dd>
    <dt>상담 및 문의</dt><dd>1433-2700 · 카카오톡 FOX_LC<br>대전광역시 유성구 엑스포로97번길 40, 2층 폭스러닝센터<br><small>체험 프로그램 신청 및 단체 교육은 문의주세요.</small></dd>
  </dl>
</section>`;
  },

  math: (r) => {
    const im = (f) => `${r}img/leaflet/math/${f}`;
    return `
<section class="lf-hero">
  <div class="lf-hero-text">
    <span class="lf-pill">폭스러닝센터</span>
    <p class="lf-big">수리 연구소</p>
    <p class="lf-slogan">생각하는 힘을 키우는 수학 교육</p>
    <p class="lf-sub">PlayFACTO부터 교과수학, AI수학까지<br>성장 과정으로 연결하여 수학적 사고력과 역량을 함께 키우는 수학 프로그램</p>
  </div>
  <figure class="lf-hero-photo"><img src="${im("hero.jpg")}" alt="수학 교구로 활동하는 아이들" loading="lazy"></figure>
</section>

<section class="lf-sec">
  <h3 class="lf-band">이런 힘이 자라납니다!</h3>
  <ul class="lf-grow3">
    <li><img src="${im("k-play.jpg")}" alt=""><b>PlayFACTO</b><span class="lf-prog">창의력 · 공간지각력</span><p>놀이와 탐구를 통해 생각을 확장하고 새로운 방법을 발견하는 힘</p></li>
    <li><img src="${im("k-curr.jpg")}" alt=""><b>교과수학</b><span class="lf-prog">수학적 사고력 · 문제해결력</span><p>수학 개념을 이해하고 다양한 방법으로 문제를 해결하는 힘</p></li>
    <li><img src="${im("k-ai.jpg")}" alt=""><b>AI수학</b><span class="lf-prog">논리력 · 컴퓨팅 사고력</span><p>알고리즘과 코딩을 통해 문제를 분석하고 논리적으로 해결하는 힘</p></li>
  </ul>
</section>

<section class="lf-sec">
  <h3 class="lf-band">Why FOX MATH?</h3>
  <div class="lf-two">
    <div>
      <h4 class="lf-h">FOX 수리 연구소는</h4>
      <ul class="lf-checks">
        <li><b>놀이와 교과를 연결합니다.</b><span>흥미에서 끝나지 않고 개념으로 이어집니다.</span></li>
        <li><b>교과와 AI를 연결합니다.</b><span>수학을 논리적으로 표현하는 힘을 키웁니다.</span></li>
        <li><b>아이마다 다른 속도를 존중합니다.</b><span>수준에 맞는 맞춤형 활동을 제공합니다.</span></li>
        <li><b>결과보다 과정을 봅니다.</b><span>생각하는 과정을 관찰하고 성장합니다.</span></li>
        <li><b>수학을 즐겁게 배웁니다.</b><span>수학에 대한 자신감과 성취감을 키웁니다.</span></li>
      </ul>
    </div>
    <div>
      <ul class="lf-vs">
        <li><small>반복보다</small><b>원리의 이해</b></li>
        <li><small>평가보다</small><b>성장의 기록</b></li>
        <li><small>결과보다</small><b>생각하는 과정</b></li>
        <li><small>정답보다</small><b>문제해결과정</b></li>
      </ul>
      <ol class="lf-ofr">
        <li><b>관찰</b>아이의 행동과 사고과정을 바라봅니다.</li>
        <li><b>발견</b>아이의 생각과 수학적 가능성을 발견합니다.</li>
        <li><b>반응</b>질문·힌트·확장으로 사고를 자극합니다.</li>
      </ol>
    </div>
  </div>
  <div class="lf-flyers">
    <figure><img src="${im("fl-play.jpg")}" alt="플레이팩토 안내" loading="lazy"><figcaption>플레이팩토</figcaption></figure>
    <figure><img src="${im("fl-curr.jpg")}" alt="교과수학 안내" loading="lazy"><figcaption>교과수학</figcaption></figure>
    <figure><img src="${im("fl-ai.jpg")}" alt="AI수학 안내" loading="lazy"><figcaption>AI수학</figcaption></figure>
  </div>
</section>

<section class="lf-sec">
  <h3 class="lf-band">수리 연구소는?</h3>
  <ul class="lf-grow3">
    <li><span class="lf-prog">흥미를 발견합니다.</span><img src="${im("k-play.jpg")}" alt=""><b>PlayFACTO</b><p><b>놀이에서 시작합니다.</b><br>교구 활동을 통해 수학을 즐기고 스스로 탐구하는 습관을 기릅니다.</p></li>
    <li><span class="lf-prog">개념을 이해합니다.</span><img src="${im("k-curr.jpg")}" alt=""><b>교과수학</b><p><b>개념을 탄탄하게 다집니다.</b><br>교과수학으로 원리를 이해하고 다양한 문제를 해결하는 힘을 키웁니다.</p></li>
    <li><span class="lf-prog">생각을 확장합니다.</span><img src="${im("k-ai.jpg")}" alt=""><b>AI수학</b><p><b>미래 역량으로 확장합니다.</b><br>AI와 알고리즘, 코딩을 활용하여 논리적 사고와 창의적인 문제해결력을 기릅니다.</p></li>
  </ul>
  <h4 class="lf-h center">생각하는 힘 · 수학을 통해 생각하는 힘을 키웁니다!</h4>
  <ul class="lf-five">
    <li><b>사고력</b>원리를 이해하고 논리적으로 생각하는 힘</li>
    <li><b>문제해결력</b>다양한 방법으로 문제를 해결하는 힘</li>
    <li><b>창의성</b>새로운 아이디어로 생각을 확장하는 힘</li>
    <li><b>자기주도학습</b>스스로를 계획하고 실천하며 성장하는 힘</li>
    <li><b>자신감</b>도전과 성공 경험으로 스스로 믿고 성장하는 힘</li>
  </ul>
  <ul class="lf-comp"><li>수학에 대한 자신감</li><li>원리를 이해하는 학습</li><li>미래를 준비하는 수학</li><li>다양한 경험과 표현</li><li>꾸준한 성장 습관</li></ul>
</section>

<section class="lf-sec">
  <h3 class="lf-band">플레이팩토 PlayFACTO</h3>
  <div class="lf-two lf-mid">
    <figure class="lf-figure"><img src="${im("pf-photo.jpg")}" alt="플레이팩토 수업" loading="lazy"></figure>
    <p class="lf-quote">플레이팩토는 다양한 교구를 활용하여 아이가 직접 탐색하고 원리를 발견하며, 놀이 속에서 <b>수학적 사고력과 문제해결력</b>을 키우는 체험형 수학 프로그램입니다.</p>
  </div>
  <h4 class="lf-h">플레이팩토 학습 과정</h4>
  <ol class="lf-chev"><li>아이의 사고과정을 관찰</li><li>수학적 발견을 확인</li><li>발견에 관한 반응</li><li>다시 생각하며 해결</li></ol>
  <h4 class="lf-h" style="margin-top:28px">프로그램 안내</h4>
  <div class="lf-areas">
    ${[["연 산", "수를 이해하고 관계를 발견하는 힘", ["수 개념 익히기", "연산 원리 이해", "계산 전략 만들기", "수 감각 향상"], "t-calc", ["바이초이스", "메이크넘버스", "텐트웬티"]],
      ["도 형", "보고, 만들고, 공간을 이해하는 힘", ["평면·입체도형", "공간지각력", "도형 분해와 구성", "시각적 사고"], "t-shape", ["큐브스", "쉐이프", "커버잇"]],
      ["패 턴", "규칙을 찾고 예측하는 힘", ["패턴 인식", "규칙 확장", "논리적 추론", "집중력 향상"], "t-pattern", ["컬러도트", "패션퍼피", "픽셀"]],
      ["전 략", "생각하고 선택하는 힘", ["문제해결", "전략 세우기", "추론하기", "협력 활동"], "t-strategy", ["탱그램", "미니 바둑", "Guess What"]],
    ].map(([t, sub, items, img, tools]) => `<article><h5>${t}</h5><p class="lf-asub">${sub}</p><ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul><figure><img src="${im(img + ".jpg")}" alt="${t.replace(" ", "")} 대표교구" loading="lazy"><figcaption>대표교구 예시 · ${tools.join(" · ")}</figcaption></figure></article>`).join("")}
  </div>
</section>

<section class="lf-sec">
  <h3 class="lf-band">교과수학 Curriculum Math</h3>
  <div class="lf-two lf-mid">
    <figure class="lf-figure"><img src="${im("curr-photo.jpg")}" alt="교과수학 수업" loading="lazy"></figure>
    <div>
      <h4 class="lf-h">생각의 깊이가 실력이 되는 수학!</h4>
      <ul class="lf-dots"><li>학교 교과 과정 기반 <b>체계적인 학습</b></li><li>학생별 수준에 맞춘 <b>맞춤형 진도</b> 운영</li><li>자신감과 <b>학습 습관</b> 형성</li><li>개념 이해부터 유형별 문제 풀이까지 <b>단계별 지도</b></li></ul>
    </div>
  </div>
  <h4 class="lf-h">학습내용</h4>
  <ol class="lf-steps4">
    <li><img src="${im("s1.jpg")}" alt=""><b>개념 이해</b><span>교과 개념을 쉽고 탄탄하게 학습</span></li>
    <li><img src="${im("s2.jpg")}" alt=""><b>유형 적용</b><span>다양한 문제를 통해 개념을 학습</span></li>
    <li><img src="${im("s3.jpg")}" alt=""><b>사고력 확장</b><span>개념부터 응용 심화까지 단계별 학습</span></li>
    <li><img src="${im("s4.jpg")}" alt=""><b>자기주도 학습</b><span>스스로 생각하고 해결하는 문제해결력 향상</span></li>
  </ol>
  <div class="lf-recommend"><h4 class="lf-h">이런 아이에게 추천해요!</h4><ul><li>사고력 및 서술형 문제 해결력이 필요한 아이</li><li>정확한 개념 이해가 필요한 아이</li><li>자기주도 학습이 필요한 아이</li></ul></div>
</section>

<section class="lf-sec">
  <h3 class="lf-band">AI 수학 AI Math</h3>
  <div class="lf-two lf-mid">
    <figure class="lf-figure"><img src="${im("ai-photo.jpg")}" alt="AI수학 수업" loading="lazy"></figure>
    <div>
      <h4 class="lf-h">생각을 알고리즘으로 수학을 코딩으로</h4>
      <p>수학 문제를 직접 풀어보고 알고리즘으로 정리한 뒤 스크래치 블록 코딩으로 구현하여 논리적 사고력과 문제 해결력을 키우는 수학프로그램입니다.</p>
    </div>
  </div>
  <ol class="lf-chev"><li><b>문제 이해</b>수학 개념과 원리 탐색하기</li><li><b>알고리즘 설계</b>해결 과정을 단계별로 정리하기</li><li><b>코딩 구현</b>스크래치 블록코딩으로 표현하기</li><li><b>AI 사고 확장</b>창의적인 해결 방법을 찾기</li></ol>
  <div class="lf-two lf-mid" style="margin-top:28px">
    <figure class="lf-figure"><img src="${im("book.jpg")}" alt="알고리즘과 수학을 잇다 교재" loading="lazy"></figure>
    <div>
      <h4 class="lf-h">알고리즘과 수학을 잇다 교재</h4>
      <p>'교과수학', 'AI수학'과 코딩을 연결지어주는 초등학교 현직교사와 폭스러닝센터에서 자체개발한 AI수학 교재입니다. 설계부터 스크래치 구현까지 체계적으로 학습합니다.</p>
      <dl class="lf-plan"><dt>초등학생</dt><dd>교과 알수잇다 교재 활용 · 교과수학을 스크래치 블록코딩으로 구현 · 수학 개념과 알고리즘 연결</dd><dt>중학생</dt><dd>중학교 교과수학 기반 문제 해결 · 알고리즘 설계 및 블록코딩 구현 · 논리적 사고와 프로그래밍 사고력 강화</dd></dl>
    </div>
  </div>
</section>

<section class="lf-sec">
  <h3 class="lf-band">개별 맞춤 프로그램</h3>
  <div class="lf-levels">
    <article><span class="lf-no">놀이를 개념으로 연결</span><h4>PlayFACTO → 교과수학</h4><p>교구 활동으로 경험한 수학 원리를 교과 개념으로 연결합니다.</p><dl><dt>PlayFACTO</dt><dd>추천연령 6세~초3 · 수감각 · 도형 · 패턴 · 전략</dd><dt>교과수학</dt><dd>추천연령 6세~중학생 · 교과개념 · 유형학습 · 사고력</dd></dl></article>
    <article><span class="lf-no">생각을 탐구로 확장</span><h4>활동과 프로젝트</h4><p>활동과 프로젝트를 통해 창의적으로 표현합니다.</p></article>
    <article><span class="lf-no">개념을 논리로 확장</span><h4>AI수학</h4><p>논리적 사고와 컴퓨팅 사고를 함께 기릅니다.</p><dl><dt>AI수학</dt><dd>추천연령 초3~중학생 · 알고리즘 · 블록코딩 · 논리적사고</dd></dl></article>
  </div>
  <table class="lf-table">
    <thead><tr><th></th><th>통합형 스페셜</th><th>특성화 과정</th></tr></thead>
    <tbody>
      <tr><th>대상</th><td>유아 ~ 초4</td><td><b>A</b> 초2 ~ 초고학년<br><b>B</b> 초고학년 ~ 중등</td></tr>
      <tr><th>구성</th><td>교과수학 90분 · 주 2회<br>플레이팩토 60분 · 주 1회</td><td><b>A</b> 플레이팩토 90분 · 주 1회 / AI수학 60분 · 주 1회<br><b>B</b> 교과수학 120분 · 주 2회 / AI수학 90분 · 주 1회</td></tr>
    </tbody>
  </table>
</section>

<section class="lf-sec lf-info">
  <h4 class="lf-h">수리 연구소</h4>
  <dl>
    <dt>대상</dt><dd>유아, 초, 중, 고 수준별 맞춤 운영</dd>
    <dt>상담 및 문의</dt><dd>1433-2700 · 카카오톡 FOX_LC<br>대전광역시 유성구 엑스포로97번길 40, 2층 폭스러닝센터<br><small>체험 프로그램 신청 및 단체 교육은 문의주세요.</small></dd>
  </dl>
</section>`;
  },

  english: (r) => {
    const im = (f) => `${r}img/leaflet/english/${f}`;
    const prog = [
      ["노출", "Speaking & Physical Education", "신체 활동을 즐기며 긴장 없이 영어가 터져 나오는 상태를 만듭니다."],
      ["노출", "Pack Your Bags", "세계의 다채로운 문화를 경험하며 글로벌 시민의 감각을 깨웁니다."],
      ["학습", "Phonics & Vocab", "정확한 소리와 꾸준한 읽기 훈련으로 자유로운 표현을 위한 뼈대를 세웁니다. (Best Phonics & 주제별 어휘 커리큘럼)"],
      ["학습", "Science Corner", "실험과 체험을 통해 과학 원리를 영어로 자연스럽게 습득합니다. (STEAM Reading Elementary)"],
      ["학습", "Speaking +", "원어민 연구원님과 실제 상황별 대화를 나누며 실전 스피킹 감각을 익힙니다. (Speak Up+)"],
      ["학습", "Deep Learning Special", "정교한 문법과 심화 독해를 통해, 자신의 생각을 논리적인 문장으로 정립하는 전략적 언어 강화 과정입니다."],
      ["심화", "Movie Project", "직접 연기, 촬영, 편집 등 영화 제작 전 과정에 참여하여 완성도 높은 단편영화를 만들고, 이를 통해 라이팅, 스피킹, 리스닝, 리딩 스킬을 종합적으로 발휘합니다."],
      ["심화", "Debate & Conquer", "주어진 주제를 조사하고 찬반 입장을 선택한 뒤 논거를 구성하여 발표하며 영어적 비판적 사고와 표현력을 기릅니다."],
    ];
    return `
<section class="lf-hero">
  <div class="lf-hero-text">
    <span class="lf-pill">폭스러닝센터</span>
    <p class="lf-big">언어 연구소</p>
    <p class="lf-slogan">영어와 친해지는 공간</p>
    <p class="lf-sub">영어를 배우는 것을 넘어 영어와 친해지는 공간<br>자신감과 사고력을 함께 키우는 통합 영어 교육을 제공합니다.</p>
  </div>
  <figure class="lf-hero-photo"><img src="${im("hero.jpg")}" alt="원어민 연구원과 함께하는 아이들" loading="lazy"></figure>
</section>

<section class="lf-sec">
  <h3 class="lf-band">영어는... 세상을 생생하게 읽어내고 나를 표현하는 가장 매력적인 도구입니다</h3>
  <ol class="lf-stages">
    <li><span>01</span><b>노출: 영어의 즐거움을 발견</b><p>영어를 '공부'가 아닌 '즐거운 상호작용'으로 받아들이는 본능적 노출의 시간입니다. 실험, 체육, 문화 탐구 등 다양한 활동을 통해 영어를 사용하는 즐거움을 몸소 깨우칩니다.</p></li>
    <li><span>02</span><b>학습: 정확한 Input과 뼈대</b><p>즐거움이 학습으로 이어지도록, 파닉스와 리딩을 통해 언어의 정확한 체계를 세웁니다. 모든 활동은 자유로운 영어 독서에서 시작됩니다. 영어책에 대한 심리적 부담을 낮추고, 즐겁게 읽는 경험을 통해 자연스럽게 영어 문해력을 키워 나갑니다.</p></li>
    <li><span>03</span><b>피드백 &amp; 성장 리포트</b><p>아이의 고유한 속도를 존중하며, 정기적인 레벨 테스트와 성장 리포트를 통해 맞춤형 프로그램 추천과 코칭을 받습니다. 분석된 데이터를 바탕으로 설계된 1:1 맞춤형 프로그램은 아이가 지치지 않고 자신의 잠재력을 최대로 끌어올릴 수 있는 가장 견고한 가이드가 됩니다.</p></li>
    <li><span>04</span><b>심화: 자유로운 표현의 완성</b><p>자신의 논리와 감정을 실어 보내는 진정한 '의사표현의 자유'를 실현합니다. 정답을 맞히는 연습을 넘어 자신의 논리와 감정을 영어에 실어 전달하는 경험 — 이것이 몰입 단계가 지향하는 표현의 완성입니다.</p></li>
  </ol>
</section>

<section class="lf-sec">
  <h3 class="lf-band">언어 연구소의 궁극적인 목적은 단 하나입니다</h3>
  <div class="lf-two lf-mid">
    <figure class="lf-figure"><img src="${im("class.jpg")}" alt="언어 연구소 수업" loading="lazy"></figure>
    <div>
      <p class="lf-slogan" style="margin-bottom:14px">세상과 거침없이 소통하는<br><b>표현의 자유</b>를 선물하는 것입니다.</p>
      <p>언어 연구소는 아이들이 영어를 '진짜 언어'로 경험하게 합니다. 교실이라는 무대를 넘어 전 세계를 향해 나아갈 아이들에게, 가장 필요한 것은 어떤 상황에서도 주도적으로 대화를 이끌어가는 힘이기 때문입니다.</p>
      <p>매년 글로벌캠프를 통해 아이들이 미국 현지의 친구들과 웃으며 소통하고, 자신의 생각으로 프로젝트를 완성하는 살아있는 경험을 제공합니다. 이 과정에서 아이들은 흔들리지 않는 자존감과 탁월한 의사소통 능력을 체득합니다.</p>
    </div>
  </div>
</section>

<section class="lf-sec">
  <h3 class="lf-band">영어와 친해지는 공간</h3>
  <ul class="lf-points">
    <li>미국 친구들과 직접 교류하며 자연스러운 언어 및 문화 교환</li>
    <li>아이의 정서적 상태를 살피는 따뜻한 코칭</li>
    <li>개별 수준을 세밀하게 고려한 맞춤형 설계</li>
    <li>결과물에 대한 정기적인 피드백과 성장 리포트 제공</li>
  </ul>
  <p class="lf-center lf-slogan">언어의 기초는 탄탄하게, 활용의 경험은 폭넓게!</p>
  <div class="lf-photos">
    <figure><img src="${im("science.jpg")}" alt="영어로 하는 과학 실험" loading="lazy"></figure>
    <figure><img src="${im("room.jpg")}" alt="언어 연구소 수업" loading="lazy"></figure>
  </div>
</section>

<section class="lf-sec">
  <h3 class="lf-band">ENGLISH ISLAND PROGRAMS</h3>
  <table class="lf-table lf-ptbl">
    <thead><tr><th>단계</th><th>프로그램</th><th>한 줄 소개</th></tr></thead>
    <tbody>${prog.map(([st, n, d], i) => `<tr>${i === 0 || prog[i - 1][0] !== st ? `<th rowspan="${prog.filter((x) => x[0] === st).length}">${st}</th>` : ""}<td><b>${esc(n)}</b></td><td>${esc(d)}</td></tr>`).join("")}</tbody>
  </table>
  <p class="lf-note">* 자세한 문의사항은 자사 방문 / 홈페이지 / 전화 상담을 이용하시길 바랍니다.<br>* 시즌별 다양한 프로그램이 운영되며, 세부 내용은 안내된 내용과 달라질 수 있습니다.</p>
</section>

<section class="lf-sec">
  <h3 class="lf-band">진짜 배움의 시작! FOX GLOBAL CAMP</h3>
  <p class="lf-lead">폭스 글로벌캠프는 미국과 싱가포르를 시작으로, 전 세계 다양한 국가에서 현지 학교·대학과 연계하여 운영되는 프리미엄 영어 몰입 캠프입니다. 아이들이 실제 현지 생활 속에서 영어를 자연스럽게 익히고, 글로벌 감각과 자신감을 키울 수 있도록 더 많은 문화권으로 지속적으로 프로그램을 확장해 나가고 있습니다.</p>
  <div class="lf-two">
    <div class="lf-cards"><article>
      <h4 class="lf-h">Global Camp in KOREA</h4>
      <ul class="lf-dots"><li>샌디에이고에 위치한 스톤랜치 초등학교 학생 및 교사들이 폭스러닝센터 방문</li><li>ESL 활동: 미국 연구원과 함께하는 영어 스피킹 활동</li><li>SEL 교류 활동: 미국 교사들이 지도하는 감정과 관계를 이해하고, 나를 소개하며, 친구와 협력하는 사회정서학습</li></ul>
      <h4 class="lf-h" style="margin-top:18px">Global Camp in the USA</h4>
      <ul class="lf-dots"><li>현지 초등학교에서 교실 활동과 공동 프로젝트 참여</li><li>자기소개, 이름 묻기, 의견 나누기 등 실제 영어 대화 경험</li><li>미국 대학 탐방 (Stanford Univ., UC Irvine)</li><li>문화와 역사 체험</li></ul>
    </article></div>
    <div>
      <h4 class="lf-h">아이에게 남는 변화</h4>
      <ul class="lf-powers lf-powers-text"><li><b>현지 미국 친구들과 영어로 소통하는 경험</b></li><li><b>다른 문화를 이해하고 적응하는 능력</b></li><li><b>나와 다른 친구에게 먼저 말을 거는 자신감</b></li><li><b>협력, 표현, 관계 맺기 경험</b></li></ul>
      <p class="lf-small" style="margin-top:14px">SFSU 연구팀과 공동 개발한 프로그램을 통해 관계를 맺고, 감정을 표현하며 협력하는 SEL(사회정서학습) 기반 활동으로 구성됩니다. 샌디에이고 현지 초등학교를 방문해 또래 학생들과 함께 교실 활동과 공동 프로젝트를 경험합니다.</p>
    </div>
  </div>
</section>

<section class="lf-sec lf-info">
  <h4 class="lf-h">언어 연구소</h4>
  <dl>
    <dt>대상</dt><dd>유아, 초, 중, 고 수준별 맞춤 운영</dd>
    <dt>상담 및 문의</dt><dd>1433-2700 · 카카오톡 FOX_LC<br>대전광역시 유성구 엑스포로97번길 40, 2층 폭스러닝센터<br><small>체험 프로그램 신청 및 단체 교육은 문의주세요.</small></dd>
  </dl>
</section>`;
  },
};
