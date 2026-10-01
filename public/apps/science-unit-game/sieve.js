(function(root){
 'use strict';
 const sizes={sand:2,small:7,large:12}, names={sand:'고운 모래',small:'작은 자갈',large:'큰 자갈'}, holes={fine:1,medium:4,wide:9};
 const predictionOptions=[['','예상해 보기'],['none','아무것도 안 내려온다'],['sand','모래만'],['sand,small','모래와 작은 자갈'],['small','작은 자갈만'],['all','전부']];
 function predictions(){return predictionOptions.map(option=>[...option]);}
 function reviewCards(){return [
  {id:'evidence',title:'처음 상태 남기기',context:'작업 메모 한쪽에 소미가 붙인 쪽지: “엎질러졌다고 재료를 새로 살 필요는 없었어.”',question:'은호: 왜 그대로 다시 쓸 수 있었는지, 우리가 본 증거도 적어 두자.',hint:'소미: 나눈 뒤 모래와 자갈이 처음과 어떻게 달라졌는지 떠올려 봐.',options:[
   {text:'섞인 재료는 체를 통과하면서 새 물질로 변했다.',correct:false,reply:'소미: 체가 재료를 바꿨을까? 체 위에 남은 자갈부터 살펴봐.'},
   {text:'섞였다가 나뉜 뒤에도 모래와 자갈의 성질이 남아 있었다.',correct:true,reply:'은호: 맞아. 새로 만든 게 아니라, 섞인 재료를 다시 나눈 거네.'},
   {text:'색이 비슷해서 모두 같은 물질이었다.',correct:false,reply:'태오: 색이 비슷해도 알갱이는 달랐잖아. 처음 접시를 떠올려 봐.'}]},
  {id:'repair',title:'다음 당번에게 주의 사항',context:'태오가 적은 메모: “촘촘한 체에서 아무것도 안 내려오면 힘껏 흔들 것!”',question:'소미: 잠깐, 이대로 따라 하면 곤란하겠어. 어떻게 고쳐 줄까?',hint:'은호: 흔드는 힘을 바꾸면 구멍도 커질까?',options:[
   {text:'아무것도 안 내려오면 흔드는 횟수만 계속 늘린다.',correct:false,reply:'소미: 구멍을 못 지나는 알갱이라면 더 오래 흔들어도 그대로 아닐까?'},
   {text:'재료를 잘게 부순 다음 같은 체를 쓴다.',correct:false,reply:'태오: 그러면 받침에 쓸 큰 자갈까지 망가지잖아. 원래대로 나눠야 해.'},
   {text:'재료는 그대로 두고, 알갱이와 체 눈 크기를 비교해 다른 체를 고른다.',correct:true,reply:'태오: 힘보다 체를 바꾸기. 좋아, 다음 당번 팔은 지켰다.'}]},
  {id:'transfer',title:'다른 재료에도 쓸 수 있을까?',context:'다음 행사 준비 칸: “크기와 모양이 같은 빨간 구슬과 파란 구슬도 따로 정리하기.”',question:'은호: 오늘 쓴 체를 그대로 빌려주면 색깔별로 나눌 수 있을까?',hint:'소미: 같은 크기의 두 구슬을 같은 구멍에 대면 어떻게 될까?',options:[
   {text:'둘 다 함께 지나가거나 남으니 체로 색을 나눌 수 없다. 색을 보고 골라야 한다.',correct:true,reply:'은호: 재료가 달라지면 먼저 성질을 비교하고 방법도 다시 정해야겠네.'},
   {text:'빨간 구슬만 지나가는 체 눈을 고르면 된다.',correct:false,reply:'소미: 구멍이 색을 알아보지는 못해. 두 구슬 크기가 같다는 점을 생각해 봐.'},
   {text:'체를 두 번 쓰면 같은 크기라도 색별로 나뉜다.',correct:false,reply:'태오: 첫 번째에 같이 내려간 두 구슬이 두 번째에는 왜 갈라질까?'}]}
 ];}
 function storedMessage(kind){return `${names[kind]}${kind==='sand'?'를':'을'} 보관했어!`;}
 function finalExplanation(){return {text:'맞아! 알갱이보다 작은 체 눈은 통과할 수 없지. 크기가 다른 체를 차례로 써서 세 재료를 나눴어.',feedback:''};}
 function create(){return {groups:[Array(20).fill('sand').concat(Array(10).fill('small'),Array(6).fill('large'))],bins:{sand:[],small:[],large:[]},top:[],bottom:[],tool:null,steps:0,loaded:false};}
 function load(s,i){if(s.loaded||!s.groups[i]?.length)return s;return {...s,groups:s.groups.filter((_,n)=>n!==i),top:[...s.groups[i]],bottom:[],steps:0,tool:null,loaded:true};}
 function select(s,tool){if(!s.loaded||s.steps||!Object.hasOwn(holes,tool))return s;return {...s,tool};}
 function shake(s){
  if(!s.loaded||!s.tool||s.steps>=4)return s;
  const steps=s.steps+1, movable=s.top.filter(k=>sizes[k]<holes[s.tool]);
  const count=Math.ceil(movable.length/(5-steps));let moved=0;
  const top=[],bottom=[...s.bottom];
  s.top.forEach(k=>{if(sizes[k]<holes[s.tool]&&moved<count){bottom.push(k);moved++;}else top.push(k);});
  return {...s,steps,top,bottom};
 }
 function unload(s){if(!s.loaded||s.steps<4)return s;return {...s,groups:s.groups.concat([s.top,s.bottom].filter(g=>g.length)),top:[],bottom:[],loaded:false,tool:null,steps:0};}
 function store(s,i,kind){const g=s.groups[i];if(!Object.hasOwn(names,kind)||!g?.length||g.some(k=>k!==kind))return s;return {...s,groups:s.groups.filter((_,n)=>i!==n),bins:{...s.bins,[kind]:s.bins[kind].concat(g)}};}
 function complete(s){return !s.loaded&&!s.groups.length&&s.bins.sand.length===20&&s.bins.small.length===10&&s.bins.large.length===6;}
 function check(kind,answer){const value=String(answer).normalize('NFC').replace(/[\s.!。]/g,'');const accepted={mixture:['혼합물','혼합물입니다','혼합물이야'],property:['크기','알갱이크기','크기차이','알갱이의크기','알갱이크기차이','알갱이의크기차이'],reason:['크기']};return (accepted[kind]||[]).includes(value);}
 function describe(g){return Object.keys(names).filter(k=>g.includes(k)).map(k=>`${names[k]} ${g.filter(v=>v===k).length}개`).join(' + ')||'비어 있음';}
 function matchesGoal(s,round){
  if(s.steps!==4||!s.top.length||!s.bottom.length)return false;
  return round===1?s.top.every(k=>k==='large')&&s.bottom.every(k=>k!=='large'):
   s.top.every(k=>k==='small')&&s.bottom.every(k=>k==='sand');
 }
 function mount(host,onComplete){
  const delay=window.AnswerDelay.mount(host,'sieve');
  let phase='observe',round=1,s=create(),selected='',hints=0,feedback='',lastX=null;
  let collected=[],placed=new Set();
  let reviewIndex=0,reviewAnswered=false,draft='';
  const cards=reviewCards();
  const labels=['재료 관찰','큰 자갈 분리','모래 분리','용도에 배치','작업 메모 남기기','완료'];
  const purposes={sand:'그림 속 흙길 채우기',small:'길 가장자리 꾸미기',large:'나무 받침 고정하기'};
  const q=sel=>host.querySelector(sel);
  function samples(){
   return '<h3 class="materials-title">세 재료를 손으로 비교해 보니</h3><div class="material-cards">'+Object.keys(names).map(k=>'<div class="material-card"><b>'+names[k]+'</b><span class="grain-sample grain-'+k+'" aria-hidden="true"><i></i><i></i><i></i></span><span>'+({sand:'손가락 사이로 빠질 만큼 고움',small:'한 손에 여러 개 잡히는 크기',large:'한 손에 하나씩 드는 크기'})[k]+'</span></div>').join('')+'</div>';
  }
  function startRound(){
   s=create();s.groups=[round===1?create().groups[0]:[...collected.find(g=>g.includes('sand'))]];
   selected='';hints=0;feedback='';
  }
  function render(){
   const step=phase==='observe'?0:phase==='experiment'?round:phase==='arrange'?3:phase==='done'?5:4;
   host.innerHTML='<div class="lab-heading"><span>윤하나의 배경판을 방송실로 가져가자</span><h2>'+labels[step]+'</h2></div>'+
    '<p class="lab-progress">진행 '+(step+1)+'/6 · '+labels.map((l,i)=>i===step?'【'+l+'】':l).join(' → ')+'</p>'+
    '<div class="guided-body"></div><p class="lab-answer-feedback" role="status" aria-live="polite"></p>';
   q('.lab-answer-feedback').textContent=feedback;
   const body=q('.guided-body');
   if(phase==='observe'){
    body.innerHTML='<aside class="work-note"><strong>배경판 뒤 · 윤하나의 작업 메모</strong><p>모래는 그림의 빈 곳에. 작은 자갈은 테두리에.<br>큰 자갈은 받침에. 옮기기 전에 흔들리지 않는지 확인!</p><p>이어서 도와준 사람은 어디까지 했는지 남겨 줘. — 하나</p></aside><p>소미: 하나가 돌아와도 알아볼 수 있게 원래 계획대로 해 놓자. 먼저 재료를 살펴볼래?</p>'+samples()+
    '<p>세 칸은 같은 관찰 범위야. 모래는 아주 작은 알갱이가 모여 있고, 작은 자갈은 여러 개를 한 손에 쥘 수 있지만 큰 자갈은 하나씩 들어야 해.</p><p>순서: 큰 자갈을 먼저 모으기 → 남은 모래와 작은 자갈 나누기 → 세 재료로 배경판 완성하기</p><button class="primary-btn" data-next>관찰했어 · 큰 자갈부터 나누자</button>';
    q('[data-next]').onclick=()=>{phase='experiment';startRound();render();};
   } else if(phase==='experiment'){
    const target=round===1?'큰 자갈 6개만 체 위에 남기기':'작은 자갈 10개는 체 위에, 모래는 받침에 모으기';
    const reason=round===1?'가장 큰 재료를 먼저 덜어 내야, 아래로 내려온 두 재료를 다음 체에서 다시 나눌 수 있어.':'큰 자갈은 이미 보관했어. 이제 남은 두 재료가 서로 다른 곳에 모여야 배경판에 따로 쓸 수 있어.';
    const success='<span class="success-place success-top"><strong>체 위</strong><span>'+(round===1?'큰 자갈':'작은 자갈')+'</span></span><span class="success-place success-bottom"><strong>받침</strong><span>'+(round===1?'모래와 작은 자갈':'고운 모래')+'</span></span>';
    body.innerHTML='<section class="lab-mission"><span class="mission-kicker">이번 작업</span><h3>'+target+'</h3><p class="mission-reason">'+reason+'</p><div class="mission-success"><b>성공 모습</b><span>'+success+'</span></div></section>'+
     '<p class="sieve-guide"><b>체를 고르는 단서</b> 알갱이가 체 눈보다 작으면 아래로 떨어지고, 더 크면 체 위에 남아.</p>';
    if(!s.loaded){
     body.insertAdjacentHTML('beforeend','<p>'+(round===1?'모래·작은 자갈·큰 자갈이 한 접시에 섞여 있어.':'큰 자갈은 따로 모았어. 이번에는 모래와 작은 자갈만 담긴 접시야.')+'</p><button data-load class="primary-btn">접시의 재료를 체에 넣기</button>');
     q('[data-load]').onclick=()=>{s=load(s,0);render();};
    }else{
     body.insertAdjacentHTML('beforeend','<div class="sieve-tools">'+Object.keys(holes).map(k=>'<button data-tool="'+k+'" '+(s.steps?'disabled':'')+' aria-pressed="'+(selected===k)+'"><span class="sieve-icon sieve-'+k+'"><span class="sieve-bowl"></span><span class="sieve-handle"></span></span><strong>'+({fine:'촘촘한 체',medium:'중간 체',wide:'성긴 체'})[k]+'</strong><small>'+({fine:'아주 고운 철망',medium:'중간 간격 철망',wide:'넓은 간격 철망'})[k]+'</small></button>').join('')+'</div>');
     body.insertAdjacentHTML('beforeend','<div class="sieve-stage"><canvas width="640" height="260" aria-label="체 위와 아래 받침에 있는 재료"></canvas><span class="shake-dust" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div>');
     paint();
     host.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{selected=b.dataset.tool;s=select(s,selected);feedback='';render();});
     if(selected&&s.steps<4){
      body.insertAdjacentHTML('beforeend','<div class="shake-control"><span>흔든 횟수 <b>'+s.steps+'</b>/4</span><button data-shake class="primary-btn">손잡이를 잡고 체 흔들기</button></div>');
      q('[data-shake]').onclick=shakeOnce;
      const canvas=q('canvas');
      canvas.onpointerdown=e=>{lastX=e.clientX;canvas.setPointerCapture(e.pointerId);};
      canvas.onpointermove=e=>{if(lastX!==null&&Math.abs(e.clientX-lastX)>35){lastX=null;shakeOnce();}};
      canvas.onpointerup=canvas.onpointercancel=()=>lastX=null;
     }
     if(s.steps===4){
      body.insertAdjacentHTML('beforeend','<div class="lab-results"><p>체 위: '+describe(s.top)+'</p><p>아래 받침: '+describe(s.bottom)+'</p></div>');
      body.insertAdjacentHTML('beforeend','<p>은호: 다 흔들었어. 체 위와 아래에 어떤 재료가 모였는지 보자.</p>');
      if(matchesGoal(s,round)){
       body.insertAdjacentHTML('beforeend','<button data-success class="primary-btn">'+(round===1?'큰 자갈 보관 · 남은 두 재료 나누기':'두 재료 보관 · 배경판 완성하기')+'</button>');
       q('[data-success]').onclick=()=>{
        if(round===1){collected=[[...s.top],[...s.bottom]];round=2;startRound();}
        else{collected=[collected[0],[...s.top],[...s.bottom]];phase='arrange';feedback='';}
        render();host.scrollTop=0;
       };
      }else{
       body.insertAdjacentHTML('beforeend','<p>소미: '+(round===1?'큰 자갈만 따로 모였는지 확인해 봐.':'모래와 작은 자갈이 서로 다른 곳에 모였는지 봐.')+'</p><button data-retry class="primary-btn">재료를 다시 모아 체 바꾸기</button>');
       q('[data-retry]').onclick=()=>{startRound();render();};
      }
     }
    }
   }else if(phase==='arrange'){
    const kind=Object.keys(names).find(k=>!placed.has(k));
    const regions={sand:'polygon(44% 40%,50% 40%,74% 77%,25% 77%)',small:'polygon(42% 38%,52% 38%,77% 83%,22% 83%,22% 74%,44% 38%,44% 41%,25% 77%,74% 77%,50% 41%)',large:'polygon(7% 64%,23% 64%,23% 90%,7% 90%,7% 64%,76% 64%,94% 64%,94% 92%,76% 92%,76% 64%)'};
    body.innerHTML='<section class="lab-mission"><h3>하나의 촬영 배경판을 완성하자</h3><p>평평한 종이의 흙길에는 고운 재료를 붙이고, 길 가장자리는 작은 돌로 꾸미자. 바닥의 나무 받침은 큰 돌로 눌러 세울 거야.</p><p>이 배치는 하나의 제작 계획이야. 크기에 따른 분리 원리는 앞에서 확인했어.</p></section><p>'+placed.size+'/3곳 완성'+(kind?' · 지금 든 재료: <b>'+names[kind]+'</b>':' · 배경판 완성!')+'</p><div class="craft-stage"><img src="assets/craft-empty-cartoon-v1.png" alt="재료를 붙이기 전 촬영 배경판">'+Object.keys(names).filter(k=>placed.has(k)).map(k=>'<img class="craft-layer" src="assets/craft-complete-cartoon-v1.png" style="clip-path:'+regions[k]+'" alt="'+names[k]+' 배치 완료">').join('')+'</div>'+(kind?'<p>아래에서 붙일 곳을 고르자. 맞게 배치하면 그림에 재료가 나타나.</p>'+Object.keys(purposes).map(k=>'<button class="icon-btn" data-place="'+k+'">'+purposes[k]+'</button>').join(' '):'<p>소미: 길을 채우고, 가장자리를 꾸미고, 받침도 고정했어. 옮기기 전에 우리가 한 작업을 메모하자.</p><button class="primary-btn" data-arranged>완성한 배경판을 확인하고 메모 남기기</button>');
    if(q('[data-arranged]'))q('[data-arranged]').onclick=()=>{phase='mixture';hints=0;render();};
    host.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{
     if(b.dataset.place!==kind){feedback='태오: 그림의 빈 부분을 채울 건지, 가장자리를 꾸밀 건지, 받침을 고정할 건지 생각해 보자. 지금 재료는 어디에 어울릴까?';}
     else{placed.add(kind);feedback='';}
     render();
     if(b.dataset.place!==kind)delay.start();
    });
   }else if(phase==='mixture'||phase==='property'){
    body.innerHTML='<section class="lab-conversation"><strong class="lab-speaker">소미</strong><p>'+
     (phase==='mixture'?'하나가 어디까지 했는지 남겨 달랬지? 작업 메모의 처음 상태부터 적자. 모래와 자갈이 각각의 성질을 지닌 채 섞여 있던 것을 과학 시간에는 뭐라고 불렀지?':'이제 사용한 방법이야. “체를 썼다”만 쓰면 다음 당번도 아무 체나 고를 수 있잖아. 체를 고를 때 비교한 알갱이의 성질은 무엇이었지?')+
     '</p><p class="memo-progress">작업 메모 '+(phase==='mixture'?'1':'2')+'/6 · '+(phase==='mixture'?'처음 상태':'분리 기준')+
     '</p><form class="lab-answer-form"><label for="labAnswer">내 설명</label><input id="labAnswer" maxlength="60" autocomplete="off"><button class="primary-btn" type="submit">메모에 적기</button></form><button data-hint class="icon-btn">함께 생각하기</button></section>';
    q('form').onsubmit=e=>{
     e.preventDefault();
     if(check(phase,q('input').value)){phase=phase==='mixture'?'property':'review';feedback='';hints=0;render();host.scrollTop=0;}
     else{feedback='소미: 섞이기 전과 나눈 뒤의 재료를 떠올려 봐. 각각의 성질이 남아 있었지? 네 설명과 비교해 보자.';q('.lab-answer-feedback').textContent=feedback;delay.start();}
    };
    q('[data-hint]').onclick=()=>{
     const prompts=phase==='mixture'?[
      '소미: 처음 접시를 떠올려 봐. 모래와 자갈이 섞인 뒤 전혀 다른 물질로 변했을까?',
      '태오: 체로 나눈 뒤에도 모래는 모래, 자갈은 자갈이었지. 각각의 성질이 남아 있는 상태를 배웠어.',
      '소미: 교과서에서 두 가지 이상이 섞여 있는 물질을 부르던 용어를 떠올려 보자.'
     ]:[
      '소미: 세 재료의 확대 그림과 체의 구멍을 비교해 봐.',
      '태오: 같은 알갱이가 어떤 체에서는 남고 다른 체에서는 내려갔어. 바뀐 것은 무엇이었지?',
      '소미: 색이나 개수가 달라서 못 지나간 걸까, 구멍에 들어갈 수 있는지가 달라서일까?'
     ];
     feedback=prompts[Math.min(hints++,2)];q('.lab-answer-feedback').textContent=feedback;
    };
   }else if(phase==='review'){
    const card=cards[reviewIndex];
    body.innerHTML='<section class="work-note"><p class="memo-progress">작업 메모 '+(reviewIndex+3)+'/6 · '+card.title+'</p><p>'+card.context+'</p></section><section class="lab-conversation"><strong class="lab-speaker">'+(reviewIndex===1?'소미':'강은호')+'</strong><p>'+card.question+'</p><div class="review-options">'+card.options.map((o,i)=>'<button class="icon-btn" data-review="'+i+'" '+(reviewAnswered?'disabled':'')+'>'+o.text+'</button>').join('')+'</div><p class="review-reply" role="status"></p>'+(reviewAnswered?'<button class="primary-btn" data-review-next>메모에 붙이고 계속</button>':'<button class="icon-btn" data-review-hint>함께 생각하기</button>')+'</section>';
    q('.review-reply').textContent=feedback;
    q('.lab-answer-feedback').textContent='';
    host.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>{const answer=card.options[Number(b.dataset.review)];feedback=answer.reply;if(answer.correct){reviewAnswered=true;render();}else {q('.review-reply').textContent=feedback;delay.start();}});
    if(reviewAnswered)q('[data-review-next]').onclick=()=>{reviewIndex++;reviewAnswered=false;feedback='';if(reviewIndex===cards.length)phase='reflection';render();host.scrollTop=0;};
    else q('[data-review-hint]').onclick=()=>q('.review-reply').textContent=card.hint;
   }else if(phase==='reflection'){
    body.innerHTML='<section class="work-note"><p class="memo-progress">작업 메모 6/6 · 내 말로 인수인계</p><p>하나에게 남길 마지막 줄</p></section><section class="lab-conversation"><strong class="lab-speaker">소미</strong><p>다음 당번이 우리 없이도 할 수 있게, 어떤 순서로 나눴고 왜 그 체를 골랐는지 네 말로 써 줄래?</p><form><label for="handoffMemo">내가 사용한 순서와 이유</label><textarea id="handoffMemo" maxlength="500" rows="4"></textarea><p>이 글은 자동으로 정답·오답을 매기지 않아. 쓴 뒤 실제 결과와 비교해 보자.</p><button class="primary-btn" type="submit">실험 결과와 나란히 보기</button></form></section>';
    q('textarea').value=draft;
    q('form').onsubmit=e=>{e.preventDefault();draft=q('textarea').value.trim();if(!draft){q('.lab-answer-feedback').textContent='소미: 우리가 사용한 체의 순서부터 한 줄 남겨 볼까?';return;}phase='compare';feedback='';render();host.scrollTop=0;};
   }else if(phase==='compare'){
    body.innerHTML='<section class="work-note"><h3>내가 남긴 말</h3><p class="student-memo"></p></section><section class="lab-results"><h3>우리가 실제로 한 일</h3><p>성긴 체로 큰 자갈을 남기고, 내려온 모래와 작은 자갈을 중간 체로 다시 나눴어. 중간 체에는 작은 자갈이 남고 모래가 내려왔지.</p><p>체 눈보다 작은 알갱이는 통과했어. 색이 아니라 알갱이 크기 차이를 이용한 거야.</p></section><p>소미: 네 글에도 순서와 이유가 담겼는지 확인해 봐. 표현이 똑같을 필요는 없어.</p><button class="icon-btn" data-edit>내 글 다듬기</button> <button class="primary-btn" data-save-memo>확인했어 · 메모 붙이기</button>';
    q('.student-memo').textContent=draft;
    q('[data-edit]').onclick=()=>{phase='reflection';render();};
    q('[data-save-memo]').onclick=()=>{phase='done';render();host.scrollTop=0;};
   }else{
    body.innerHTML='<div class="board-preview"><h3>윤하나의 배경판 · 준비 완료</h3><p>그림 · 고운 모래 ✓</p><p>테두리 · 작은 자갈 ✓</p><p>받침 · 큰 자갈 ✓</p></div><p>소미: 섞여 있어도 각 물질의 성질은 남아 있었어. 알갱이보다 큰 체 눈은 통과하고, 작은 체 눈에는 남는 것을 이용했지.</p><p>태오: 이제 만든 아이를 만나러 가자. 우리를 집에 돌려보낼 단서도 물어봐야 해.</p><button data-done class="primary-btn">배경판을 들고 방송실로</button>';
    q('[data-done]').onclick=()=>{if(phase==='done'){phase='closed';onComplete();}};
   }
  }
  function shakeOnce(){
   if(s.steps>=4)return;
   const stage=q('.sieve-stage'),button=q('[data-shake]');
   if(!stage||stage.classList.contains('is-shaking'))return;
   stage.classList.add('is-shaking');stage.setAttribute('aria-busy','true');
   if(button)button.disabled=true;
   setTimeout(()=>{s=shake(s);render();if(s.steps===4&&!matchesGoal(s,round))delay.start();},520);
  }
  function paint(){
   const ctx=q('canvas').getContext('2d');
   const bg=ctx.createLinearGradient(0,0,0,260);bg.addColorStop(0,'#18283b');bg.addColorStop(1,'#0b1421');ctx.fillStyle=bg;ctx.fillRect(0,0,640,260);
   ctx.fillStyle='#f5deb0';ctx.font='bold 15px sans-serif';ctx.fillText('체 위',18,42);ctx.fillText('받침 그릇',18,188);
   ctx.save();ctx.lineCap='round';
   const metal=ctx.createLinearGradient(92,0,590,0);metal.addColorStop(0,'#66717b');metal.addColorStop(.24,'#eef4f5');metal.addColorStop(.52,'#7c8992');metal.addColorStop(.77,'#f6faf9');metal.addColorStop(1,'#616d77');
   ctx.strokeStyle=metal;ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(486,53);ctx.lineTo(615,31);ctx.stroke();
   ctx.strokeStyle='#313a42';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(487,50);ctx.lineTo(613,28);ctx.moveTo(488,57);ctx.lineTo(616,35);ctx.stroke();
   ctx.strokeStyle=metal;ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(340,72,154,43,0,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#81909a';ctx.lineWidth=.7;ctx.globalAlpha=.65;
   const gap=selected==='wide'?22:selected==='medium'?11:5;
   for(let x=197;x<=483;x+=gap){ctx.beginPath();ctx.moveTo(x,44);ctx.lineTo(x,100);ctx.stroke();}
   for(let y=43;y<=101;y+=Math.max(4,gap*.55)){ctx.beginPath();ctx.moveTo(195,y);ctx.lineTo(485,y);ctx.stroke();}
   ctx.globalAlpha=1;ctx.strokeStyle='#adb8bf';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(340,72,148,38,0,0,Math.PI*2);ctx.stroke();ctx.restore();
   const tray=ctx.createLinearGradient(0,151,0,225);tray.addColorStop(0,'#406e91');tray.addColorStop(.2,'#d9eef4');tray.addColorStop(.26,'#5684a5');tray.addColorStop(1,'#183a58');
   ctx.fillStyle=tray;ctx.beginPath();ctx.moveTo(167,181);ctx.quadraticCurveTo(340,158,513,181);ctx.lineTo(496,238);ctx.quadraticCurveTo(340,252,184,238);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#d6ecf0';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(340,181,173,20,0,0,Math.PI*2);ctx.stroke();
   function rand(seed){const x=Math.sin(seed*91.731)*43758.5453;return x-Math.floor(x);}
   function grain(kind,i,x,y){
    if(kind==='sand'){
     for(let n=0;n<5;n++){const px=x+(rand(i*13+n)-.5)*9,py=y+(rand(i*19+n)-.5)*6,r=.7+rand(i*29+n)*1.2;ctx.fillStyle=n%2?'#e4bc69':'#f7dda0';ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.fill();}
     return;
    }
    const r=kind==='small'?7:12,verts=kind==='small'?7:8;
    ctx.save();ctx.shadowColor='#050a10aa';ctx.shadowBlur=4;ctx.shadowOffsetY=3;
    const fill=ctx.createRadialGradient(x-r*.35,y-r*.45,1,x,y,r*1.2);fill.addColorStop(0,kind==='small'?'#d5c5aa':'#c2c8ca');fill.addColorStop(.5,kind==='small'?'#918978':'#7e898e');fill.addColorStop(1,kind==='small'?'#56564e':'#414b50');ctx.fillStyle=fill;
    ctx.beginPath();for(let n=0;n<verts;n++){const a=-Math.PI/2+n*Math.PI*2/verts,rr=r*(.78+rand(i*31+n)*.28),px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*(.82+rand(i*17+n)*.12);n?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.shadowColor='transparent';
    ctx.strokeStyle='#e9ece955';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-r*.45,y-r*.2);ctx.lineTo(x-r*.05,y-r*.55);ctx.lineTo(x+r*.38,y-r*.25);ctx.stroke();ctx.restore();
   }
   for(const [group,zone] of [[s.top,'top'],[s.bottom,'bottom']])group.forEach((kind,i)=>{
    const kindIndex=group.slice(0,i).filter(value=>value===kind).length;
    let x,y;
    if(zone==='top'){
     const columns=kind==='large'?6:kind==='small'?10:18;
     const gapX=kind==='large'?31:kind==='small'?22:13;
     x=(kind==='large'?262:kind==='small'?242:224)+(kindIndex%columns)*gapX+(rand(i+3)-.5)*5;
     y=(kind==='large'?73:kind==='small'?70:58)+Math.floor(kindIndex/columns)*(kind==='sand'?10:16)+(rand(i+7)-.5)*5;
    }else{
     const columns=kind==='large'?6:kind==='small'?10:20;
     const gapX=kind==='large'?31:kind==='small'?24:13;
     x=(kind==='large'?262:kind==='small'?232:208)+(kindIndex%columns)*gapX+(rand(i+3)-.5)*6;
     y=(kind==='large'?210:kind==='small'?211:197)+Math.floor(kindIndex/columns)*(kind==='sand'?11:17)+(rand(i+7)-.5)*5;
    }
    grain(kind,i+(zone==='bottom'?100:0),x,y);
   });
  }
  render();
  return ()=>delay.dispose();
 }
 const api={create,load,select,shake,unload,store,complete,check,predictions,storedMessage,finalExplanation,matchesGoal,reviewCards,mount};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Sieve=api;
})(typeof window==='undefined'?globalThis:window);
