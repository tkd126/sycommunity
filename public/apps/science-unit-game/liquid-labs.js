(function(root){
 'use strict';
 // Quantities are model units, not measurements or real experiment instructions.
 function oilState(){return {settled:false,waterLoaded:false,oilLoaded:false,water:5,oil:3,cupWater:0,cupOil:0,receiver:'water',contaminated:false};}
 function oilStep(s,a){
  if(a==='reset')return oilState();
  if(s.contaminated)return s;
  if(a==='add-water'&&!s.waterLoaded)return {...s,waterLoaded:true};
  if(a==='add-oil'&&s.waterLoaded&&!s.oilLoaded)return {...s,oilLoaded:true,settled:true};
  if(a==='settle'&&s.waterLoaded&&s.oilLoaded)return {...s,settled:true};
  if(a==='mix'&&s.waterLoaded&&s.oilLoaded)return {...s,settled:false};
  if(a==='switch'&&s.settled&&s.water===0)return {...s,receiver:'oil'};
  if(a!=='drain'||!s.settled||!s.waterLoaded||!s.oilLoaded)return s;
  if(s.water>0)return {...s,water:s.water-1,cupWater:s.cupWater+1};
  if(s.oil>0&&s.receiver==='water')return {...s,oil:s.oil-1,cupOil:s.cupOil+1,contaminated:true};
  if(s.oil>0)return {...s,oil:s.oil-1,cupOil:s.cupOil+1};
  return s;
 }
 function oilDone(s){return s.waterLoaded&&s.oilLoaded&&!s.contaminated&&s.water===0&&s.oil===0&&s.cupWater===5&&s.cupOil===3;}
 function saltState(){return {phase:'dry',salt:4,sand:6,water:0,filtered:false};}
 function saltStep(s,a){
  if(a==='water'&&s.phase==='dry')return {...s,phase:'wet',water:3};
  if(a==='stir'&&s.phase==='wet')return {...s,phase:'dissolved'};
  if(a==='filter'&&s.phase==='dissolved')return {...s,phase:'filtered',filtered:true};
  if(a==='teacher'&&s.phase==='filtered')return {...s,phase:'heating'};
  if(a==='heat'&&s.phase==='heating')return {...s,water:s.water-1,phase:s.water===1?'done':'heating'};
  return s;
 }
 function mount(host,kind,onComplete){
  if(kind==='salt'&&root.SaltWorkshop)return root.SaltWorkshop.mount(host,onComplete);
  const delay=window.AnswerDelay.mount(host,kind);
  const isOil=kind==='oil';
  let oil=oilState(),salt=saltState(),page='experiment',reply='',finished=false;
  const $=sel=>host.querySelector(sel);
  const button=(a,t)=>'<button class="icon-btn" data-action="'+a+'">'+t+'</button>';
  function diagram(){
   if(kind==='oil'){
    let content='<div class="empty-vessel">빈 분별깔때기</div>',label='아직 액체를 넣지 않은 분별깔때기';
    if(oil.waterLoaded&&!oil.oilLoaded){content='<div class="water-layer water-added" style="height:'+oil.water*22+'px">물이 담겼다</div>';label='아래쪽에 푸른 물이 담긴 분별깔때기';}
    else if(oil.waterLoaded&&oil.oilLoaded&&!oil.settled){content='<div class="mixed-layer">물속에 기름방울이 흩어짐</div>';label='흔들려 기름방울이 물속에 흩어진 분별깔때기';}
    else if(oil.waterLoaded&&oil.oilLoaded){content='<div class="oil-layer liquid-added" style="height:'+oil.oil*22+'px">'+(oil.oil?'식용유':'')+'</div><div class="water-layer" style="height:'+oil.water*22+'px">'+(oil.water?'물':'')+'</div>';label='위층 식용유와 아래층 물이 뚜렷한 분별깔때기';}
    return '<div class="apparatus" role="img" aria-label="'+label+'"><div class="pour-status">'+(!oil.waterLoaded?'① 물을 먼저 붓자':!oil.oilLoaded?'✓ 물이 보인다 · ② 식용유를 붓자':'✓ 물과 식용유를 모두 넣었다')+'</div><div class="funnel"><div class="liquid-stack">'+content+'</div></div><div class="tap">┴</div><div class="receiver">받는 용기: '+(oil.receiver==='water'?'물':'기름')+'<br>물 '+oil.cupWater+'칸 · 기름 '+oil.cupOil+'칸</div></div>';
   }
   const dissolved=['dissolved','filtered','heating','done'].includes(salt.phase);
   const mixtureContent=salt.phase==='dry'?'<div class="crystal-bed">소금 알갱이</div><div class="sand-bed">모래 알갱이</div>':!salt.filtered?'<div class="water-layer water-added">'+(dissolved?'투명한 소금물':'물이 차오르고 소금 알갱이가 보임')+'</div><div class="sand-bed">바닥에 남은 모래</div>':'<div class="sand-bed">거름종이 위의 모래</div>';
   return '<div class="salt-bench"><div class="lab-vessel"><strong>'+(salt.filtered?'거름종이':'혼합물 비커')+'</strong>'+mixtureContent+'</div>'+(salt.filtered?'<div class="lab-vessel"><strong>'+(salt.phase==='filtered'?'거른 액체':'증발 접시')+'</strong><div class="'+(salt.water?'water-layer':'crystal-bed')+'">'+(salt.water?'투명한 소금물 · 남은 물 '+salt.water+'/3':'남은 소금 결정')+'</div>'+(salt.phase==='heating'?'<p class="steam">수증기가 올라간다</p>':'')+'</div>':'')+'</div>';
  }
  function act(a){
   reply='';
   if(kind==='oil'){
    if(a==='filter'){reply='소미: 거름종이는 이 두 액체를 층별로 받아 주는 도구가 아니야. 잠시 두었을 때의 경계를 살펴보자.';}
    else{const before=oil;oil=oilStep(oil,a);if(a==='add-water')reply='소미: 투명했던 깔때기 아래쪽이 파랗게 찼어. 물을 넣은 게 분명히 보이네.';if(a==='add-oil')reply='은호: 노란 식용유가 물 위에 머물러. 섞이지 않고 경계가 생겼어.';if(a==='mix')reply='태오: 하나로 된 줄 알았는데 작은 기름 방울이 떠다니네. 잠깐 두고 보자.';if(a==='switch'&&oil===before)reply='은호: 아직 아래층 물이 남아 있어. 경계가 꼭지까지 내려왔는지 먼저 봐.';if(a==='drain'&&!oil.settled)reply='소미: 경계가 안 보여. 먼저 가만히 두고 두 층이 나뉘는지 보자.';}
   }else{
    const before=salt;salt=saltStep(salt,a);
    if(before===salt)reply={sieve:'태오: 이번 소금과 모래는 알갱이 크기가 비슷해서 같이 남거나 내려가네. 아까와 다른 성질을 써야겠다.',filter:'소미: 마른 알갱이를 거름종이에 올리기만 해서는 둘을 나누기 어렵겠어.',heat:'선생님: 아직 가열할 단계가 아니란다. 먼저 모래와 소금물을 나누자.',stir:'소미: 지금은 저을 단계가 아니야. 작업대에 무엇이 있는지 살펴봐.'}[a]||'소미: 이미 마친 작업이야. 남은 재료를 살펴보자.';
   }
   render();
   if((reply&&!['mix','add-water','add-oil'].includes(a))||oil.contaminated)delay.start();
  }
  function render(){
   host.innerHTML='<div class="lab-heading"><span>학교생활 소개 영상 · 과학 수업 기록</span><h2>'+(isOil?'실험병과 원고를 비교하자':'겨울 무대의 두 재료')+'</h2></div><div class="guided-body"></div>';
   const body=$('.guided-body');
   if(page==='experiment'){
    body.innerHTML='<aside class="work-note">'+(isOil?'촬영 기록에는 두 액체를 따로 받는 장면이 있다. 실제 결과와 맞는 설명을 찾아 뒤섞인 원고를 구별하자.':'하나의 소품 메모: 눈 장면의 소금과 운동장 장면의 모래. 섞인 남은 재료도 각각 회수하기. 먹는 재료가 아님!')+'</aside>'+diagram()+'<p class="lab-safety">'+(isOil?'학교 실험을 단순화한 모형입니다. 실제 분별깔때기 조작은 선생님과 함께합니다. 한 번 누르면 조금 흘리고 꼭지가 닫힙니다. 칸 수는 비교용입니다.':'물에 녹는 양은 단순화했습니다. 실제 가열은 선생님 지도 아래 보호 장비를 착용하고 진행합니다. 맛보거나 뜨거운 기구를 만지지 않습니다.')+'</p><div class="lab-actions"></div><p class="lab-answer-feedback" role="status"></p>';
    const actions=$('.lab-actions');
    if(isOil){
     if(oil.contaminated){actions.innerHTML='<p>물을 받던 용기에 기름이 들어왔어. 버리지 말고 다시 모아 층을 나누자.</p>'+button('reset','다시 모아서 분리하기');}
     else if(oilDone(oil)){actions.innerHTML='<p>물과 기름을 서로 다른 용기에 받았어.</p>'+button('review','촬영 원고와 비교하기');}
     else if(!oil.waterLoaded)actions.innerHTML='<p>소미: 실험 기록에는 물과 식용유를 같은 양이 아니라 정해진 눈금까지 넣었다고 적혀 있어. 먼저 아래층이 될 액체부터 넣자.</p>'+button('add-water','눈금까지 물 붓기');
     else if(!oil.oilLoaded)actions.innerHTML='<p>태오: 파란 물이 깔때기 안에 찬 게 보여. 이제 노란 식용유를 천천히 부어 보자.</p>'+button('add-oil','물 위에 식용유 붓기');
     else actions.innerHTML='<p>목표: 물과 기름을 각각 회수하기. 아래층을 먼저 받고, 경계에서 용기를 바꾸자.</p>'+(!oil.settled?button('settle','가만히 두고 층 관찰')+button('filter','거름종이로 나누기'):button('mix','한 번 흔들어 변화 보기')+button('drain','꼭지 잠깐 열고 닫기')+button('switch','기름 받을 용기로 바꾸기'));
    }else{
     const stages={dry:['소미: 크기가 비슷한 두 알갱이야. 어떻게 시작할까?',button('sieve','체로 나누어 보기')+button('filter','바로 거름종이에 올리기')+button('water','물을 넣어 보기')],wet:['태오: 물을 넣었어. 바닥 알갱이가 어떻게 되는지 저어 보자.',button('stir','유리 막대로 젓기')],dissolved:['소미: 흰 소금 알갱이는 보이지 않고 모래가 남았어. 물속의 소금까지 없어진 걸까?',button('filter','거름종이로 거르기')+button('heat','모래가 있는 채로 가열하기')],filtered:['은호: 거름종이에는 모래가 남았어. 아래로 받은 맑은 액체도 버리면 안 되겠지?',button('teacher','소금물을 선생님께 가져가기')],heating:['선생님: 증발 접시에서 가열하는 모습을 보렴. 물이 줄면서 무엇이 남는지 관찰하자.',button('heat','가열 경과 관찰하기')],done:['선생님: 물은 증발하고 소금이 남았구나. 식을 때까지 기다린 뒤 회수하자.',button('review','식힌 뒤 작업 메모 정리')]};
     const [line,controls]=stages[salt.phase];actions.innerHTML='<p>'+line+'</p>'+controls;
    }
    $('.lab-answer-feedback').textContent=reply;
    host.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{if(b.dataset.action==='review'){page='review';reply='';render();host.scrollTop=0;}else act(b.dataset.action);});
   }else if(page==='review'){
    const options=isOil?[
     ['두 액체가 잘 섞이지 않고 층을 이루어, 경계에서 받는 용기를 바꿨다.',true],['기름이 거름종이에 붙어서 물만 내려왔다.',false],['흔들자 기름이 물로 바뀌어서 분리됐다.',false]
    ]:[['소금은 물에 녹았고 모래는 남았다. 거른 소금물에서 물을 증발시켜 소금을 얻었다.',true],['거름종이가 물에 녹은 소금까지 붙잡아 주었다.',false],['소금이 물에 녹으면 없어지므로 새 소금을 사야 한다.',false]];
    body.innerHTML='<section class="lab-conversation"><strong class="lab-speaker">소미</strong><p>'+(isOil?'어떤 설명이 실제 결과와 맞아? 이 원고를 구별해야 다음 촬영 장소가 적힌 장을 찾을 수 있어.':'하나가 “소금 어디 갔어?” 하고 놀라지 않게, 눈에 안 보이던 소금이 어떻게 돌아왔는지 적자.')+'</p><div class="review-options">'+options.map(([t],i)=>'<button class="icon-btn" data-answer="'+i+'">'+t+'</button>').join('')+'</div><p role="status" class="lab-answer-feedback"></p></section>';
    host.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(options[Number(b.dataset.answer)][1]){page='done';render();host.scrollTop=0;}else {$('.lab-answer-feedback').textContent=isOil?'은호: 가만히 둔 병의 위아래를 떠올려 봐. 물질이 변한 걸까, 위치가 나뉜 걸까?':'태오: 거름종이 아래의 액체를 가열했더니 소금이 나왔지. 어디에 있었던 걸까?';delay.start();}});
   }else{
    body.innerHTML='<section class="work-note"><h3>'+(isOil?'물·식용유 각각 회수':'모래·소금 각각 회수')+'</h3><p>'+(isOil?'서로 잘 섞이지 않아 생기는 두 층을 이용했다. 경계에서 꼭지를 닫고 용기를 바꿨다.':'물에 녹는 성질 차이로 소금을 녹이고 모래를 걸렀다. 거른 소금물에서 물을 증발시켜 소금을 얻었다.')+'</p></section><p>'+(isOil?'은호: 정리하면서 보니 대여 메모 뒤에도 글씨가 있어. 함께 읽어 보자.':'태오: 다 됐어. 소금이 사라진 게 아니었네. …하나도 어딘가에 있는 거겠지?')+'</p><button class="primary-btn" data-finish>친구들과 계속 이야기하기</button>';
    $('[data-finish]').onclick=()=>{if(!finished){finished=true;onComplete();}};
   }
  }
  render();
  return ()=>delay.dispose();
 }
 const api={oilState,oilStep,oilDone,saltState,saltStep,mount};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LiquidLabs=api;
})(typeof window==='undefined'?globalThis:window);
