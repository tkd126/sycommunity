(function(root){
 'use strict';
 const scenes={
  wind:{title:'날아간 메모',line:'천 끝이 향한 쪽부터 찾아보자.',choices:[['왼쪽','← 왼쪽 책상'],['오른쪽','오른쪽 선반 →']]},
  tapePressure:{title:'메모 뒷면의 보관 약도',line:'높은 기압에서 낮은 기압으로. 어느 쪽 테이프를 가리킬까?',choices:[['왼쪽','← 선반 · 1020'],['오른쪽','녹음기 옆 · 1008 →']]},
  pressure:{title:'테이프에 남긴 표시',line:'“바람이 모이는 쪽. 맑은 날 것은 아님.” 벽에서 같은 기록을 찾자.',choices:[['고기압','바깥으로 퍼지는 기록'],['저기압','가운데로 모이는 기록']]},
  high:{title:'떨어진 날씨 이름표',line:'중심 1024 · 주변 1020. 내려오는 공기. 이 촬영표에 어느 이름표를 붙일까?',choices:[['맑음','☀ 맑은 날 이름표'],['흐림','☁ 흐린 날 이름표']]},
  low:{title:'다른 날의 촬영표',line:'중심 1004 · 주변 1008. 올라가는 공기. 어느 이름표가 맞을까?',choices:[['맑음','☀ 맑은 날 이름표'],['흐림','☁ 흐린 날 이름표']]},
  sea:{title:'빛과 맞지 않는 이름표',line:'밝은 해안 영상. 함께 남긴 관측 메모에는 「바다 → 육지」. 바뀐 이름표를 고쳐 보자.',choices:[['해풍','☀ 낮 · 해풍 이름표'],['육풍','☾ 밤 · 육풍 이름표']]},
  land:{title:'따로 보관한 녹음',line:'육지에서 바다로 부는 바람. 밤 원본에 맞는 이름표를 붙여 보자.',choices:[['해풍','☀ 낮 · 해풍 이름표'],['육풍','☾ 밤 · 육풍 이름표']]},
  coalescence:{title:'물방울 그림이 있는 장면',line:'작은 물방울이 부딪쳐 커지는 장면이다. 어느 설명과 묶어 둘까?',choices:[['병합설','물방울이 합쳐지는 설명'],['빙정설','얼음 알갱이가 자라는 설명']]},
  ice:{title:'얼음 그림이 있는 장면',line:'차가운 구름 속 얼음 알갱이가 자란다. 어느 설명과 묶어 둘까?',choices:[['병합설','물방울이 합쳐지는 설명'],['빙정설','얼음 알갱이가 자라는 설명']]}
 };
 Object.assign(scenes.coalescence,{title:'파란 노트의 세 장면',line:'왼쪽부터 본 그림이야. 마지막 물방울이 커진 이유를 골라 볼까?',image:'cloud-growth-v1.png',choices:[['합쳐짐','작은 물방울들이 합쳐졌다'],['얼음','모두 얼음으로 변했다']]});
 Object.assign(scenes.ice,{title:'흰 노트의 차가운 구름',line:'왼쪽과 가운데 그림을 비교해 봐. 눈송이처럼 보이는 것은 어떻게 달라졌지?',image:'cloud-ice-v1.png',choices:[['자람','얼음 알갱이가 커졌다'],['사라짐','얼음 알갱이가 모두 사라졌다']]});
 function render(key,esc){const t=scenes[key];if(!t)return '';return `<section class="v3-question v3-clue"><small>소미 · 발견한 물건</small><h3>${esc(t.title)}</h3>${t.image?`<img class="v3-cloud-image" src="assets/chapter2-v3/${t.image}" alt="왼쪽부터 작은 알갱이, 성장, 떨어지는 모습"><small>구름 속을 확대한 설명 그림 · 실제 크기와 모양은 단순화했어요</small>`:""}<p>${esc(t.line)}</p><div class="v3-clue-actions">${t.choices.map(([value,label])=>`<button data-clue-answer="${esc(value)}">${esc(label)}</button>`).join('')}</div><button class="v3-clue-back" data-v3="cancel">물건 내려놓기</button></section>`;}
 function goal(s){
  if(s.room==='yard')return !s.seen.camera?'벤치에 남은 카메라를 살펴보자':!s.seen['weather-record']?'밤사이 비가 왔는지 기록을 보자':'잎·골대 앞·하늘을 비교해 보자';
  if(s.room==='prep')return !s.answers.wind?'환기창의 천으로 종이의 경로를 예상하자':!s.seen.recovered?'선반 아래 메모를 꺼낼 방법을 찾자':!s.seen.secured?'날리는 메모를 집게로 고정하자':!s.answers.manuscript?'녹음기 옆 테이프와 촬영 원고를 대조하자':!s.seen.inserted?'챙긴 테이프를 녹음기에 넣자':!s.seen.rewound?'테이프를 처음으로 되감자':'촬영 종료 뒤의 녹음까지 확인하자';
  if(s.room==='archive')return !s.answers.photo?'촬영 일지의 두 조건에 맞는 사진을 찾자':!s.seen.backRead?'찾은 사진의 뒷면을 보자':'봉투 안 실내 사진을 살펴보자';
  if(s.room==='weather')return !s.seen.noteOpened?'책상 위 접힌 쪽지를 살펴보자':!s.answers.density?'공기 비교 이름표와 벽의 관측 기록을 조사하자':!s.answers.high||!s.answers.low?'벽의 일기도와 고쳐진 설명을 비교하자':'같은 번호의 원본 보관란을 확인하자';
  return !s.answers.sea||!s.answers.land?'해안 영상과 이름표를 맞춰 보자':'낮 촬영본 끝의 녹음을 들어 보자';
 }
 function renderTape(s){
  const heard=s.tapeHeard||{},ready=heard.A&&heard.B;
  const captions={A:'강은호 · 육지가 바다보다 빨리 식었습니다. 지금 바람은 육지에서 바다 쪽으로 붑니다. 하나야, 바람 소리도 녹음됐어?',B:'강은호 · 햇볕을 받은 육지가 바다보다 빨리 데워졌습니다. 지금 바람은 바다에서 육지 쪽으로 붑니다. 어, 종이 날아간다!'};
  return `<section class="v3-question v3-tape-puzzle" aria-label="두 녹음 이어 듣기"><header><div><small>케이스에 남은 메모</small><h3>낮 촬영 다음에 밤 촬영</h3></div><button data-v3="cancel">내려놓기</button></header><div class="v3-track-pair">${['A','B'].map(id=>`<button data-tape-listen="${id}" aria-pressed="${s.tapeCaption===id}"><span class="v3-cassette" aria-hidden="true">◉ ━ ◉</span>녹음 ${id} 확인${heard[id]?' ✓':''}</button>`).join('')}</div><div class="v3-tape-caption" aria-live="polite"><small>녹음 내용 · 자막</small><p>${captions[s.tapeCaption]||'A와 B를 하나씩 눌러 녹음 내용을 확인하세요.'}</p></div><div class="v3-tape-order">${ready?'<p>소미 · 낮의 해풍, 밤의 육풍. 어느 순서로 이어질까?</p><button data-tape-answer="육풍해풍">A → B로 이어 듣기</button><button data-tape-answer="해풍육풍">B → A로 이어 듣기</button>':'<p>두 녹음을 확인하면 이어 들을 순서를 고를 수 있어요.</p>'}</div></section>`;
 }
 const api={render,goal,scenes,renderTape};if(typeof module!=='undefined')module.exports=api;root.Chapter2Interactions=api;
})(typeof window==='undefined'?globalThis:window);
