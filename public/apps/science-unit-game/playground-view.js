(function(root){
 'use strict';
 const titles={fog:'골대 뒤에서 들린 목소리',wind:'촬영 메모와 운동장',locker:'방송석의 녹음',pack:'처마 아래 기록 보관',photo:'사진관의 세 기록'};
 const descriptions={grass:'풀잎 표면에 물방울이 있어. 모습만으로 이슬인지 비인지 확정할 수는 없어. 선생님 기록에는 밤에 비가 안 왔고 아침부터 물방울이 있었다고 적혀 있어.',air:'가까운 카메라는 또렷한데 먼 골대는 흐려. 먼 골대 앞 공기 속 물방울이 시야를 가리는 거야.',sky:'구름은 운동장보다 높은 하늘에 있어. 물방울이 모인 위치가 다르네.',lens:'렌즈 표면에도 물방울이 있어. 옆의 마른 천을 챙겨 닦아 보자.',store:'선생님께 허락받은 열쇠로 여는 창고야.',board:'함께 읽은 촬영 촬영 메모: 3번 강은호 → 4번 윤하나. 집게로 게시대에 고정하자.',hedge:'낮은 울타리야. 종이가 걸리면 넘어가지 말고 집게봉으로 꺼내자.',morning:'아침에는 바닥이 말라 있었어. 지금 상태와 달라.',forecast:'새 예보에는 비와 강한 바람이 있어. 선생님이 실내로 이동하자고 하셨어.',ground:'처마 밖에 새 빗방울 자국이 생겼어. 우리는 안에서 기록을 정리하자.',photo:'A는 출발 준비, B는 3번에서 4번으로 원고 전달, C는 빈 트랙과 빗방울 자국. 사진 옆 깃발 스케치도 비교하자.',log:'10:00 서풍·마른 땅 / 10:20 북풍·마른 땅 / 10:40 북풍·첫 비. 선생님은 이 세 관측 시각에 한 장씩 찍으셨어.',voice:'태오가 방송석에서 녹음했어. 은호: “하나야, 소개 원고 받아.” 하나: “받았어. 다음은 내가 읽을게.”'};
 const field={store:[10.4,34,6.3,17],board:[80,60,9,8],hedge:[84,42,15,13],flag:[43.6,10.4,3.2,4.4],lens:[11,75,7,8],cloth:[17,81,7,7],grass:[1,59,9,11],air:[57,28,21,21],sky:[34,2,25,14]};
 const labels={store:'창고 문',board:'촬영 메모 게시대',hedge:'낮은 울타리',flag:'깃발',lens:'카메라 렌즈',cloth:'마른 천',grass:'물방울 맺힌 풀잎',air:'골대 앞의 뿌연 공기',sky:'높은 하늘',recorder:'녹음기',chest:'테이프 보관함',box:'기록 상자 안쪽',forecast:'새 예보',ground:'현재 바닥',morning:'아침 기록',photo:'인화 사진',log:'관측 일지',voice:'원고 전달 녹음'};
 const scenery={
  shed:'문이 단단히 잠겨 있어. 안에서 대답하는 소리도 없어. 억지로 열지는 말자.',
  weatherBox:'백엽상이야. 햇빛과 비를 막고 바람은 통하게 되어 있어. 안의 온도계를 보호하는 집이지. 사람 숨을 곳은 아니네.',
  school:'창문 너머 복도에는 아무도 안 보여. 아까 대답은 건물 쪽이 아니라 골대 쪽에서 들렸어.',
  bucket:'빈 양동이네. 누가 뒤에 숨어 있나 했더니, 손잡이가 바람에 흔들린 소리였어.',
  cart:'청소 도구를 실어 놓은 수레야. 바퀴가 눈에 박혀 있어. 지금 움직인 흔적은 없어.',
  cone:'미끄러운 곳을 표시한 고깔이야. 이쪽으로 뛰어가면 안 되겠다.',
  speakerBox:'방송 스피커는 조용해. 방금 대답은 방송이 아니었어.',
  equipmentBox:'방송 장비 상자야. 전선이 연결돼 있으니 함부로 만지지는 말자.',
  ball:'축구공이 놓여 있어. 찾던 사람부터 만나고, 주인은 나중에 알아보자.',
  bench:'촬영 장비를 잠깐 내려놓은 자리 같아. 카메라와 천이 나란히 있네.',
  tree:'바람에 가지가 서로 부딪히네. 인기척인 줄 알고 깜짝 놀랐어.',
  track:'눈 위로 운동장 선이 보여. 앞이 잘 안 보이니 선을 따라 천천히 가자.',
  fence:'낮아 보여도 넘어가지는 말자. 골대로 가는 길은 오른쪽에 있어.',
  radio:'녹음기는 멈춰 있어. 지금 들리는 목소리를 여기서 틀어 놓은 건 아니야.',
  shelter:'의자에는 아무도 없어. 처마 아래라 바닥은 운동장보다 덜 젖었네.'
 };
 const outlines={store:'M10.7 34.4 L16.2 35 V50.5 L10.7 51 Z',lens:'M11.8 78 L12.5 77.5 V76.7 H14.4 L14.8 76.3 H15.7 L16.6 77.5 V81 L13.3 82.2 L11.8 81.6 Z',flag:'M44 10.8 L46.5 12.7 L44 14.3 Z',air:'M58 44 Q56 39 59 35 Q62 31 67 33 Q72 30 76 34 Q80 38 76 44 Q68 49 58 44 Z',grass:'M1 69 Q3 65 2 61 Q4 64 5 68 Q5 62 7 59 Q6 65 9 68',sky:'M35 12 Q35 7 40 7 Q42 3 48 5 Q54 3 58 8 Q60 11 58 14 L36 14 Z',cloth:'M17 85 Q18 81 22 82 L24 87 Q21 86 18 88 Z',hedge:'M84 52 Q85 47 87 48 Q87 43 90 45 Q92 42 95 45 Q98 44 99 50 L98 54 L85 55 Z',board:'M80 60 L89 60 L89 66 L85 66 L85 68 M84 66 L80 66 Z',recorder:'M4 59 L9 50 L28 53 L29 73 L24 79 L4 77 Z',chest:'M33 51 L40 45 L66 49 L67 67 L59 73 L33 68 Z',box:'M33 51 L40 45 L66 49 L67 67 L59 73 L33 68 Z'};
 function mount(panel,mode,onDone,saved,onSave=()=>{},onSound=()=>{},options={}){
  let game=Playground.initial(mode,saved&&saved.game),peek=false,bag=false,detail='',reply='',dead=false,disposeEvidence=null;
  let typingTimer=null,finishTyping=null,exploring=false,completed=false;
  let evidenceState=saved&&saved.evidence,replySpeaker='소미';
  const legacyFogAnswers=Number.isInteger(saved?.fogAnswers)?Math.max(0,Math.min(2,saved.fogAnswers)):0;
  if(mode==='fog'&&!saved?.game?.weatherConcepts){
   if(legacyFogAnswers>=1&&game.seen.includes('air'))game.weatherConcepts.fog=true;
   if(legacyFogAnswers>=2&&game.seen.includes('grass'))game.weatherConcepts.dew=true;
  }
  const prepare=options.prepare===true,legacyComplete=!!saved?.legacyComplete;
  descriptions.lens='카메라로 골대 쪽을 보려는데 렌즈 표면부터 흐려. 작은 물방울이 붙어 있네. 천으로 닦은 뒤 맨눈으로 본 풍경과 비교해 보자.';
  descriptions.board='원고를 건네는 강은호 → 다음 소개를 읽는 윤하나. 촬영 중 볼 수 있도록 메모를 집게로 고정하자.';
  descriptions.photo='A는 원고를 펼친 모습, B는 원고를 주고받는 모습, C는 빗방울 자국이 생긴 자리야. 사진 옆 깃발 스케치도 비교해 보자.';
  for(const [id,,x,y,w,h,path] of root.HanaSearchView?.spots||[]){
   if(id==='cloth'||id==='camera'){
    const key=id==='camera'?'lens':id;field[key]=[x,y,w,h];outlines[key]=path;
   }
  }
  if(mode==='wind'&&prepare&&!game.permission)game=Playground.act(game,{type:'teacher-permission'});
  if(mode==='wind'&&!prepare&&!game.gust){
   if(!game.permission)game=Playground.act(game,{type:'teacher-permission'});
   game.initialFixed=true;game=Playground.act(game,{type:'gust'});game.selected='';
  }
  const timed=(mode==='wind'&&!prepare)||mode==='pack';
  const clock=ActivityClock.create(mode==='wind'?35000:45000,saved?.clock);
  if(!saved?.clock)clock.unlimited();
  const esc=RoomScene.esc;
  const button=(action,label)=>'<button type="button" data-pg="'+action+'">'+esc(label)+'</button>';
  const save=()=>onSave({game,clock:clock.snapshot(),evidence:evidenceState});
  function completeIfReady(){
   if(dead||completed)return completed;
   if(mode==='fog'&&Playground.ready(game)&&Playground.weatherConceptsReady(game))game=Playground.act(game,{type:'wait'});
   if(game.complete||(prepare&&game.initialFixed)){
    completed=true;save();onDone();return true;
   }
   if(mode==='photo'&&Playground.ready(game))detail='evidence';
   return false;
  }
  function doAct(type,value){
   exploring=false;
   const before=game;game=Playground.act(game,{type,value});
   const changed=JSON.stringify({...before,message:'',speaker:''})!==JSON.stringify({...game,message:'',speaker:''});
   reply=!changed&&['use','direction','close','take','wait','play'].includes(type)?'괜찮아. 물건은 그대로 있어. 다시 살피고 다른 방법을 써 보자.':'';
   replySpeaker=game.speaker==='소미'?'태오':'소미';
   if(type==='select')bag=false;
   if(type==='use'&&changed)game.selected='';
   if(type==='play'&&game.heard&&!before.heard)onSound('tape');else if(changed)onSound('paper');
   clock.pause();save();
  }
  function hotspot(id,coords){
   const [x,y,w,h]=coords;
   const path=outlines[id]||'M'+x+' '+y+' H'+(x+w)+' V'+(y+h)+' H'+x+' Z';
   return '<button type="button" class="room-hotspot '+(peek?'revealed':'')+'" data-pg="spot:'+id+'" aria-label="'+labels[id]+' 조사" style="left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%"><svg class="room-object-glow" viewBox="'+[x,y,w,h].join(' ')+'" preserveAspectRatio="none" aria-hidden="true"><path d="'+path+'"/></svg><span>'+labels[id]+'</span></button>';
  }
  function modal(title,body,wide=false){return '<section class="room-modal pg-modal '+(wide?'pg-wide':'')+'" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="room-modal-content">'+button('close','닫기 · 장면으로')+'<h2>'+esc(title)+'</h2>'+body+'</div></section>';}
  function art(){if(mode==='photo')return 'assets/photo-studio-cartoon-v2.png';if(['locker','pack'].includes(mode))return 'assets/playground-desk-cartoon-v3.png';return 'assets/playground-field'+(mode==='wind'&&game.storeOpen?'-open':'')+'-cartoon-v3.png';}
  function render(focus=false){
   panel.classList.toggle('pg-exploring',exploring);
   clearInterval(typingTimer);finishTyping=null;
   if(disposeEvidence){disposeEvidence();disposeEvidence=null;}
   let spots='';
   if(mode==='fog'||mode==='wind')for(const entry of root.HanaSearchView?.spots||[]){
    const [id,label,x,y,w,h,path]=entry;
    if(!scenery[id]||(mode==='wind'&&id==='shed'))continue;
    labels[id]=label;field[id]=[x,y,w,h];if(path)outlines[id]=path;
    spots+=hotspot(id,field[id]);
   }
   if(mode==='fog')for(const id of ['lens','cloth','grass','air','sky'])spots+=hotspot(id,field[id]);
   if(mode==='wind')for(const id of ['store','board','hedge','flag'])spots+=hotspot(id,field[id]);
   if(mode==='locker')spots=hotspot('recorder',[3,49,27,32])+hotspot('chest',[32,44,36,30]);
   if(mode==='pack')spots=hotspot('box',[32,44,36,30])+hotspot('forecast',[69,48,17,23])+hotspot('ground',[4,8,70,25])+hotspot('morning',[69,75,17,12]);
   if(mode==='photo')spots=hotspot('voice',[12,68,17,20])+hotspot('photo',[28,68,29,21])+hotspot('log',[68,66,17,23]);
   panel.innerHTML=RoomScene.render({place:mode==='photo'?'1999 · 사진관':mode==='pack'?'1999 · 운동장 처마':mode==='locker'?'1999 · 방송석':'1999 · 운동장',goal:prepare?'09:50 · 장비 준비':titles[mode],art:art(),alt:mode==='photo'?'사진관 카운터 위 녹음기, 사진, 수첩':'겨울 운동장과 방송부 기록',peek,spots,showBag:false,showLook:false,selected:game.selected?'손에 든 물건: '+Playground.items[game.selected]:'',speaker:game.speaker,line:game.message||'목소리가 난 쪽을 확인하자. 벤치에 누가 두고 간 카메라도 있어.'});
   const picture=panel.querySelector('.room-picture');
   if(mode==='fog')picture.insertAdjacentHTML('afterbegin','<div class="pg-fog-bank" aria-hidden="true"></div>');
   if(mode==='wind'){
    const end=Playground.windDirections[Math.min(game.windStep,2)];
    if(!prepare)picture.insertAdjacentHTML('beforeend','<div class="pg-flag-signal" aria-label="깃발 끝 '+(end==='east'?'동':'북')+'쪽">북 ↑<br><span>'+(end==='east'?'⚑ → 동':'⚑ ↑ 북')+'</span></div>');
    if(game.initialFixed&&!game.gust||game.fixed)picture.insertAdjacentHTML('beforeend','<span class="pg-fixed-paper" aria-label="게시대에 집게로 고정한 촬영 메모">▤</span>');
    if(game.gust&&!game.paper){const xy=[[43,66],[60,66],[60,43],[89,46]][game.windStep];picture.insertAdjacentHTML('beforeend','<span class="pg-flying-paper" style="left:'+xy[0]+'%;top:'+xy[1]+'%" aria-label="날아간 촬영 메모">▤</span>');}
   }
   if(mode==='locker'&&game.lockerOpen)picture.insertAdjacentHTML('beforeend','<div class="pg-open-chest" aria-label="뚜껑이 열린 보관함"><i></i>'+(game.inventory.includes('tape')?'':'<span>▣</span>')+'</div>');
   if(mode==='locker'&&game.loaded)picture.insertAdjacentHTML('beforeend','<span class="pg-loaded-tape" aria-label="녹음기에 삽입한 테이프">▣</span>');
   if(mode==='pack')picture.insertAdjacentHTML('beforeend','<div class="pg-box-state '+(game.clean?'dry ':'')+(game.closed?'closed':'')+'" aria-label="'+(game.closed?'닫은 기록 상자':game.clean?'마른 상자':'젖은 상자')+'">'+(game.closed?'':game.packed.map(id=>'<span>'+(id==='notes'?'▤':'▣')+'</span>').join(''))+'</div>');
   const conceptForDetail={grass:'dew',air:'fog',sky:'cloud'}[detail];
   const needsWeatherAnswer=mode==='fog'&&conceptForDetail&&!game.weatherConcepts[conceptForDetail];
   if(!exploring&&!needsWeatherAnswer)panel.querySelector('.room-speech').insertAdjacentHTML('beforeend',button('advance','계속 · 탐색하기 ▼'));
   else panel.querySelector('.room-toolbar').insertAdjacentHTML('beforeend','<small class="pg-explore-hint">'+esc(game.message)+'</small>');
   if(timed)panel.querySelector('.room-toolbar').insertAdjacentHTML('beforeend','<small class="pg-clock" aria-live="off"></small>'+button('timer','시간 도전 설정'));
   if(legacyComplete)panel.querySelector('.room-speech').insertAdjacentHTML('beforeend',button('legacy-done','이전 완료 기록으로 계속 →'));
   if(detail)renderDetail();
   const overlay=panel.querySelector('.room-modal');
   if(overlay){for(const child of panel.children)if(child!==overlay)child.inert=true;overlay.querySelector('button')?.focus({preventScroll:true});}
   else if(focus)panel.querySelector('[data-room-action="bag"]')?.focus({preventScroll:true});
   const prose=panel.querySelector('.room-speech p'),full=prose.textContent;
   if(full&&!exploring){
    const chars=Array.from(full);let i=0;prose.textContent='';
    finishTyping=()=>{clearInterval(typingTimer);prose.textContent=full;finishTyping=null;};
    typingTimer=setInterval(()=>{prose.textContent+=chars[i++]||'';if(i>=chars.length)finishTyping();},18);
   }
   const faces={'소미':'somi','태오':'taeo','은호':'eunho','강은호':'eunho','선생님':'teacher','1999년 담임':'teacher'};
   const face=faces[game.speaker];
   if(face&&!exploring)panel.insertAdjacentHTML('beforeend','<div class="room-dialogue-portrait" aria-hidden="true"><img src="assets/characters/'+face+'/normal.png" alt=""></div>');
   updateClock();
  }
  function renderDetail(){
   if(mode==='fog'){
    if(detail==='lens'&&!game.wipedLens)panel.querySelector('.room-speech').insertAdjacentHTML('beforeend','<div class="pg-inline-actions">'+(game.inventory.includes('cloth')?button('use:cloth:lens','천으로 렌즈 닦기'):button('take:cloth','옆의 마른 천 집기'))+'</div>');
    const concepts={grass:['dew','이슬'],air:['fog','안개'],sky:['cloud','구름']};
    const current=concepts[detail];
    if(current&&!game.weatherConcepts[current[0]])panel.querySelector('.room-speech').insertAdjacentHTML('beforeend','<form class="pg-weather-answer" data-weather="'+current[0]+'"><label for="weather-'+current[0]+'">관찰한 것의 이름</label><input id="weather-'+current[0]+'" name="weather-answer" data-weather-input="'+current[0]+'" autocomplete="off" maxlength="10" placeholder="직접 써 보세요" aria-label="'+current[1]+' 이름 입력"><button type="submit">확인</button></form>');
    return;
   }
   let title=labels[detail]||'살펴보기',body='<p>'+esc(descriptions[detail]||game.message)+'</p>',wide=false;
   if(detail==='lens')body='<p>'+esc(game.wipedLens?'렌즈의 물방울은 닦였어. 그런데 먼 골대도 또렷해졌을까? 골대와 풀잎, 하늘을 비교해 보자.':descriptions.lens)+'</p>'+(!game.wipedLens?(game.inventory.includes('cloth')?button('use:cloth:lens','천으로 렌즈 닦기'):button('take:cloth','옆에 있는 마른 천 집기')):'');
   if(detail==='store'&&!game.storeOpen)body='<p>문이 잠겨 있어. 선생님께 허락을 받은 다음 열자.</p>'+(game.permission?button('use:key:store','허락받은 열쇠로 문 열기'):button('teacher','선생님께 창고 사용 여쭙기'));
   if(detail==='board')body='<p>이 메모는 촬영 때 누가 무엇을 했는지 적은 기록이야. 바람에 다시 날리지 않도록 고정하자.</p>'+(game.inventory.includes('clip')?button('use:clip:board','집게로 촬영 메모 고정하기'):button('spot:store','창고에서 집게 찾기'));
   if(detail==='hedge')body='<p>울타리에는 날카로운 가지가 있어. 넘어가지 말고 종이가 여기까지 왔는지 먼저 확인하자.</p>'+(game.windStep>=3?(game.inventory.includes('reacher')?button('use:reacher:hedge','긴 집게로 종이 꺼내기'):button('spot:store','긴 집게 찾으러 가기')):button('spot:flag','깃발을 보고 종이 찾기'));
   if(detail==='store'&&game.storeOpen){title='열린 창고';body='<img class="pg-detail-art" src="assets/playground-field-open-cartoon-v3.png" alt="열린 도구 창고">'+['clip','reacher','cloth','box'].map(id=>'<article><b>'+Playground.items[id]+'</b><p>'+(id==='reacher'?'울타리를 넘지 않고 종이를 꺼내는 도구.':id==='clip'?'촬영 메모를 게시대에 물리는 도구.':'기록을 보관할 때 쓰는 물건.')+'</p>'+button('take:'+id,game.inventory.includes(id)?'챙긴 도구':'챙기기')+'</article>').join('');}
   if(detail==='flag'){title='깃발과 운동장 지도';body='<p>'+esc(game.message)+'</p><p>종이가 갈 곳을 지도에서 눌러 보자. 깃발 표시는 지금 움직임을 확대한 그림이야.</p><div class="pg-map" aria-label="북쪽이 위인 운동장 지도">'+[['north','북쪽 트랙'],['west','서쪽 창고'],['east','동쪽 울타리'],['south','남쪽 방송석']].map(([id,name])=>'<button type="button" class="map-'+id+'" data-pg="direction:'+id+'" '+(!game.gust||game.windStep>=3?'disabled':'')+'>'+name+'</button>').join('')+'<span>현재 종이</span></div>';}
   if(detail==='chest')body='<p>'+(game.lockerOpen?'선생님이 보관하신 오늘의 녹음이야.':'선생님이 잠금을 풀어 두셨어. 뚜껑을 열어 보자.')+'</p>'+(game.lockerOpen?button('take:tape',game.inventory.includes('tape')?'테이프를 꺼내 두었어':'테이프 챙기기'):button('teacher-open','보관함 뚜껑 열기'));
   if(detail==='recorder')body='<p>'+(game.loaded?'테이프를 넣었어. 녹음된 목소리를 들어 보자.':'선생님이 보관해 둔 테이프를 넣어 당시 목소리를 확인하자.')+'</p>'+(game.loaded?button('play','재생 ▶'):game.inventory.includes('tape')?button('use:tape:recorder','꺼낸 테이프를 녹음기에 넣기'):button('spot:chest','옆 보관함 살펴보기'));
   if(detail==='box')body='<p>'+(game.closed?'기록을 넣고 뚜껑을 닫았어. 선생님과 실내로 이동하자.':game.clean?'상자가 말랐어. 촬영 메모와 녹음테이프를 보호하자.':'안쪽에 빗물이 들어왔어. 종이를 넣으면 어떻게 될까?')+'</p>'+(!game.clean?button('use:cloth:box','마른 천으로 안쪽 닦기')+button('use:notes:box','먼저 종이를 넣어 본다'):['notes','tape'].filter(id=>!game.packed.includes(id)).map(id=>button('use:'+id+':box',Playground.items[id]+' 넣기')).join('')+button('close-box','뚜껑 닫기'));
   if(detail==='photo')body+=Playground.ready(game)?button('evidence','세 기록을 작업대에서 연결하기'):'<p>옆의 관측 일지와 녹음기도 살펴보자.</p>';
   if(detail==='timer'){title='선택형 시간 도전';body='<p>기본은 무제한. 설명이나 가방을 읽는 동안 멈추고, 시간이 끝나도 태오가 기록을 붙잡아 줘. 기록은 사라지지 않아.</p><output class="pg-clock"></output>'+button('clock-start','시간 도전 시작 / 계속')+button('clock-reset','시간 다시 받기')+button('clock-unlimited','시간 제한 없이');}
   if(detail==='evidence'){title='사진 · 일지 · 녹음 연결';body='<div class="pg-evidence-host"></div>';wide=true;}
   if(detail==='evidence')panel.insertAdjacentHTML('beforeend',modal(title,body,wide));
   else panel.insertAdjacentHTML('beforeend','<section class="pg-action-strip" aria-label="'+esc(title)+'"><header><strong>'+esc(title)+'</strong>'+button('close','조사 마치기 ×')+'</header>'+body+'</section>');
   if(detail==='evidence')disposeEvidence=EvidenceTask.mount(panel.querySelector('.pg-evidence-host'),onDone,evidenceState,value=>{evidenceState=value;save();},onSound);
   updateClock();
  }
  function spot(id){
   game.selected='';
   if(scenery[id]){exploring=false;reply='';game.speaker='소미';game.message=scenery[id];detail='';onSound('paper');return;}
   if(id==='cloth'){doAct('take','cloth');detail='lens';return;}
   doAct('inspect',id);detail=id;
  }
  function teacher(){
   detail='';
   if(mode==='wind'&&prepare){if(game.initialFixed){save();onDone();return;}doAct('teacher-permission');return;}
   if(game.complete){save();onDone();return;}
   if(mode==='fog'){doAct('wait');return;}
   game.speaker='1999년 담임';game.message=mode==='pack'?'상자 안을 닦고 촬영 메모와 테이프를 넣은 다음 뚜껑을 닫자.':mode==='wind'?'깃발을 보고 종이를 찾을 곳을 예상하자. 집게봉으로 꺼낸 뒤 집게로 고정하렴.':'녹음테이프를 녹음기에 넣고 들어 보렴.';save();
  }
  function advance(){
   if(finishTyping){finishTyping();return;}
   if(detail==='evidence')return;
   if(reply){game.speaker=replySpeaker;game.message=reply;reply='';render();return;}
   detail='';exploring=true;
   game.message=mode==='fog'?(!game.wipedLens?(game.seen.includes('lens')?'카메라 곁의 천으로 렌즈를 닦고, 맨눈으로 본 골대와 비교해 보자.':'벤치의 카메라는 누가 두고 갔을까? 목소리가 난 골대 쪽도 살펴보자.'):'렌즈는 닦였어. 먼 골대·풀잎·하늘에 보이는 것을 비교해 보자.'):'주변 사물을 눌러 살펴보자. 필요한 일을 마치면 이야기가 이어져.';
   save();render();
  }
  function answerWeather(concept){
   const input=panel.querySelector('[data-weather-input="'+concept+'"]');
   game=Playground.act(game,{type:'answer-weather',value:concept,answer:input?.value||''});
   if(game.weatherConcepts[concept])detail='';
   exploring=false;onSound('paper');save();
   if(!completeIfReady())render(true);
  }
  function submit(e){
   const form=e.target.closest('form[data-weather]');
   if(!form||!panel.contains(form))return;
   e.preventDefault();answerWeather(form.dataset.weather);
  }
  function click(e){
   if(dead||completed)return;
   const target=e.target.closest('[data-pg],[data-room-action]');
   if(!target){if(!e.target.closest('button,input,textarea,select,.room-modal,.pg-action-strip'))advance();return;}
   const action=target.dataset.pg||target.dataset.roomAction,[kind,value]=action.split(':');
   if(kind==='advance'){advance();return;}
   if(kind==='peek')peek=!peek;
   else if(kind==='bag'){clock.pause();bag=true;detail='';}
   else if(kind==='close'){bag=false;detail='';}
   else if(kind==='use'){const [,item,destination]=action.split(':');doAct('select',item);doAct('use',destination);detail=destination;}
   else if(kind==='stow'){game.selected='';save();}
   else if(kind==='spot')spot(value);
   else if(kind==='take'){doAct('take',value);if(value==='cloth'&&mode==='fog')detail='lens';if(value==='tape')detail='recorder';}
   else if(kind==='teacher')teacher();
   else if(kind==='teacher-open')doAct('teacher-open');
   else if(kind==='play'){doAct('play');detail='';}
   else if(kind==='close-box'){doAct('close');detail='';}
   else if(kind==='direction'){doAct('direction',value);detail='';}
   else if(kind==='reply'){game.speaker=replySpeaker;game.message=reply;reply='';save();}
   else if(kind==='timer'){clock.pause();detail='timer';}
   else if(kind==='clock-start'){if(clock.snapshot().unlimited)clock.reset();clock.start();detail='';}
   else if(kind==='clock-reset')clock.reset();
   else if(kind==='clock-unlimited'){clock.unlimited();detail='';}
   else if(kind==='evidence'){if(Playground.ready(game))detail='evidence';}
   else if(kind==='legacy-done'){onDone();return;}
   else return;
   if(!dead&&!completeIfReady()){save();render(true);}
  }
  function keydown(e){if((e.key===' '||e.key==='Enter')&&!e.target.closest('button,input,textarea,select,.room-modal,.pg-action-strip')){e.preventDefault();advance();return;}const modal=panel.querySelector('.room-modal');if(!modal)return;if(e.key==='Escape'){e.preventDefault();bag=false;detail='';render();}if(e.key==='Tab'){const nodes=[...modal.querySelectorAll('button,input,select,textarea,summary')].filter(n=>!n.disabled&&n.getClientRects().length);const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}
  function updateClock(){const s=clock.tick(),out=panel.querySelector('.pg-clock');if(out)out.textContent=s.unlimited?'시간 제한 없음':s.expired?'태오: 내가 잡고 있어! 천천히 이어 가자.':Math.ceil(s.remaining/1000)+'초 · '+(s.running?'진행 중':'읽는 동안 멈춤');}
  function hidden(){if(document.hidden){clock.pause();save();}}
  panel.classList.add('room-panel','playground-panel');panel.addEventListener('click',click);panel.addEventListener('submit',submit);panel.addEventListener('keydown',keydown);document.addEventListener('visibilitychange',hidden);
  const interval=setInterval(()=>{if(!dead)updateClock();},500);save();render();
  return ()=>{dead=true;clearInterval(typingTimer);finishTyping=null;if(disposeEvidence)disposeEvidence();clock.pause();save();clock.dispose();clearInterval(interval);panel.removeEventListener('click',click);panel.removeEventListener('submit',submit);panel.removeEventListener('keydown',keydown);document.removeEventListener('visibilitychange',hidden);panel.classList.remove('room-panel','playground-panel','pg-exploring');};
 }
 root.PlaygroundView={mount};
})(typeof window==='undefined'?globalThis:window);
