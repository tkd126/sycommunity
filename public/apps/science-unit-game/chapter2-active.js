(function(root){
 'use strict';
 const titles={mass:'지워진 실험 기록의 주인',breeze:'낮과 밤 촬영 모형 복원',pressure:'촬영일의 바람 모형 비교'};
 function act(s,a,say){
  if(a.type==='lab-open'){
   if(!(s.room==='prep'&&a.target==='breeze'||s.room==='weather'&&['mass','pressure'].includes(a.target)))return true;
   s.lab={kind:a.target,volume:'different',period:'day',left:1020,right:1016,observed:{},passed:{},runs:[]};s.question='';return true;
  }
  if(!s.lab)return false;
  const l=s.lab;
  if(a.type==='lab-close'){s.lab=null;return true;}
  if(a.type==='lab-set'){
   const k=a.target,v=a.value;
   if(l.kind==='mass'&&l.measured&&['volume','prediction','reason','measure'].includes(k))return true;
   if(k==='volume'&&['same','different'].includes(v)){l.volume=v;l.measured=false;}
   if(k==='mass-choice'&&['cold','warm'].includes(v))l.choice=v;
   if(k==='prediction'&&['cold','same','warm'].includes(v)){l.prediction=v;l.measured=false;}
   if(k==='reason'&&['density','ice','container','equal'].includes(v)){l.reason=v;l.measured=false;}
   if(k==='measure'){
    if(l.kind!=='mass'||l.volume==='same'&&l.prediction==='cold'&&l.reason==='density')l.measured=true;
    else{l.message='같은 부피에 들어 있는 공기의 양을 생각해 보자. 용기나 얼음의 무게를 비교하는 실험은 아니야.';return true;}
   }
   if(k==='period'&&['day','night'].includes(v)){l.period=v;l.rise='';l.direction='';}
   if(k==='observe')l.observed[l.period]=true;
   if(k==='rise'&&['land','sea'].includes(v))l.rise=v;
   if(k==='direction'&&['land','sea'].includes(v))l.direction=v;
   if(k==='left'&&[1012,1016,1020,1024].includes(Number(v)))l.left=Number(v);
   if(k==='run'&&!l.runs.includes(l.left))l.runs.push(l.left);
   if(k==='pressure-choice'&&['right-strong','left-strong','right-weak'].includes(v))l.choice=v;
   l.message='';return true;
  }
  if(a.type==='lab-finished'&&l.kind==='mass'&&l.measured){
   s.answers.density=true;s.answers['lab-mass']=true;s.lab=null;
   say(['소미','찬 공기가 더 무거웠어. 지워진 이름은 “찬 공기”였네.'],['태오','이 기록 뒤에 사진이 끼어 있어. 흐릿한 책상 부분을 크게 보자.'],['강은호','녹음테이프 아래 빨간 끈…… 우리가 주운 수첩이야. 같은 번호의 촬영 기록을 찾으면 하나 목소리도 남아 있을까?']);s.seen.massClue=true;return true;
  }
  if(a.type!=='lab-check')return true;
  let ok=false;
  if(l.kind==='mass'){
   ok=l.volume==='same'&&l.measured&&l.choice==='cold';
   l.message=l.volume!=='same'?'부피가 다르면 온도만의 영향을 비교하기 어려워. 두 공기를 같은 부피로 맞추자.':!l.measured?'먼저 저울 결과를 관찰해 보자.':'같은 부피와 기압에서 어느 공기 쪽이 내려갔는지 보자.';
  }else if(l.kind==='breeze'){
   const target=l.period==='day'?'land':'sea';
   if(l.observed[l.period]&&l.rise===target&&l.direction===target)l.passed[l.period]=true;
   l.message=l.passed[l.period]?'이 시간대 모형을 기록했어. 낮과 밤을 모두 비교하자.':'온도 변화를 먼저 관찰하고, 더 따뜻한 쪽에 상승 화살표를 놓자. 지표 바람은 그쪽으로 불어와.';
   ok=l.passed.day&&l.passed.night;
  }else{
   ok=l.runs.includes(1020)&&l.runs.includes(1024)&&l.choice==='right-strong';
   l.message='오른쪽은 1016으로 고정하고 왼쪽 1020과 1024를 각각 실행해 비교하자. 거리가 같을 때 기압차가 커지면 바람을 미는 힘도 커져.';
  }
  if(ok){if(l.kind==='mass')s.answers.density=true;s.answers['lab-'+l.kind]=true;s.lab=null;say(['소미',l.kind==='mass'?'같은 부피·기압에서 찬 공기가 더 무거웠어. 지워진 파란 이름표는 찬 공기 기록이었네.':l.kind==='breeze'?'낮에는 육지 위로, 밤에는 바다 위로 공기가 올라가는 모형이 됐어. 이제 테이프의 낮·밤 순서를 설명할 수 있겠어.':'오른쪽으로 부는 바람이 더 강해졌어. 간격이 같은 모형에서는 기압차가 클수록 바람을 미는 힘이 커지네. 촬영 기록의 강한 바람 표시와 맞아.']);}
  return true;
 }
 function apparatus(l){
  const control=(key,value,label,x,y)=>`<button class="lab-touch" style="left:${x}%;top:${y}%" data-lab-key="${key}" data-lab-value="${value}" ${key==='measure'&&(!l.prediction||!l.reason)?'disabled':''}>${key==='measure'?'예상 확인 후 실험 실행':label}</button>`;
  const svg=(content,label)=>`<svg viewBox="0 0 900 360" role="img" aria-label="${label}"><defs><linearGradient id="lab-metal" x2="1" y2="1"><stop stop-color="#eef1d7"/><stop offset=".4" stop-color="#799697"/><stop offset=".6" stop-color="#dae4d2"/><stop offset="1" stop-color="#44676b"/></linearGradient><linearGradient id="lab-sky" x2="0" y2="1"><stop stop-color="${l.period==='night'?'#172e51':'#7499aa'}"/><stop offset="1" stop-color="${l.period==='night'?'#51687d':'#d4dece'}"/></linearGradient></defs>${content}</svg>`;
  if(l.kind==='mass'){
   const tilt=l.measured?(l.volume==='same'?-7:7):0;
   const jar=(x,cold)=>`<g transform="translate(${x} 0)"><path d="M-40 150 L-40 70 Q-40 57 -28 57 L28 57 Q40 57 40 70 L40 150 Q40 164 28 164 L-28 164Z" fill="${cold?'#b9e3ea':'#f0c2a2'}" fill-opacity=".8" stroke="#334f56" stroke-width="4"/><rect x="-43" y="48" width="86" height="14" rx="4" fill="url(#lab-metal)" stroke="#334f56" stroke-width="3"/><path d="M-29 76V144 M24 85H36 M24 105H36 M24 125H36" stroke="#f8ffef" stroke-width="4"/><text y="103" text-anchor="middle">${cold?'10℃':'30℃'}</text><text y="137" text-anchor="middle">${cold||l.volume==='same'?'1 L':'2 L'}</text></g>`;
   return `<div class="lab-apparatus mass-apparatus">${svg(`<rect width="900" height="360" fill="#b6bfb2"/><path d="M0 275H900V360H0Z" fill="#9b7350"/><path d="M0 290H900M0 330H900" stroke="#77573d" stroke-width="3"/><path d="M397 278H503L483 260H462V150H438V260H417Z" fill="url(#lab-metal)" stroke="#34494c" stroke-width="4"/><g class="lab-beam" style="--tilt:${tilt}deg"><path d="M225 172L450 158L675 172" fill="none" stroke="#34494c" stroke-width="13"/><path d="M225 172L450 158L675 172" fill="none" stroke="#e5d596" stroke-width="5"/>${jar(225,true)}${jar(675,false)}<path d="M160 168Q225 204 290 168M610 168Q675 204 740 168" fill="#d0c795" stroke="#405859" stroke-width="4"/></g><circle cx="450" cy="158" r="12" fill="#c5a865" stroke="#34494c" stroke-width="4"/>`,'용기 무게를 제외한 공기 비교 모형: '+(l.measured?(l.volume==='same'?'찬 공기 쪽이 낮음':'따뜻한 공기 2리터 쪽이 낮음'):'저울 고정 중'))}<div class="mass-run-slot"><button type="button" data-lab-key="measure" data-lab-value="yes" ${l.volume!=='same'||!l.prediction||!l.reason||l.measured?'disabled':''}>${l.measured?'실험 결과 관찰 중':'예상 확인 후 실험 실행'}</button></div></div>`;
  }
  if(l.kind==='breeze'){
   const seen=l.observed[l.period],day=l.period==='day';
   return `<div class="lab-apparatus breeze-apparatus">${svg(`<rect width="900" height="360" fill="url(#lab-sky)"/><circle cx="105" cy="66" r="32" fill="${day?'#ffe9a1':'#e8edf1'}"/>${day?'':'<circle cx="120" cy="55" r="30" fill="#203958"/>'}<path d="M0 232Q220 220 450 243V360H0Z" fill="#578e9e"/><path d="M450 243Q610 193 900 216V360H450Z" fill="#baa978"/><path d="M0 258Q90 245 180 259T360 259M30 297Q130 285 220 299T420 299" fill="none" stroke="#b9e0de" stroke-width="3"/><path d="M450 246Q650 213 900 225" fill="none" stroke="#e9d5a0" stroke-width="10"/><path d="M760 209V137L716 176H804L760 137" fill="#53685a" stroke="#40524a" stroke-width="5"/><text x="190" y="325">바다</text><text x="690" y="325">육지</text>${seen?`<text x="170" y="125">20℃</text><text x="670" y="125">${day?30:10}℃</text>`:''}${l.rise?`<path class="lab-updraft" d="M${l.rise==='sea'?250:650} 218V115m-14 18 14-18 14 18" fill="none" stroke="#f3b167" stroke-width="8"/>`:''}${l.direction?`<path class="lab-airflow" d="${l.direction==='land'?'M310 235H590m-22-15 22 15-22 15':'M590 235H310m22-15-22 15 22 15'}" fill="none" stroke="#f7f1c7" stroke-width="8"/>`:''}`,'해안 모형: '+(day?'낮':'밤'))}${control('observe','yes','온도계 읽기',50,12)}${control('rise','sea','바다 위 ↑',24,48)}${control('rise','land','육지 위 ↑',76,48)}</div>`;
  }
  const running=l.runs.includes(l.left),difference=l.left-1016;
  const speed=Math.abs(difference)===8?.65:1.5;
  return `<div class="lab-apparatus pressure-apparatus">${svg(`<rect width="900" height="360" fill="#bdc9c1"/><rect x="75" y="75" width="750" height="200" rx="24" fill="#dce7dd" stroke="#486466" stroke-width="6"/><path d="M290 85V265M610 85V265" stroke="#8aa49f" stroke-width="3" stroke-dasharray="8 6"/><text x="140" y="145">${l.left} hPa</text><text x="652" y="145">1016 hPa</text><path d="M450 190V278" stroke="#5d6151" stroke-width="10"/><g class="lab-pinwheel ${running&&difference?'is-running':''}" style="--spin-time:${speed}s;--spin-direction:${difference<0?'reverse':'normal'}"><path d="M450 178Q385 100 420 105L450 178Q535 115 524 152L450 178Q525 248 482 250L450 178Q366 239 376 205Z" fill="#d6a557" stroke="#805e32" stroke-width="3"/><circle cx="450" cy="178" r="10" fill="#f8df9a"/></g>${running&&difference?`<path class="lab-airflow" d="${difference>0?'M300 230H600m-20-14 20 14-20 14':'M600 230H300m20-14-20 14 20 14'}" stroke="#4a7d88" stroke-width="${Math.abs(difference)===8?9:5}" fill="none"/>`:''}<text x="315" y="315">${running?difference?'바람의 방향과 세기 관찰':'기압차 없음 · 멈춤':'장치를 실행해 보자'}</text>`,'기압차에 따라 돌아가는 바람개비 모형')}${control('run','yes','▶ 바람 관찰 시작',50,84)}</div>`;
 }
 function render(l){
  const b=(key,value,label)=>`<button type="button" data-lab-key="${key}" data-lab-value="${value}" aria-pressed="${String(l[key])===String(value)}">${label}</button>`;
  let body='';
  if(l.kind==='mass')body=`<fieldset><legend>① 비교 조건</legend>${b('volume','same','두 공기를 같은 1 L로 맞추기')}</fieldset><fieldset><legend>② 어느 공기가 더 무거울까?</legend><div class="lab-options">${b('prediction','cold','찬 공기')}${b('prediction','same','무게가 같다')}${b('prediction','warm','따뜻한 공기')}</div></fieldset><fieldset><legend>③ 그렇게 예상한 이유</legend><div class="lab-options lab-reasons">${b('reason','density','같은 부피에 찬 공기가 더 많이 들어 있다')}${b('reason','ice','찬 공기 안에 얼음이 있다')}${b('reason','container','차가운 용기가 더 무겁다')}${b('reason','equal','부피가 같으면 항상 무게도 같다')}</div></fieldset>`;

  if(l.kind==='breeze')body=`${b('period','day','낮으로 바꾸기')}${b('period','night','밤으로 바꾸기')}<p>온도계를 읽고 더 따뜻한 쪽에 상승 화살표를 놓아 보자. 지표 부근 바람은?</p>${b('direction','land','바다 → 육지')}${b('direction','sea','육지 → 바다')}<p>복원한 장면: 낮 ${l.passed.day?'✓':'—'} / 밤 ${l.passed.night?'✓':'—'} · 실제 날씨를 단순화한 모형</p>`;
  if(l.kind==='pressure')body=`<p>촬영 기록: 왼쪽 1020 → 1024 hPa, 오른쪽 1016 hPa. 거리와 다른 조건은 같습니다.</p>${[1012,1016,1020,1024].map(v=>b('left',v,`왼쪽 ${v}`)).join('')}<p>그림의 스위치로 두 조건을 실행해 비교하세요. 관찰한 기압: ${l.runs.join(', ')||'없음'}. 1020에서 1024로 바꾸면?</p>${b('pressure-choice','right-strong','오른쪽으로 더 강하게')}${b('pressure-choice','left-strong','왼쪽으로 더 강하게')}${b('pressure-choice','right-weak','오른쪽으로 더 약하게')}<p>선택: ${({'right-strong':'오른쪽·강하게','left-strong':'왼쪽·강하게','right-weak':'오른쪽·약하게'})[l.choice]||'없음'}</p>`;
  const intro={mass:'소미 · 공기 이름이 지워졌어. 결과를 예상하고 비교하면 이 기록의 주인을 알 수 있겠지?',breeze:'강은호 · 테이프의 해안 장면 순서가 뒤섞였어. 모형으로 낮과 밤의 바람을 비교해 보자.',pressure:'소미 · 녹음에는 바람 소리가 점점 커져. 기압 기록을 바꿔 보면서 장면과 맞춰 볼까?'};
  return `<section class="v3-lab ${l.kind==='mass'?'v3-mass':''} ${l.measured?'is-measured':''}" aria-label="${titles[l.kind]}"><header><h2>${titles[l.kind]}</h2><button data-lab-close="true">장면으로 돌아가기</button></header><p class="lab-story">${intro[l.kind]}</p>${apparatus(l)}<div class="lab-controls">${body}</div><p class="lab-feedback" role="status">${l.message||'장치의 변화를 관찰하며 기록을 맞춰 보자.'}</p>${l.kind!=='mass'?'<button class="lab-confirm" data-lab-check="true">✓ 이 관찰로 기록 복원하기</button>':''}</section>`;
 }
 const api={act,render};if(typeof module!=='undefined')module.exports=api;root.Chapter2Active=api;
})(typeof window==='undefined'?globalThis:window);
