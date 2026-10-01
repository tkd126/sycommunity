(function(root){
 'use strict';
 function canInspect(s){return !s.dialogue.length&&!s.question&&!s.lab;}
 function typeLine(text,write,clock={set:f=>setInterval(f,32),clear:id=>clearInterval(id)}){
  const chars=Array.from(text);let n=0,active=true;write('');
  const timer=clock.set(()=>{if(!active)return;write(chars.slice(0,++n).join(''));if(n>=chars.length){active=false;clock.clear(timer);}});
  return {finish(){if(!active)return false;active=false;clock.clear(timer);write(text);return true;},dispose(){active=false;clock.clear(timer);}};
 }
 function mount(host,onDone,saved,onChange=()=>{},sound=()=>{}){
  const R=root.Chapter2V3State,L=root.Chapter2V3Layout,esc=root.RoomScene.esc;
  let s=R.initial(saved),typing=null,disposed=false,labTimer=null;
  s=R.act(s,{type:'story-start'});
  if(s.lab?.kind==='pressure')s.lab=null;
  const names={ruler:'긴 자',broom:'빗자루',clip:'집게',flashlight:'손전등',tape:'녹음테이프'};
  const portraits={'소미':'somi','태오':'taeo','강은호':'eunho','1999년 담임':'teacher'};
  const button=(action,label)=>`<button type="button" data-v3="${action}">${label}</button>`;
  function dispatch(type,target,value){
   if(type==='next'&&typing?.finish())return;
   const previousRoom=s.room;
   const scrollPositions=['.v3-evidence','.v3-lab','.lab-controls','.v3-work-body','.v3-world'].map(selector=>{const el=host.querySelector(selector);return {selector,left:el?.scrollLeft||0,top:el?.scrollTop||0};});
   s=R.act(s,{type,target,value});onChange(s);
   if(type==='inspect')sound('paper');
   if(s.complete){onDone();return;}render();
   if(s.room===previousRoom)for(const position of scrollPositions){const el=host.querySelector(position.selector);if(el){el.scrollLeft=position.left;el.scrollTop=position.top;}}
  }
  function render(){
   typing?.dispose();typing=null;clearTimeout(labTimer);labTimer=null;
   const room=L[s.room],talk=s.dialogue[0],open=s.room==='prep'&&s.seen.doorOpen;
   if(s.after==='teaser-still'||s.after==='teaser-moved'){
    host.classList.add('v3-talking');
    host.innerHTML=`<div class="v3-teaser"><img src="${s.after==='teaser-still'?'assets/classroom-night-cartoon-v1.png':'assets/chapter2-v3/classroom-chair-moved-v1.png'}" alt="멈춘 화면에 나타난 빈 교실${s.after==='teaser-moved'?' · 왼쪽 의자가 뒤로 나와 있다':''}"><small>재생을 멈췄는데…</small></div><button type="button" class="dialogue v3-dialogue" data-v3="next"><span class="speaker">${esc(talk?.speaker||'소미')}</span><span class="line v3-text"></span><span class="continue-mark">▼</span></button>`;
    const span=host.querySelector('.v3-text');typing=typeLine(talk?.text||'',value=>{span.textContent=value;});return;
   }
   host.classList.toggle('v3-inspecting',!canInspect(s));
   const spots=room.spots.filter(p=>!(open&&p.id==='strap')).map(p=>`<path d="${p.path}" class="v3-spot ${p.soft?'v3-soft':''}" data-target="${p.id}" tabindex="${talk?'-1':'0'}" role="button" aria-label="${open&&p.id==='door'?'열린 출입문':p.label}"><title>${open&&p.id==='door'?'열린 출입문':p.label}</title></path>`).join('');
   const clip=s.room==='prep'?'<image class="v3-clip-art" href="assets/chapter2-v3/binder-clip.png" x="1262" y="302" width="120" height="90" pointer-events="none"/>':s.room==='archive'?'<image href="assets/school-cartoon-v1.png" x="1084" y="113" width="259" height="178" preserveAspectRatio="xMidYMid slice" pointer-events="none"/>':'';
   host.innerHTML=`<div class="v3-world"><img class="v3-art" src="${open?room.openArt:room.art}" alt="${s.room==='yard'?'안개가 깔린 운동장, 벤치와 준비실':open?'출입문이 열린 방송 준비실':'방송 준비실의 문, 장비, 선반'}"><svg class="v3-spots" viewBox="0 0 1672 941" aria-label="그림 속 물건 조사">${clip}${spots}</svg></div><div class="v3-goal">${s.room==='yard'?'골대 쪽 목소리의 흔적을 찾자':'날아간 메모와 녹음을 확인하자'}<small>${talk?'화면을 누르면 계속':'물건에 마우스를 올리거나 눌러 조사'}</small></div>`;
   host.querySelector('.v3-spots').setAttribute('preserveAspectRatio','none');
   for(const spot of host.querySelectorAll('.v3-spot')){
    spot.setAttribute('tabindex',canInspect(s)?'0':'-1');
    spot.setAttribute('aria-disabled',String(!canInspect(s)));
   }
   if(s.notebook?.length&&!talk&&!s.question&&!s.lab)host.insertAdjacentHTML('beforeend','<button class="v3-notebook-button" data-notebook="true">주운 수첩 · 메모 읽기</button>');
   if(s.question==='notebook'&&!talk){host.insertAdjacentHTML('beforeend',`<section class="v3-notebook"><h3>이름 없는 수첩</h3><p>운동장에서 주운 한 권. 우리가 쓰지 않은 문장이 늘어나고 있다.</p>${s.notebook.map(n=>`<p class="v3-notebook-entry">${esc(n.text)}</p>`).join('')}${button('cancel','수첩 덮기')}</section>`);}
   const science=root.Chapter2WeatherStory.tasks[s.question];
   if(['weather','coast'].includes(s.room)){
    host.querySelector('.v3-art').alt=s.room==='weather'?'일기도, 저울과 공기 용기, 접힌 쪽지가 있는 관측실':'낮과 밤 해안 사진, 녹음기, 참고 노트가 있는 편집실';
    host.querySelector('.v3-goal').innerHTML=s.room==='weather'?'테이프 뒷면과 일기도를 대조하자<small>쪽지의 숫자가 가리키는 곳은?</small>':'이름표과 촬영 기록이 맞는지 확인하자<small>낮·밤 해안 사진 → 녹음기</small>';
    if(!talk&&!s.question&&s.room==='weather')host.insertAdjacentHTML('beforeend','<div class="v3-held"><button type="button" data-target="tape-back">챙긴 테이프 · 뒷면 살펴보기</button></div>');
   }
   if(s.room==='archive'){
    host.querySelector('.v3-art').alt='자료실의 촬영 일지, 사진 봉투, 벽에 걸린 운동장 사진';
    host.querySelector('.v3-goal').innerHTML='어제 촬영한 사진을 찾아보자<small>촬영 일지의 두 조건과 사진 비교하기</small>';
    if(s.question==='photo')host.insertAdjacentHTML('beforeend',`<figure class="v3-evidence"><h3>촬영 기록 · 어제 사진을 찾을 단서</h3><p class="v3-photo-conditions">① 골대 뒤에 안개가 끼었다　② 서풍이 불었다<br>사진 왼쪽은 서쪽, 오른쪽은 동쪽</p><div class="v3-photo-board"><img src="assets/chapter2-v3/photo-comparison.png" alt="1번은 맑은 배경과 오른쪽 깃발, 2번은 안개와 오른쪽 깃발, 3번은 안개와 왼쪽 깃발"></div><figcaption>1번 · 왼쪽　 /　 2번 · 가운데　 /　 3번 · 오른쪽</figcaption></figure>`);
    if(s.after==='end')host.insertAdjacentHTML('beforeend','<img class="v3-evidence-detail" src="assets/chapter2-v3/archive-evidence.png" alt="빨간 표시가 붙은 녹음테이프 아래 운동장에서 주운 수첩이 놓인 어제 사진">');
   }
   if(talk&&s.seen.massClue&&s.room==='weather'&&s.dialogue.some(line=>line.text.includes('흐릿한 책상')||line.text.includes('녹음테이프 아래 빨간')))host.insertAdjacentHTML('beforeend','<img class="v3-evidence-detail" src="assets/chapter2-v3/archive-evidence.png" alt="찾아낸 사진 확대: 테이프 아래 빨간 끈의 수첩">');
   host.querySelector('.v3-goal').textContent=root.Chapter2Interactions.goal(s);
   if(s.after==='editing-playback'){
    const label=s.seen.playback===0?'☀ 낮 · 육지 30℃ / 바다 20℃ · 바다 → 육지':'☾ 밤 · 육지 10℃ / 바다 20℃ · 육지 → 바다';
    host.insertAdjacentHTML('beforeend',`<div class="v3-playback">${root.Chapter2Investigation.frame(s.seen.playback!==0)}<p>${label}</p><small>복원한 촬영본 · ${s.seen.playback===0?'첫 번째':'두 번째'} 장면</small></div>`);
   }
   if(!talk){const activity=root.Chapter2Investigation.render(s,esc);if(activity){host.classList.remove('v3-talking');host.querySelector('.v3-held')?.remove();host.insertAdjacentHTML('beforeend',activity);return;}}
   if(s.lab&&!talk){host.classList.remove('v3-talking');host.querySelector('.v3-activities')?.remove();host.querySelector('.v3-held')?.remove();host.insertAdjacentHTML('beforeend',root.Chapter2Active.render(s.lab));if(s.lab.kind==='mass'&&s.lab.measured)labTimer=setTimeout(()=>{if(!disposed&&s.lab?.measured)dispatch('lab-finished');},2200);return;}
   if(talk){
    host.classList.add('v3-talking');
    const character=portraits[talk.speaker];
    const cast=character==='teacher'?['teacher','somi']:['taeo',character==='eunho'?'eunho':'somi'];
    host.insertAdjacentHTML('beforeend',`<div class="characters v3-cast" aria-hidden="true">${cast.map((id,i)=>`<img class="character ${id===character?'is-active':''}" style="left:${i?76:26}%" src="assets/characters/${id}/normal.png" alt="">`).join('')}</div>`);
    host.insertAdjacentHTML('beforeend',`<button type="button" class="dialogue v3-dialogue" data-v3="next"><span class="speaker">${esc(talk.speaker)}</span><span class="line v3-text"></span><span class="continue-mark">▼</span></button>`);
    const span=host.querySelector('.v3-text');typing=typeLine(talk.text,value=>{span.textContent=value;});
   }else{
    host.classList.remove('v3-talking');
    if(s.question==='photo'){
     host.insertAdjacentHTML('beforeend',`<section class="v3-question v3-photo-answer"><h3>문제 · 두 기록에 모두 맞는 사진은?</h3><p>사진 번호 하나만 골라 보자.</p><div>${[1,2,3].map(n=>`<button data-photo="${n}">${n}번 사진</button>`).join('')}${button('cancel','다시 살펴보기')}</div></section>`);
    }else if(s.question==='unfold-note'){
     host.insertAdjacentHTML('beforeend','<section class="v3-question v3-note-action"><p>접힌 틈으로 연필 자국이 보인다.</p><button data-unfold-note="true">쪽지를 조심히 펼치기</button></section>');
    }else if(s.question==='gradient'){
     host.insertAdjacentHTML('beforeend','<section class="v3-question"><p>쪽지와 지도를 겹쳐 보자. 바람이 향하는 쪽은?</p><div><button data-map-answer="왼쪽">← A · 1020 hPa</button><button data-map-answer="오른쪽">B · 1008 hPa →</button></div></section>');
    }else if(s.question==='tapeBreeze'){
     host.insertAdjacentHTML('beforeend',root.Chapter2Interactions.renderTape(s));
    }else if(s.question==='valley'){
     host.insertAdjacentHTML('beforeend','<section class="v3-question v3-landscape-task"><h3>산에서 찍은 낮 장면</h3><figure><img src="assets/chapter2-v3/valley-day-v1.png" alt="햇빛을 받는 높은 산비탈과 아래 골짜기를 흐르는 물"><figcaption>가운데 물길이 있는 곳은 낮은 골짜기, 양옆은 높은 산비탈이에요.</figcaption></figure><p>햇볕에 데워진 산비탈의 공기가 위로 올라가요. 아래쪽 공기는 어느 쪽으로 움직일까요?</p><div><button data-valley="산쪽">골짜기 → 산비탈 위쪽 ↗</button><button data-valley="골짜기쪽">산비탈 → 골짜기 ↙</button></div><button data-v3="cancel">다시 살펴보기</button></section>');
    }else if(root.Chapter2Interactions.scenes[s.question]){
     host.insertAdjacentHTML('beforeend',root.Chapter2Interactions.render(s.question,esc));
    }else if(s.question&&s.question!=='notebook'){
     const prompts={dew:'잎 표면에 맺힌 물방울을 뭐라고 부르지?',sky:'높은 하늘에 모여 있는 것은?',fog:'골대 앞, 땅 가까이 떠 있는 것은?',wind:'종이가 밀려간 쪽은? (왼쪽 / 오른쪽)',photo:'어느 사진이 촬영 일지와 맞을까? (1 / 2 / 3)'};
     host.insertAdjacentHTML('beforeend',`<form class="v3-question"><label for="v3-answer">소미 · ${esc(science?.prompt||prompts[s.question])}</label><div><input id="v3-answer" autocomplete="off" maxlength="30" placeholder="짧게 적어 보기"><button type="submit">말하기</button>${button('cancel','다시 살펴보기')}</div></form>`);
     if(s.question==='dew')host.insertAdjacentHTML('beforeend','<img class="v3-detail" src="assets/chapter2-v3/dew.png" alt="잎의 표면에 붙어 있는 작은 물방울 확대">');
    }
    if(s.inventory.length&&!s.question)host.insertAdjacentHTML('beforeend',`<div class="v3-tools" aria-label="챙긴 물건">${s.inventory.map(id=>`<button type="button" data-select="${id}" aria-pressed="${s.selected===id}">${names[id]}</button>`).join('')}<small>${s.selected?names[s.selected]+' 선택됨 · 사용할 물건을 누르세요':'챙긴 물건 · 사용할 도구를 고르세요'}</small></div>`);
    if(s.room==='prep'&&s.seen.inserted&&!s.question)host.insertAdjacentHTML('beforeend',`<div class="v3-recorder">${s.seen.rewound?button('play','▶ 녹음 듣기'):button('rewind','◀◀ 처음으로 되감기')}</div>`);
   }
  }
  function click(e){
   if(s.dialogue.length){dispatch('next');return;}
   if(e.target.closest('[data-notebook]')){dispatch('notebook');return;}
   const choice=e.target.closest('[data-story-choice]');if(choice){dispatch('story-choice','',choice.dataset.storyChoice);return;}
   const work=e.target.closest('[data-work-key]');if(work){dispatch('work-set',work.dataset.workKey,work.dataset.workValue);return;}
   if(e.target.closest('[data-work-check]')){dispatch('work-check');return;}
   const tapeListen=e.target.closest('[data-tape-listen]');if(tapeListen){dispatch('tape-listen',tapeListen.dataset.tapeListen);return;}
   const clue=e.target.closest('[data-clue-answer]');if(clue){dispatch('answer',s.question,clue.dataset.clueAnswer);return;}
   if(e.target.closest('[data-unfold-note]')){dispatch('unfold-note');return;}
   const mapAnswer=e.target.closest('[data-map-answer]');if(mapAnswer){dispatch('answer','gradient',mapAnswer.dataset.mapAnswer);return;}
   const tapeAnswer=e.target.closest('[data-tape-answer]');if(tapeAnswer){dispatch('answer','tapeBreeze',tapeAnswer.dataset.tapeAnswer);return;}
   const lab=e.target.closest('[data-lab-open],[data-lab-key],[data-lab-check],[data-lab-close],[data-evidence],[data-photo],[data-valley]');
   if(lab){const d=lab.dataset;if(d.labOpen)dispatch('lab-open',d.labOpen);else if(d.labKey)dispatch('lab-set',d.labKey,d.labValue);else if(d.labCheck)dispatch('lab-check',s.lab?.kind);else if(d.labClose)dispatch('lab-close');else if(d.evidence)dispatch('evidence',d.evidence,d.mark);else if(d.photo)dispatch('answer','photo',d.photo);else if(d.valley)dispatch('answer','valley',d.valley);return;}
   const action=e.target.closest('[data-v3]')?.dataset.v3;
   if(action==='cancel'){s.question='';onChange(s);render();return;}
   if(['rewind','play'].includes(action)){dispatch('operate',action);return;}
   const selected=e.target.closest('[data-select]')?.dataset.select;
   if(selected){dispatch('select',selected);return;}
   const target=e.target.closest('[data-target]')?.dataset.target;
   if(target&&canInspect(s))dispatch('inspect',target);
  }
  function submit(e){e.preventDefault();dispatch('answer',s.question,host.querySelector('input').value);}
  function key(e){
   if(e.target.matches('input,button')||!['Enter',' '].includes(e.key))return;
   e.preventDefault();if(s.dialogue.length)dispatch('next');else if(e.target.dataset.target&&canInspect(s))dispatch('inspect',e.target.dataset.target);
  }
  host.classList.add('chapter2-v3');host.addEventListener('click',click);host.addEventListener('submit',submit);host.addEventListener('keydown',key);render();
  return ()=>{if(disposed)return;disposed=true;clearTimeout(labTimer);typing?.dispose();host.removeEventListener('click',click);host.removeEventListener('submit',submit);host.removeEventListener('keydown',key);host.classList.remove('chapter2-v3','v3-talking','v3-inspecting');};
 }
 const api={mount,typeLine,canInspect};if(typeof module!=='undefined')module.exports=api;root.Chapter2V3View=api;
})(typeof window==='undefined'?globalThis:window);
