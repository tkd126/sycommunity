(function(root){
 'use strict';
 const data={
  fog:{title:'뿌연 운동장의 정체',keys:['grass','air','sky'],intro:'하나: 렌즈를 닦아도 골대가 뿌옇네. 어디에 물방울이 있는지 같이 봐 줘.',cards:[
   ['grass','풀잎 가까이','밤에 차가워진 풀잎 표면에 작은 물방울이 맺혀 있다. 오늘 기온은 영상 6℃. 비는 오지 않았다.'],
   ['air','골대 쪽 공기','지면 가까운 공기 속에 작은 물방울이 떠 있다. 가까운 친구는 보이지만 먼 골대는 흐릿하다.'],
   ['sky','운동장 위 하늘','머리 위 높은 하늘에 작은 물방울이 모인 흰 덩어리가 떠 있다.']]},
  wind:{title:'날아간 순서표',keys:['pressure','ribbon'],intro:'은호: 종이는 운동장 가운데에서 놓쳤어. 관측판은 방향을 짐작하는 단서, 깃발은 지금 바람의 단서야.',cards:[
   ['pressure','기압 관측판','서쪽 1024 hPa / 동쪽 1016 hPa. 같은 시각·비슷한 높이에서 잰 값이다. 단순화한 모형에서 공기는 기압이 높은 쪽에서 낮은 쪽으로 움직인다.'],
   ['ribbon','현재 깃발','깃대에서 늘어진 깃발 끝이 동쪽으로 뻗는다. 지금은 서쪽에서 동쪽으로 바람이 분다. 동쪽 생울타리 밑에는 종잇조각이 보인다.']]},
  schedule:{title:'마지막 경기를 열어도 될까?',keys:['morning','noon','ground'],intro:'선생님: 아침에 정한 일정이라도 상황이 바뀌면 고쳐야 해. 서로 다른 자료를 모아서 제안해 보렴.',cards:[
   ['morning','오전 관측','09시: 안개, 6℃, 약한 바람. 10시: 안개가 걷힘, 8℃, 약한 바람.'],
   ['noon','11시 새 예보','저기압 접근. 구름이 많아지고 비가 올 가능성이 커짐. 오후에는 바람도 강해질 전망. 예보는 바뀔 수 있어 최신 정보를 확인해야 한다.'],
   ['ground','현재 운동장','빗방울이 떨어지기 시작했고 바닥이 미끄럽다. 천막 끈이 크게 흔들린다. 강당은 사용 가능하다.']]},
  photo:{title:'시계 없는 사진 · 심화 추리',keys:['log','photo','voice'],intro:'은호: 카메라 시계는 고장이야. 기록은 같은 날 같은 운동장에서 남겼고, 후보 시각은 표의 세 개뿐이래.',cards:[
   ['log','날씨 기록','10:00 · 안개 없음 / 서풍 / 비 없음\n10:20 · 안개 없음 / 북풍 / 비 없음\n10:40 · 안개 없음 / 북풍 / 비 시작'],
   ['photo','경기 사진 관찰','깃발 끝은 남쪽으로 뻗는다. 사진을 찍기 직전까지 새 순서표를 처마 밑에 두었다. 꺼내 든 종이에는 빗방울 자국이 없다.'],
   ['voice','동시에 녹음한 말','“하나야, 결승선이다! 아직 비는 안 와. 다음 경기까지는 쉬자.”\n녹음기와 카메라를 동시에 켰다는 선생님의 기록이 있다.']]}
 };
 function initial(kind,saved){
  if(!data[kind])throw new Error('Unknown weather activity');
  const valid=saved&&saved.kind===kind;
  return {kind,step:valid&&Number.isInteger(saved.step)?Math.max(0,Math.min(kind==='photo'?3:2,saved.step)):0,seen:valid&&Array.isArray(saved.seen)?saved.seen.filter(k=>data[kind].keys.includes(k)):[],complete:!!(valid&&saved.complete),message:valid&&typeof saved.message==='string'?saved.message:data[kind].intro};
 }
 function act(previous,a){
  const s=initial(previous.kind,previous),d=data[s.kind];
  if(s.complete)return s;
  if(a.type==='inspect'&&d.keys.includes(a.value)){if(!s.seen.includes(a.value))s.seen.push(a.value);s.message=d.cards.find(c=>c[0]===a.value)[2];return s;}
  if(!d.keys.every(k=>s.seen.includes(k))){s.message='소미: 아직 보지 않은 기록이 있어. 추측하기 전에 직접 확인해 보자.';return s;}
  const wrong=text=>{s.message=text;return s;};
  if(s.kind==='fog'){
   if(s.step===0&&a.type==='classify'){
    if(!a.value||a.value.grass!=='dew'||a.value.air!=='fog'||a.value.sky!=='cloud')return wrong('소미: 표면에 붙은 물방울과 공중에 떠 있는 물방울을 나눠 봐. 떠 있다면 지면 가까이인지 높은 하늘인지도 봐 줘.');
    s.step=1;s.message='하나: 풀잎은 이슬, 골대 앞은 안개, 높은 하늘은 구름이네. 그럼 이 작은 물방울들은 어떻게 생긴 걸까?';
   }else if(s.step===1&&a.type==='cause'){
    if(a.value!=='condense')return wrong('소미: 보이지 않는 수증기 자체와 눈에 보이는 작은 물방울은 달라. 공기가 차가워질 때 어떤 변화가 생길까?');
    s.complete=true;s.step=2;s.message='소미: 공기 중 수증기가 응결해 작은 물방울이 된 거야. 렌즈가 아니라 운동장 공기 속 안개라서, 닦아도 먼 골대가 안 보였어.';
   }
  }else if(s.kind==='wind'){
   if(s.step===0&&a.type==='direction'){
    if(a.value!=='east')return wrong('은호: 서풍은 서쪽으로 가는 바람이 아니라 서쪽에서 불어오는 바람이야. 깃발 끝이 향하는 쪽을 다시 봐.');
    s.step=1;s.message='은호: 동쪽으로 움직였겠네. 기압판만으로 종이 위치를 확정할 수는 없으니 지도에서 직접 찾아보자.';
   }else if(s.step===1&&a.type==='search'){
    if(a.value!=='east')return wrong('태오: 여긴 낙엽뿐이야. 지금 깃발 방향과 종잇조각을 본 위치를 함께 생각해 봐.');
    s.complete=true;s.step=2;s.message='하나: 동쪽 생울타리에 걸렸어! 내 이름도 아직 있어. 집게로 다시 고정하자.';
   }
  }else if(s.kind==='schedule'){
   if(s.step===0&&a.type==='plan'){
    if(a.value!=='inside')return wrong('소미: 지금은 비가 시작됐고 바닥도 미끄러워. 실내에서 계속할 수 있는 활동은 없을까?');
    s.step=1;s.message='태오: 야외 경기는 멈추고 실내로 옮기자고 할게. 선생님께 어떤 근거를 함께 말씀드릴까?';
   }else if(s.step===1&&a.type==='reason'){
    if(a.value!=='combined')return wrong('소미: 저기압이면 언제나 비가 온다고 단정할 수는 없어. 새 예보와 실제 바람, 빗방울, 바닥 상태를 함께 봐야 해.');
    s.complete=true;s.step=2;s.message='선생님: 최신 예보와 지금의 위험을 함께 살폈구나. 야외 경기를 중단하고 강당으로 이동하자.';
   }
  }else if(s.kind==='photo'){
   if(s.step===0&&a.type==='time'){
    const value=String(a.value||'').normalize('NFKC').replace(/\s/g,'').replace('시',':').replace('분','');
    if(value!=='10:20')return wrong('소미: 깃발은 바람이 불어가는 쪽으로 뻗어. 남쪽으로 뻗었다면 무슨 바람일까? 그중 녹음에서 비가 안 온다고 한 시각을 골라 봐.');
    s.step=1;s.message='은호: 북풍이 불고 아직 비가 안 온 10시 20분! 경기 사진과 녹음이 같은 순간을 가리켜. 이제 새 단체 사진에는 하나 얼굴이 가려지지 않게 하자.';
   }else if(s.step===1&&a.type==='arrange'){
    if(a.value!=='front')return wrong('하나: 그 위치면 내 얼굴이 또 가려져. 키 큰 친구 뒤 말고 앞줄로 가도 될까?');
    s.step=2;s.message='하나: 앞줄이면 얼굴이 보여. 사진 한 장만 남기면… 그걸 잃어버릴 때는 어떡하지?';
   }else if(s.step===2&&a.type==='protect'){
    if(a.value!=='copy')return wrong('소미: 한 봉투를 잃으면 전부 잃게 되잖아. 원본 필름과 인화 사진, 옮겨 쓴 기록은 나눠 보관하자.');
    s.step=3;s.complete=true;s.message='소미: 선생님이 필름을 맡기고, 인화 사진은 우리가 받고, 이름과 촬영 시각은 수첩에도 남기자. 하나가 여기 있었다는 증거를 하나씩 지키는 거야.';
   }
  }
  return s;
 }
 function mount(host,kind,done,saved,onSave=()=>{}){
  let s=initial(kind,saved),disposed=false;
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function buttons(type,items){return '<div class="weather-options">'+items.map(([value,label])=>'<button type="button" data-action="'+type+'" data-value="'+value+'">'+label+'</button>').join('')+'</div>';}
  function render(){
   if(disposed)return;const d=data[kind],ready=d.keys.every(k=>s.seen.includes(k));let controls='';
   if(s.complete)controls='<button type="button" data-finish class="primary-btn">친구들과 이야기 이어가기</button>';
   else if(!ready)controls='<p class="weather-prompt">관찰할 곳을 눌러 기록을 확인해 보자. '+s.seen.length+'/'+d.keys.length+'</p>';
   else if(kind==='fog'&&s.step===0)controls='<form data-classify><h3>관찰 기록에 이름표 붙이기</h3>'+[['grass','풀잎 표면'],['air','골대 앞 공기'],['sky','높은 하늘']].map(([key,label])=>'<label>'+label+'<select name="'+key+'" required><option value="">이름표 선택</option><option value="cloud">구름</option><option value="dew">이슬</option><option value="fog">안개</option></select></label>').join('')+'<button type="submit">이름표를 비교해 보기</button></form>';
   else if(kind==='fog')controls='<h3>물방울이 생긴 까닭은?</h3>'+buttons('cause',[['evaporate','풀잎의 물이 증발해서 그대로 눈에 보인다.'],['condense','공기 중 수증기가 응결해 작은 물방울이 되었다.'],['rain','하늘에서 내린 비가 세 곳에 모두 남았다.']]);
   else if(kind==='wind'&&s.step===0)controls='<h3>순서표가 움직였을 방향은?</h3>'+buttons('direction',[['west','← 서쪽'],['east','동쪽 →'],['north','↑ 북쪽'],['south','↓ 남쪽']]);
   else if(kind==='wind')controls='<h3>직접 찾아볼 곳을 누르자</h3><div class="weather-map"><span class="map-north">북 ↑</span><span class="map-center">종이를 놓친 곳<br>운동장 가운데</span><button data-action="search" data-value="north" class="map-n">북쪽 창고</button><button data-action="search" data-value="west" class="map-w">서쪽 벤치</button><button data-action="search" data-value="east" class="map-e">동쪽 생울타리</button><button data-action="search" data-value="south" class="map-s">남쪽 화단</button></div>';
   else if(kind==='schedule'&&s.step===0)controls='<h3>다음 활동을 어떻게 바꿀까?</h3>'+buttons('plan',[['run','아침에 맑았으니 예정대로 달리기를 한다.'],['tent','흔들리는 천막 아래에서 비가 그치기를 기다린다.'],['inside','야외 경기는 중단하고 강당에서 행사와 촬영을 이어간다.'],['alone','친구들끼리 운동장 구석에서 먼저 사진을 찍는다.']]);
   else if(kind==='schedule')controls='<h3>제안에 붙일 근거 고르기</h3>'+buttons('reason',[['always','저기압이면 반드시 하루 종일 비가 오기 때문이다.'],['combined','새 예보에 더해 실제 강한 바람·빗방울·미끄러운 바닥을 확인했다.'],['morning','아침 기온만으로 오후 날씨를 모두 알 수 있다.']]);
   else if(s.step===0)controls='<form data-time><h3>경기 사진이 찍힌 시각은?</h3><label for="weather-time">후보 세 시각 중 하나를 입력해 봐.</label><input id="weather-time" name="time" placeholder="예: 10:00" maxlength="12" autocomplete="off" required><button type="submit">세 기록을 연결하기</button></form>';
   else if(s.step===1)controls='<h3>단체 사진 속 하나의 자리</h3>'+buttons('arrange',[['behind','키 큰 친구 뒤쪽에 선다.'],['front','앞줄에서 얼굴을 가리는 소품을 내려놓는다.'],['umbrella','우산을 얼굴 앞으로 든다.']]);
   else controls='<h3>기록은 어떻게 보관할까?</h3>'+buttons('protect',[['one','필름·사진·수첩을 모두 한 봉투에 넣는다.'],['copy','인화 사진과 필름은 나누고, 이름·시각은 수첩에도 옮긴다.'],['memory','이제 기억하니까 기록은 치운다.']]);
   host.innerHTML='<section class="weather-workbench"><header><span class="mission-kicker">2단원 · 날씨와 우리 생활</span><h2>'+d.title+'</h2><p>관찰 → 판단 → 친구들과 확인</p></header><div class="weather-columns"><aside aria-label="관찰 기록"><h3>직접 확인할 기록</h3>'+d.cards.map(([key,title,text])=>'<button class="weather-record" data-action="inspect" data-value="'+key+'" aria-expanded="'+s.seen.includes(key)+'"><b>'+title+(s.seen.includes(key)?' ✓':'')+'</b><span>'+(s.seen.includes(key)?esc(text).replace(/\n/g,'<br>'):'눌러서 살펴보기')+'</span></button>').join('')+'<small>게임용 가상 관측 기록입니다. 실제 기상 안전 기준이나 실시간 예보가 아닙니다.</small></aside><div class="weather-task"><div class="weather-feedback" role="status">'+esc(s.message).replace(/\n/g,'<br>')+'</div>'+controls+'</div></div></section>';
   host.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>submit({type:b.dataset.action,value:b.dataset.value}));
   const form=host.querySelector('form');if(form)form.onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(form));submit(form.hasAttribute('data-time')?{type:'time',value:values.time}:{type:'classify',value:values});};
   const finish=host.querySelector('[data-finish]');if(finish)finish.onclick=()=>{if(!disposed){disposed=true;done();}};
  }
  function submit(action){s=act(s,action);onSave(s);render();}
  host.classList.add('weather-panel');render();return()=>{disposed=true;host.classList.remove('weather-panel');};
 }
 const api={initial,act,mount};if(typeof module!=='undefined')module.exports=api;root.WeatherChapter=api;
})(typeof window==='undefined'?globalThis:window);
