(function(root){
 'use strict';
 const normalize=v=>String(v||'').normalize('NFKC').replace(/\s/g,'');
 const photos=[{id:'a',name:'A · 학교 소개 영상 촬영 준비',flag:'동',ground:'마른 바닥',time:'10:00',wind:'서'},{id:'b',name:'B · 은호가 하나에게 원고를 건네는 모습',flag:'남',ground:'마른 바닥',time:'10:20',wind:'북'},{id:'c',name:'C · 비어 있는 촬영 자리',flag:'남',ground:'빗방울 자국',time:'10:40',wind:'북'}];
 function check(answers){const errors=[];for(const p of photos){const a=answers?.[p.id]||{};if(normalize(a.wind).replace(/풍$/,'')!==p.wind)errors.push({id:p.id,kind:'wind'});if(normalize(a.time)!==p.time)errors.push({id:p.id,kind:'time'});}return {ok:errors.length===0,errors};}
 function initial(saved){const s=saved&&typeof saved==='object'?saved:{};const answers={};for(const p of photos)answers[p.id]={time:String(s.answers?.[p.id]?.time||'').slice(0,10),wind:String(s.answers?.[p.id]?.wind||'').slice(0,10)};const explanation=String(s.explanation||'').slice(0,1500);const fogExplanation=String(s.fogExplanation||'').slice(0,1000),safetyPlan=String(s.safetyPlan||'').slice(0,1000);return {answers,explanation,fogExplanation,safetyPlan,attempts:Number.isInteger(s.attempts)?Math.max(0,s.attempts):0,firstIndependent:s.firstIndependent===true,reviewed:s.reviewed===true,complete:!!s.complete&&check(answers).ok&&(!!explanation.trim()||(s.record?.mode==='oral'&&s.record.spoken===true))&&s.reviewed===true};}
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function mount(host,onDone,saved,onSave,onSound){
  let state=initial(saved),feedback='',disposed=false;
  const record=LearningRecord.initial(saved&&saved.record);
  state.record=record;
  if(saved&&saved.complete&&record.mode==='oral'&&record.spoken&&state.reviewed&&check(state.answers).ok)state.complete=true;
  const started=Date.now();
  let elapsed=Math.max(0,Number(saved&&saved.elapsed)||0);
  const history=Array.isArray(saved&&saved.history)?saved.history.slice(-50):[];
  const save=()=>onSave&&onSave(state);
  function render(){const correct=check(state.answers).ok;
   host.innerHTML=`<section class="evidence-work"><h3>사진관 · 섞인 인화 봉투</h3><p>소미: 인화한 사진에는 촬영 시각이 찍혀 있지 않아. 선생님이 세 번 남긴 관측 기록으로 촬영 시각을 복원하자. 하나가 소개 원고를 받은 사진은 어느 순간일까?</p><details open><summary>선생님의 관측 일지</summary><table><thead><tr><th>시각</th><th>바람이 불어온 쪽</th><th>바닥 관찰</th></tr></thead><tbody><tr><td>10:00</td><td>서</td><td>말라 있음</td></tr><tr><td>10:20</td><td>북</td><td>말라 있음</td></tr><tr><td>10:40</td><td>북</td><td>빗방울 자국이 생김</td></tr></tbody></table><small>세 장은 위 세 관측 시각에 한 장씩 찍었다. 당시 깃발은 바람에 곧게 펄럭였다. 실제 사진을 대신하는 관찰 스케치다.</small></details><form class="evidence-form"><div class="evidence-photos">${photos.map(p=>`<article><h4>${p.name}</h4><div class="evidence-sketch" aria-label="깃발 끝 ${p.flag}쪽, ${p.ground}"><span>북 ↑</span><strong>${p.flag==='동'?'⚑ → 동':'⚑ ↓ 남'}</strong><span>${p.ground==='마른 바닥'?'──── 마른 흙':'· ◦ · ◦ 빗방울 자국'}</span></div><label>불어온 쪽<input name="${p.id}-wind" value="${escape(state.answers[p.id].wind)}" maxlength="10" placeholder="방향 직접 쓰기" required></label><label>봉투에 쓸 시각<input name="${p.id}-time" value="${escape(state.answers[p.id].time)}" maxlength="10" placeholder="시:분" inputmode="numeric" required></label></article>`).join('')}</div><button type="submit">봉투 기록 대조하기</button></form><p role="status">${escape(feedback)}</p>${correct&&state.attempts?`<form class="evidence-explain"><h4>은호: B도 C도 남쪽으로 펄럭이는데, 왜 같은 시각이 아니야?</h4><label>하나가 소개 원고를 받은 시각을 말하고, 깃발과 바닥에서 찾은 근거로 은호에게 설명해 줘.<textarea name="explanation" rows="4" maxlength="1500" required>${escape(state.explanation)}</textarea></label><p>녹음에는 “하나야, 소개 원고 받아.”가 남았다. 하나의 “받았어. 다음은 내가 읽을게.”라는 대답도 들린다. 이것은 사진 속 행동과 인물을 연결하지만, 녹음만으로 시각을 정할 수는 없다.</p><label>하나: 다음에 렌즈를 닦아도 골대가 흐리면 무엇을 비교해 볼까? 풀잎의 물방울·공기 속 안개·높은 구름의 위치 차이를 설명해 줘.<textarea name="fogExplanation" rows="3" maxlength="1000" required>${escape(state.fogExplanation)}</textarea></label><label>태오: 아침엔 맑았는데 지금 바람이 세지고 바닥이 젖었어. 다음 촬영 장소와 기록을 지킬 방법을 두 근거와 함께 적어 줘.<textarea name="safetyPlan" rows="3" maxlength="1000" required>${escape(state.safetyPlan)}</textarea></label><label><input type="checkbox" name="reviewed" ${state.reviewed?'checked':''} required>내 설명에 ‘바람이 불어온 쪽’과 ‘B/C의 바닥 차이’가 들어 있는지 다시 읽었어.</label><small>서술은 단어 개수로 정답 처리하지 않습니다. 선생님이 근거와 설명의 연결을 확인합니다.</small><button type="submit">설명을 수첩에 남기기</button></form>`:''}${state.complete?`<section class="evidence-result"><h4>수첩에 남긴 증거</h4><p>구성 과제: ${state.firstIndependent?'첫 대조에서 모두 연결':'피드백 후 기록 수정'} · 대조 ${state.attempts}회</p><p>${escape(state.explanation)}</p><p>물방울 관찰: ${escape(state.fogExplanation)}</p><p>다음 촬영 계획: ${escape(state.safetyPlan)}</p><p>교사 확인: 풍향과 깃발의 반대 관계 / 두 자료 교차 사용 / 다른 시각을 배제하는 근거. 서술 평가는 아직 하지 않았습니다.</p><button type="button" data-evidence-done>사진을 나눠 지키러 가기 →</button></section>`:''}</section>`;
  }
  function enhance(){
   host.querySelectorAll('.evidence-sketch').forEach((el,i)=>{
    const p=photos[i];
    el.insertAdjacentHTML('beforebegin',`<section class="evidence-observation-record" aria-label="${p.name} 관찰 기록"><h5>사진 관찰 기록</h5><p>${p.id==='a'?'학생들이 카메라 앞에서 촬영을 준비하고 있다.':p.id==='b'?'은호가 건넨 종이를 하나가 두 손으로 받고 있다.':'카메라 앞 촬영 자리에 아무도 없다.'}</p><p>바닥: ${p.ground}</p></section>`);
    el.setAttribute('aria-label','촬영자가 따로 남긴 깃발 관찰');
    el.innerHTML=`<span>촬영자의 깃발 스케치 · 북 ↑</span><strong>${p.flag==='동'?'⚑ → 동':'⚑ ↓ 남'}</strong>`;
   });
   const note=host.querySelector('details small');
   if(note)note.textContent='세 장은 위 세 시각에 한 장씩 찍었다. 깃발 방향은 촬영자가 따로 그려 두었다. 행동과 바닥의 세부 삽화 대신 글로 옮긴 관찰 기록을 제공한다.';
   const form=host.querySelector('.evidence-explain');
   if(form){
    form.querySelector('h4').textContent='소미: B와 C가 같은 시각일 수 없는 이유 한 가지만 설명해 줘.';
    form.querySelector('[name="explanation"]').closest('label').firstChild.textContent='깃발과 바닥을 일지에 맞춰 본 뒤, B가 하나에게 원고를 건네는 사진인 이유를 짧게 쓰거나 말해 줘.';
    const extension=document.createElement('details');extension.className='teacher-extension';
    extension.innerHTML='<summary>교사용 선택 활동 · 물방울 관찰과 다음 촬영 계획</summary><p>이 활동은 이야기 완료 조건이 아닙니다.</p>';
    for(const name of ['fogExplanation','safetyPlan']){const field=form.querySelector(`[name="${name}"]`);field.required=false;extension.append(field.closest('label'));}
    form.insertBefore(extension,form.querySelector('button[type="submit"]'));
    form.insertAdjacentHTML('afterbegin',`<fieldset class="response-mode"><legend>설명을 남기는 방법</legend><button type="button" data-response-mode="written" aria-pressed="${record.mode==='written'}">글로 남기기</button><button type="button" data-response-mode="oral" aria-pressed="${record.mode==='oral'}">모둠에서 말로 설명하기</button></fieldset>`);
    form.querySelector('legend').textContent='설명을 남기는 방법';
    if(record.mode==='oral'){
     form.querySelectorAll('textarea').forEach(el=>{el.required=false;el.rows=2;el.placeholder='선택: 친구나 선생님이 핵심만 기록해도 돼요.';});
     form.insertAdjacentHTML('beforeend',`<label><input type="checkbox" name="spoken" ${record.spoken?'checked':''} required>B와 C를 나눈 핵심 이유를 친구나 선생님에게 말로 설명했어요.</label><p>녹음하지 않습니다. 말로 제출해도 성취 확인은 선생님이 따로 합니다.</p>`);
    }
   }
   const work=host.querySelector('.evidence-work');
   work.insertAdjacentHTML('beforeend',`<details class="teacher-record"><summary>교사용 · 설명 확인 / 시범 플레이 기록</summary><p>게임 완료와 성취 확인은 별개입니다. 학생 이름 없이 이 기기의 진행 기록에 보관됩니다. 체험 모드는 창을 나가기 전에 내려받으세요.</p>${Object.entries(LearningRecord.criteria).map(([key,label])=>`<label>${label}<select data-rating="${key}">${['미확인','확인','다시 설명'].map(v=>`<option ${record.ratings[key]===v?'selected':''}>${v}</option>`).join('')}</select></label>`).join('')}<label>관찰 메모<textarea data-teacher-notes rows="3" maxlength="3000" placeholder="무힌트로 막힌 곳 / 수정 이유 / 다른 시각을 배제한 설명 / 읽기 부담 / 실제 완료 시간">${escape(record.notes)}</textarea></label><button type="button" data-export-record>학습 기록 내려받기</button><p>대조 ${state.attempts}회 · 이 화면 체류 약 ${Math.round((elapsed+Date.now()-started)/60000)}분(읽기 포함, 성취 점수 아님)</p></details>`);
  }
  const baseRender=render;
  render=function(){baseRender();host.innerHTML=host.innerHTML.replaceAll('은호에게','친구에게').replaceAll('은호:', '태오:');enhance();};
  function capture(form){const d=new FormData(form);for(const p of photos)state.answers[p.id]={wind:String(d.get(p.id+'-wind')||''),time:String(d.get(p.id+'-time')||'')};state.complete=false;state.reviewed=false;}
  function submit(e){if(disposed)return;e.preventDefault();if(e.target.matches('.evidence-form')){capture(e.target);const result=check(state.answers);state.attempts++;if(state.attempts===1)state.firstIndependent=result.ok;feedback=result.ok?'소미: 세 봉투가 서로 모순 없이 이어졌어. 이제 왜 그렇게 판단했는지 은호에게 설명해 줘.':result.errors.some(x=>x.kind==='wind')?'은호: 깃발 끝이 향한 쪽을 바람이 온 쪽이라고 쓴 건 아닐까? 양쪽 관계를 다시 그려 보자.':'소미: 깃발 방향만으로는 B와 C를 나눌 수 없어. 바닥의 변화까지 관측 일지와 맞춰 보자.';}
   else if(e.target.matches('.evidence-explain')){const d=new FormData(e.target);state.explanation=String(d.get('explanation')||'').trim();state.fogExplanation=String(d.get('fogExplanation')||'').trim();state.safetyPlan=String(d.get('safetyPlan')||'').trim();state.reviewed=d.get('reviewed')==='on';record.spoken=d.get('spoken')==='on';state.complete=check(state.answers).ok&&(record.mode==='oral'?record.spoken:!!state.explanation)&&state.reviewed;}
   if(e.target.matches('.evidence-form')){history.push({attempt:state.attempts,answers:JSON.parse(JSON.stringify(state.answers)),errors:check(state.answers).errors});state.history=history.slice(-50);}
   state.elapsed=elapsed+Date.now()-started;
   if(onSound)onSound('paper');save();render();
  }
  function input(e){if(e.target.closest('.evidence-form')){capture(e.target.closest('form'));}else if(['explanation','fogExplanation','safetyPlan'].includes(e.target.name)){state[e.target.name]=e.target.value;state.complete=false;}else if(e.target.name==='reviewed'){state.reviewed=e.target.checked;state.complete=false;}save();}
  function click(e){
   const mode=e.target.closest('[data-response-mode]');
   if(mode){record.mode=mode.dataset.responseMode;state.complete=false;save();render();return;}
   if(e.target.closest('[data-export-record]')){
    const data={...state,elapsed:elapsed+Date.now()-started,history,notice:'교사의 수업 관찰용. 자동 성취 판정 아님. 체류 시간은 읽기/자리 비움 포함.'};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='weather-learning-record.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   }
   if(e.target.closest('[data-evidence-done]')&&state.complete)onDone();
  }
  function recordInput(e){if(e.target.dataset.rating)record.ratings[e.target.dataset.rating]=e.target.value;if(e.target.hasAttribute('data-teacher-notes'))record.notes=e.target.value;if(e.target.name==='spoken')record.spoken=e.target.checked;save();}
  host.addEventListener('input',recordInput);
  host.addEventListener('submit',submit);host.addEventListener('input',input);host.addEventListener('click',click);render();
  return ()=>{disposed=true;state.elapsed=elapsed+Date.now()-started;save();host.removeEventListener('input',recordInput);host.removeEventListener('submit',submit);host.removeEventListener('input',input);host.removeEventListener('click',click);};
 }
 const api={check,initial,mount,photos};if(typeof module!=='undefined')module.exports=api;root.EvidenceTask=api;
})(typeof window==='undefined'?globalThis:window);
