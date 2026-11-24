// 연구소 리플렛(브로슈어) 내용 → 연구소 소개 페이지의 '자세히 보기' 창
// 원본: 26 연구소별 브로슈어(4종)_v1.8 (AI 파일). 글은 브로슈어 그대로, 사진은 static/img/leaflet/<id>/ 에 있다.
// 아직 SEL 연구소만 옮겼다 (AI · 수리 · 언어는 같은 방식으로 이어서 추가).

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
};
