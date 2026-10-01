(function(root){
 'use strict';
 const normalize=s=>String(s).normalize('NFKC').replace(/\s/g,'');
 function checkPlan(p){return p.length===5&&new Set(p).size===5&&p.slice(0,2).includes('magnet')&&p.slice(0,2).includes('sieve')&&p.slice(2).join(',')==='water,filter,evaporate';}
 function checkMass(s){return normalize(s)==='2';}
 function mount(host,onComplete){
  let stage='plan',feedback='',hint=false,finished=false,plan=[],massPassed=false;
  const labels={magnet:'자석으로 철 조각 회수',sieve:'체로 큰 자갈 회수',water:'물에 소금 녹이기',filter:'거름종이로 모래 분리',evaporate:'거른 액체의 물 증발'};
  const b=(a,t)=>'<button type="button" class="icon-btn" data-lab="'+a+'">'+t+'</button>';
  const art={plan:0,water:0,stir:1,filter:1,collect:2,heat:2,done:3,challenge:3};
  const caption={plan:'마른 소금과 모래가 섞여 있다',water:'소금과 모래 · 아직 물을 넣기 전',stir:'물을 넣고 저은 뒤 관찰한 모습',filter:'소금 알갱이는 보이지 않고 모래가 바닥에 남았다',collect:'거름종이 위 모래와 아래로 받은 맑은 액체',heat:'가열 전, 모래를 먼저 분리한 상태',done:'교사가 가열하고 식힌 뒤 각각 회수한 재료',challenge:'추가 실험 기록'};
  function next(s){stage=s;feedback='';hint=false;render();}
  function fail(s){feedback=s;render();}
  function render(){
   host.classList.add('salt-workshop-panel');
   const n=art[stage];
   host.innerHTML='<div class="lab-heading"><span>학교생활 소개 영상 · 마지막 실험 기록</span><h2>마지막 원고를 찾는 실험</h2></div><div class="guided-body"><figure class="salt-photo"><div class="salt-photo-frame" role="img" aria-label="'+caption[stage]+'" style="background-size:200% '+(n>1?183.33:220)+'%;aspect-ratio:'+(n>1?'625 / 682':'625 / 570')+';background-position:'+(n%2?100:0)+'% '+(n>1?100:0)+'%"></div><figcaption>'+caption[stage]+'</figcaption></figure><p class="lab-safety">실험 그림은 단계별 관찰 예시입니다. 실제 재료는 먹지 않습니다. 가열·뜨거운 기구 처리는 선생님이 맡습니다.</p><section class="salt-decisions"></section><p class="lab-answer-feedback" role="status"></p></div>';
   const q=s=>host.querySelector(s),box=q('.salt-decisions');
   if(stage==='plan')box.innerHTML='<h3>먼저 분리 방법을 정하자</h3><p>소미: 원고에는 두 재료를 따로 얻었다고 적혀 있어. 그런데 이 알갱이들은 체를 같이 통과해. 어떤 방법으로 나눴을까?</p>'+b('plan-wrong','작은 체 → 큰 체로 차례로 거른다')+b('plan-right','물에 녹임 → 거름 → 거른 액체에서 물을 증발시킴')+b('plan-wrong','마른 혼합물을 먼저 가열한다');
   if(stage==='water')box.innerHTML='<h3>물은 어느 정도 넣을까?</h3><p>이번 게임의 작은 시험 기록: 물 10 mL에는 소금 2 g까지 완전히 녹았다. 같은 조건에서 소금 4 g을 녹이려고 한다. 물을 적게 써서 나중에 증발시킬 양도 줄이자.</p><p>실제 용해량을 나타내는 표가 아니라 이 퍼즐에 주어진 모형 조건이다.</p>'+b('water-wrong','10 mL')+b('water-right','20 mL')+b('water-excess','100 mL');
   if(stage==='stir')box.innerHTML='<h3>유리 막대로 저은 뒤</h3><p>흰 알갱이는 안 보인다. 태오가 “소금이 사라졌으니 물은 버리자”고 한다. 남길 용기의 이름을 써서 말려 보자.</p><form data-form="solution"><label>이 맑은 액체는 무엇일까? <input name="answer" aria-label="맑은 액체 이름" autocomplete="off"></label><button>이름표 붙이기</button></form>'+b('hint','관찰 단서 보기')+(hint?'<p>소금이 물에 녹아 있는 액체다. 세 글자로 써 보자.</p>':'');
   if(stage==='filter')box.innerHTML='<h3>거름 장치를 조립하자</h3><p>깔때기·거름종이·받을 비커를 찾았다. 모래를 흘려보내지 않으려면?</p>'+b('filter-wrong','깔때기만 놓고 한꺼번에 붓기')+b('filter-right','거름종이를 깔때기에 밀착시키고 유리 막대를 따라 조금씩 붓기')+b('filter-wrong','거름종이 가장자리보다 높게 가득 붓기');
   if(stage==='collect')box.innerHTML='<h3>두 곳 중 어디를 보관할까?</h3><p>거름종이 위에는 젖은 모래, 비커에는 맑은 액체가 있다. 목표는 소금과 모래를 모두 회수하는 것이다.</p>'+b('collect-wrong','거름종이 위 모래만 보관한다')+b('collect-wrong','비커의 맑은 액체만 보관한다')+b('collect-right','모래와 맑은 액체를 각각 보관한다');
   if(stage==='heat')box.innerHTML='<h3>선생님께 맡길 마지막 작업</h3><p>은호: 맑은 액체에서 소금을 꺼낼 방법을 적어 드리자.</p><form data-form="heat"><label>물을 어떤 변화로 없앨까? <input name="answer" aria-label="물을 없앨 변화" autocomplete="off"></label><button>가열 계획 전달하기</button></form>'+b('hint','관찰 단서 보기')+(hint?'<p>물이 수증기가 되어 공기 중으로 나가는 변화다.</p>':'');
   if(stage==='done')box.innerHTML='<h3>선생님: 가열하고 충분히 식혔단다.</h3><p>소미: 이 결과와 맞는 설명이 마지막 실험 원고야. 방송실에서 다음 장과 이어 보자.</p>'+b('challenge','남은 실험 기록 살펴보기');
   if(stage==='challenge'){
    box.innerHTML='<h3>심화 도전 · 네 재료를 모두 되찾기</h3><p>학교생활 소개 영상의 추가 실험 기록: 큰 자갈 5 g + 철 조각 6 g + 모래 8 g + 소금 4 g이 섞였다. 철 조각만 자석에 붙고, 큰 자갈만 체 위에 남는다. 모래와 소금은 크기가 비슷하다.</p><p>조건: 철 조각과 큰 자갈은 <strong>물을 넣기 전에 마른 상태로</strong> 회수한다. 소금까지 모두 되찾을 5단계를 순서대로 놓자. 가열은 교사가 한다.</p><ol>'+plan.map(k=>'<li>'+labels[k]+'</li>').join('')+'</ol>'+Object.entries(labels).map(([k,t])=>b(k,t)).join('')+b('undo','마지막 단계 되돌리기')+b('check','계획 검토')+b('hint','막혔을 때 단서')+(hint?'<p>마른 상태에서 할 두 작업은 순서를 바꿔도 된다. 소금이 녹은 액체를 버리지 말고 마지막까지 따라가 보자.</p>':'')+(massPassed?'<form data-form="mass"><h3>계획은 통과! 그런데 회수량이 다르다.</h3><p>자갈 5 g, 철 조각 6 g, 모래 8 g, 소금 2 g을 회수했다. 중간에 소금물을 조금 흘렸고 다른 재료는 잃지 않았다. 처음보다 줄어든 소금은 몇 g일까?</p><label>줄어든 소금 <input name="answer" aria-label="줄어든 소금 질량" inputmode="decimal"> g</label><button>회수 기록 완성</button></form>':'')+b('skip','지금은 도전을 남겨 두고 이야기 계속하기');
   }
   q('.lab-answer-feedback').textContent=feedback;
   host.querySelectorAll('[data-lab]').forEach(el=>el.onclick=()=>{
    const a=el.dataset.lab;
    if(a==='hint'){hint=true;render();return;}
    if(a==='skip'){if(!finished){finished=true;onComplete();}return;}
    if(a in labels){if(plan.length<5){plan.push(a);massPassed=false;feedback='';render();}else fail('다섯 단계가 찼어. 마지막 단계를 되돌려 수정하자.');return;}
    if(a==='undo'){plan.pop();massPassed=false;feedback='';render();return;}
    if(a==='check'){massPassed=checkPlan(plan);feedback=massPassed?'소미: 네 재료가 모두 제자리로 돌아오는 계획이야. 회수량도 확인하자.':'소미: 마른 재료 회수 조건과 소금물이 지나가는 경로를 확인해 보자. 같은 작업을 두 번 넣지는 않았어?';render();return;}
    const transitions={'plan-right':'water','water-right':'stir','filter-right':'collect','collect-right':'heat',challenge:'challenge'};
    if(transitions[a])next(transitions[a]);else fail(a==='water-excess'?'녹일 수는 있지만, 뒤에 증발시킬 물이 너무 많아. 주어진 조건을 만족하는 최소량을 찾자.':a==='water-wrong'?'시험 기록을 보면 이 물의 양으로는 소금 4 g을 모두 녹일 수 없어.':a==='filter-wrong'?'모래가 거름종이를 거치지 않고 흘러가면 다시 섞여 버려. 액체가 지나갈 길을 따라가 보자.':a==='collect-wrong'?'우리는 두 재료를 모두 돌려놓기로 했어. 아직 소금은 어디에 있을까?':'크기가 비슷한 두 재료에서 다른 성질을 찾아보자.');
   });
   host.querySelectorAll('form').forEach(f=>f.onsubmit=e=>{e.preventDefault();const answer=normalize(new FormData(f).get('answer'));if(f.dataset.form==='solution'){if(answer==='소금물')next('filter');else fail('소금이 물속에 녹아 있는 액체의 이름을 써 보자.');}if(f.dataset.form==='heat'){if(['증발','증발시키기','물의증발'].includes(answer))next('done');else fail('거르기는 녹아 있는 소금을 붙잡지 못해. 물이 수증기가 되는 변화를 떠올려 보자.');}if(f.dataset.form==='mass'){if(checkMass(answer)){box.innerHTML='<h3>심화 기록 완성</h3><p>처음 23 g, 회수 21 g. 흘린 소금물에 소금 2 g이 함께 빠져나갔다. 맑은 액체라고 버려도 되는 것은 아니었다!</p>'+b('finish','기록을 챙기고 친구들에게 돌아가기');q('[data-lab="finish"]').onclick=()=>{if(!finished){finished=true;onComplete();}};}else fail('처음 소금 4 g과 회수한 소금 2 g을 비교해 보자. 물의 질량은 계산에 넣지 않는다.');}});
  }
  render();return ()=>{finished=true;host.classList.remove('salt-workshop-panel');};
 }
 const api={mount,checkPlan,checkMass};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SaltWorkshop=api;
})(typeof window==='undefined'?globalThis:window);
