(function(root){
 'use strict';
 const choices={
  arrival:{title:'방금 그 목소리, 어떻게 확인할까?',options:[['“은호야, 정말 하나 목소리였어?”','강은호','하나 목소리 같아. 그런데 얼굴은…… 분명 아는 앤데.'],['“소미야, 혼자 가지 말고 같이 보자.”','소미','같이 보자. 안 보인다고 아무도 없는 건 아니니까.'],['“하나야! 들리면 한 번만 더 대답해 줘!”','태오','하나야! ……잡음만 들리네. 혼자 들어가지는 말자.']]},
  observe:{title:'남은 흔적, 어디부터 살펴볼까?',options:[['소미와 젖은 잎부터','소미','좋아. 비가 왔는지도 기록이랑 비교해 보자.'],['은호와 골대 주변부터','강은호','여기서 같이 보자. 안개 속으로 들어가지는 말고.']]},
  trapped:{title:'손잡이가 헛돈다. 무엇부터 할까?',options:[['선생님께 상태를 설명한다','1999년 담임','걸쇠를 고치고 있으니 조금 기다리렴. 안에서는 문을 당기지 말아라.'],['은호와 다른 출입구를 찾는다','강은호','관리 안내문에 동선이 있었어. 아까 날아간 종이 사이에 있을까?'],['소미와 날아간 종이를 찾는다','소미','창문으로 바람이 들어왔잖아. 천이 향한 쪽을 보자.']]},
  voice:{title:'어제 녹음에 우리 이름이 있다',options:[['은호야, 장난친 건 아니지?','강은호','나도 처음 듣는 말이야. 못 믿겠으면 촬영 일지를 같이 보자.'],['이름이 나오는 부분부터 기록한다','소미','좋아. 들은 사실부터 적자. 녹음 날짜도 확인하고.'],['은호야, 너도 많이 놀랐지?','강은호','응. 믿어 줘서 고마워. 하나랑 촬영한 건 기억나는데 그 뒤가 흐릿해.']]},
  archive:{title:'은호는 고친 글씨가 자기 것이 아니라고 한다',options:[['믿어. 원본이랑 같이 비교하자','강은호','어제는 안개 때문에 운동장 촬영을 일찍 끝냈어. 일지도 남아 있을 거야.'],['필름 번호부터 대조하자','소미','감으로 판단하지 말고 날짜랑 번호를 같이 확인하자.'],['비슷한 글씨를 본 곳이 있어?','강은호','준비실 원고 여백에도 이런 작은 표시가 있었어. 같은 사람이 고쳤을까?']]},
  investigate:{title:'쪽지가 가리키는 기록을 어떻게 찾을까?',options:[['“은호야, 이 지워진 이름부터 알아보자.”','강은호','내가 이름표를 읽을게. 너는 먼저 결과를 예상해 봐.'],['“소미야, 이 날씨 기록이 서로 안 맞아.”','소미','두 날의 기록이 있네. 기압과 날씨가 서로 맞는지 보자.']]},
  edit:{title:'어긋난 촬영본, 무엇부터 맞춰 볼까?',options:[['영상의 낮과 밤부터','태오','밝은 장면이랑 어두운 장면을 먼저 나눠 보자.'],['관측 기록부터 비교한다','소미','온도와 바람 기록을 연결하면 이름표가 맞는지 알 수 있어.']]},
  promise:{title:'이 메시지를 누구와 먼저 정리할까?',options:[['선생님께 보여 줄 증거를 모은다','소미','사진, 원고, 녹음. 선생님이 오시면 셋이 함께 보여 드리자.'],['은호에게 알아낸 사실을 말한다','강은호','내 기억만 잘못된 게 아니었구나. 같이 확인해 줘서 고마워.'],['소미와 내일 확인할 일을 적는다','소미','내일 종이 울리면 창가의 빈자리. 너도 같은 말을 적어 줘.']]}
 };
 function offer(s,id){if(s.choices?.[id]!==undefined)return false;s.choiceId=id;s.question='story-choice';return true;}
 function advance(s,say){
  if(s.dialogue.length||s.lab||s.question)return false;
  if(s.after==='reveal-door'){
   if(offer(s,'voice'))return true;
   s.after='';s.seen.doorOpen=true;
   say(['태오','……문밖에서 쇠 긁는 소리가 나.'],['1999년 담임','이제 열리는구나. 많이 놀라지는 않았니? 손잡이는 수리를 맡겨야겠다.'],['소미','선생님, 어제 녹음에 저희 이름이 나와요. 저희가 오기 전인데요.'],['1999년 담임','우선 날짜부터 확인해 보자꾸나. 케이스의 필름 번호와 같은 촬영 일지가 자료실에 있단다.']);s.after='archive';return true;
  }
  if(s.after==='end'&&s.room==='coast'&&offer(s,'promise'))return true;
  if(s.after==='end'&&s.room==='coast'){
   s.after='teaser-still';
   say(['태오','잠깐. 멈춰 둔 화면이 바뀌었어. 우리 교실이잖아. 그런데 왜 밤이지?'],['소미','창가 자리…… 아무도 없는데 TV만 켜져 있어.']);return true;
  }
  if(s.after==='teaser-still'){
   s.after='teaser-moved';
   say(['강은호','방금 의자 끄는 소리…… 화면에서 난 거야?'],['태오','왼쪽 의자. 아까보다 뒤로 나와 있어. 누가 앉아 있었던 거야?'],['소미','……화면 꺼. 내일 저 자리에 혼자 가지 마.']);return true;
  }
  if(s.after==='teaser-moved'){s.complete=true;s.after='';return true;}
  if(s.after)return false;
  if(s.room==='weather'&&s.seen.noteOpened&&s.answers.density&&s.answers.high&&s.answers.low&&!s.answers.gradient){
   s.answers.gradient=true;
   say(['소미','찬 공기 이름표의 기록 번호와 흐린 날 촬영 일지의 번호가 같아. 이 묶음이 원본이야.'],['강은호','보관란에 “편집실, 해안 촬영본”이라고 적혀 있어. 옆 연결문으로 가면 돼.'],['태오','그럼 어제 촬영본에 오늘 우리 이름이 들어간 이유도 찾을 수 있을까?']);s.after='coast';return true;
  }
  if(!s.seen.choiceIntro)return false;
  const id=({yard:'arrival',prep:'trapped',archive:'archive',coast:'edit'})[s.room];
  if(id&&offer(s,id))return true;
  if(s.room==='yard'&&s.seen.camera&&offer(s,'observe'))return true;
  if(s.room==='weather'&&s.seen.noteOpened&&offer(s,'investigate'))return true;
  return false;
 }
 function open(s,kind,say,lines){s.question=kind;s.work={...s.work,[kind]:s.work?.[kind]||{}};say(...lines);return true;}
 function act(s,a,say){
  if(a.type==='story-start'){s.seen.choiceIntro=true;advance(s,say);return true;}
  if(a.type==='story-choice'){
   if(s.question!=='story-choice')return true;
   const opt=choices[s.choiceId]?.options[Number(a.value)];if(!opt)return true;
   s.choices={...s.choices,[s.choiceId]:Number(a.value)};s.question='';say([opt[1],opt[2]]);
   if(s.choiceId==='archive'&&s.choices.voice!==undefined)s.dialogue.push({speaker:'강은호',text:s.choices.voice===0?'아까는 나 의심했지? 그래도 기록은 같이 봐 줘.':s.choices.voice===2?'아까 내 말 들어 줘서 고마워. 생각나는 건 숨기지 않을게.':'아까 적어 둔 녹음 날짜랑 이 일지를 비교해 보자.'});return true;
  }
  if(a.type==='work-set'){
   if(!['manuscript','manuscript-repair','wind-evidence','weather-evidence','editing'].includes(s.question))return true;
   const w=s.work[s.question];
   if(s.question==='weather-evidence'&&((a.target==='claims'&&!w.directionDone)||(a.target==='direction'&&w.directionDone)))return true;
   if(a.target==='claims'){const n=String(a.value);w.claims=w.claims||[];w.claims=w.claims.includes(n)?w.claims.filter(x=>x!==n):w.claims.length<2?[...w.claims,n]:w.claims;}
   else if(['error','repair','direction','reason','dayTemp','nightTemp','dayPressure','nightPressure','dayWind','nightWind','order'].includes(a.target))w[a.target]=String(a.value);
   w.message='';if(s.question==='editing'){
    const keys=['dayTemp','nightTemp','dayPressure','nightPressure','dayWind','nightWind'];
    const count=keys.filter(key=>w[key]).length;
    if(count===6)act(s,{type:'work-check'},say);
    else w.message=`두 장면의 기록을 고르는 중 · ${count}/6`;
   }return true;
  }
  if(a.type==='answer'&&a.target==='wind-evidence'&&s.question==='wind-evidence'){
   if(String(a.value||'').replace(/\s/g,'')!=='서풍'){s.work['wind-evidence'].message='바람 이름은 불어오는 쪽으로 불러. 왼쪽 서쪽에서 들어와 오른쪽 동쪽으로 부는 바람이야.';return true;}
   s.answers.wind=true;s.question='';say(['소미','서쪽에서 불어오니까 서풍! 천 끝은 동쪽을 향하고 있어.'],['태오','종이도 오른쪽으로 날아갔겠네. 선반 밑에 하얀 모서리가 보여!']);return true;
  }
  if(a.type==='work-check'){
   const k=s.question,w=s.work?.[k];if(!w)return true;
   if(k==='wind-evidence'){
    w.message='서쪽에서 불어오는 바람의 이름을 적어 보자.';return true;
   }
   if(k==='manuscript'){
    if(w.error!=='4'){w.message='준비 과정과 관찰한 사실, 그 까닭을 설명한 문장을 나누어 읽어 보자. 실제로 일어날 수 없는 설명은 어느 것일까?';return true;}
    s.answers.manuscriptError=true;s.question='manuscript-repair';s.work['manuscript-repair']={};
    say(['태오','4번이 이상해. 유리컵인데 안의 물이 뚫고 나올 수는 없잖아.'],['강은호','그 부분만 글씨가 진해. 원래 문장을 지우고 덧쓴 것 같아.'],['소미','하나가 설명하던 장면이라며? 틀린 부분은 찾았으니까, 실제로 무슨 일이 일어난 건지 다시 생각해 보자.']);return true;
   }
   if(k==='manuscript-repair'){
    if(!s.answers.manuscriptError||w.repair!=='condense'){w.message='컵 안의 물과 컵 바깥의 공기를 구분해 보자. 차가운 표면에 닿은 수증기는 어떻게 될까?';return true;}
    s.answers.manuscript=true;s.question='';if(!s.inventory.includes('tape'))s.inventory.push('tape');
    say(['소미','컵 밖 공기 중의 수증기가 응결한 거야. 물이 유리를 뚫고 나온 게 아니지.'],['강은호','맞아. 그런데 이 줄만 내 글씨가 아니야. 케이스에도 같은 수정 표시가 있어.'],['태오','원고에 적힌 번호랑 테이프 번호는 같아. 녹음을 확인해 보자.']);return true;
   }
   if(k==='weather-evidence'){
    if(!w.directionDone){
     if(w.direction!=='right'){w.message='1020과 1008 중 어느 기압이 더 높을까? 지표 부근 공기는 높은 기압에서 낮은 기압 쪽으로 이동해.';return true;}
     w.directionDone=true;w.claims=[];w.message='';say(['소미','왼쪽에서 오른쪽으로 부는 기록이 맞네. 화살표는 확인했어.'],['강은호','그런데 아래 날씨 설명도 고쳐져 있어. 이번에는 두 기압의 날씨를 구별해 보자.']);return true;
    }
    if(w.direction!=='right'||w.claims?.length!==2||!w.claims.includes('1')||!w.claims.includes('2')){w.message='두 지점의 기압을 비교해 화살표를 정하자. 공기가 상승하면 구름이 생기기 쉽지만, 반드시 비가 오는 것은 아니야.';return true;}
    Object.assign(s.answers,{pressure:true,high:true,low:true});s.question='';say(['소미','높은 기압에서 낮은 기압 쪽으로. 저기압 중심에는 공기가 모여 상승하는 기록이 맞아.'],['강은호','다른 날의 고기압 이름표와 바뀌었네. 이 흐린 날 기록의 보관란에는 편집실이라고 적혀 있어.'],['소미',s.answers.density?'공기 비교 이름표도 맞췄으니 쪽지의 기록 번호와 마지막으로 대조하자.':'저울의 이름표도 확인해야 같은 번호의 기록인지 알 수 있겠어.']);return true;
   }
   if(k==='editing'){
    const required={dayTemp:'land',nightTemp:'sea',dayPressure:'sea',nightPressure:'land',dayWind:'land',nightWind:'sea'};
    const bad=Object.keys(required).find(key=>w[key]!==required[key]);
    if(bad){w.message=bad.includes('Temp')?'두 온도 기록을 장면에 맞춰 보자. 숫자가 더 큰 곳이 어디지?':bad.includes('Pressure')?'이 해안 모형에서는 상대적으로 차가운 쪽의 지표 기압이 높아.':bad.includes('Wind')?'지표 부근의 공기는 높은 기압에서 낮은 기압 쪽으로 이동해.':'케이스의 촬영 순서는 낮 다음 밤이야.';return true;}
    s.answers.editing=true;s.answers.sea=true;s.answers.land=true;s.question='';s.seen.playback=0;s.after='editing-playback';
    say(['태오','복원한 첫 장면은 낮. 육지 30도, 바다 20도. 바람은 바다에서 육지로.']);return true;
   }
  }
  if(s.lab)return false;
  if(s.question&&a.type==='inspect')return true;
  if(s.room==='prep'){
   if(a.type==='inspect'&&a.target==='ribbon'){
    if(s.answers.wind){say(['소미','천 끝이 오른쪽을 향했지. 날아간 종이는 오른쪽 선반 밑부터 보자.']);return true;}
    return open(s,'wind-evidence',say,[['소미','열린 환기창과 천 끝을 함께 보자. 종이가 날아간 쪽을 먼저 예상해 볼까?']]);
   }
   if(a.type==='inspect'&&a.target==='tape'&&s.answers.manuscript){say(['소미','수정된 원고와 번호가 같은 테이프야. 녹음기에 넣고 처음부터 들어 보자.']);return true;}
   if(a.type==='inspect'&&a.target==='tape'&&s.seen.secured&&!s.answers.manuscript){
    if(s.answers.manuscriptError)return open(s,'manuscript-repair',say,[['소미','잘못 덧쓴 문장은 찾았지. 이제 원래 들어갈 설명을 같이 생각해 보자.']]);
    return open(s,'manuscript',say,[['소미','테이프 번호와 원고 번호가 같아. 그런데 이슬을 설명한 문장 하나가 이상해.'],['강은호','내가 고친 적 없는데…… 원고랑 실제 현상이 맞는지 봐 줄래?']]);
   }
   if(a.type==='operate'&&a.target==='play'){
    if(!s.seen.inserted||!s.seen.rewound)return false;
    if(!s.answers.manuscript){say(['소미','녹음기 옆 테이프의 원고부터 확인하자. 잘못 고친 부분이 있었어.']);return true;}
    s.seen.recordingHeard=true;s.question='';s.after='reveal-door';
    say(['강은호','어제 녹음한 학교 소개야. 하나가 컵을 들고…… 그다음은 기억이 흐릿해.'],['소미','촬영 종료라고 했는데 녹음은 계속돼. “태오야. 소미야. 이걸 찾았다면……”'],['태오','우리 이름이잖아. 어제는 아직 여기 오지도 않았는데.']);return true;
   }
  }
  if(s.room==='weather'&&s.seen.noteOpened&&a.type==='inspect'&&['high-chart','low-chart','tape-back'].includes(a.target)){
   if(s.answers.high&&s.answers.low){say(['소미','고기압에서는 대체로 맑고, 저기압에서는 공기가 올라가 구름이 생기기 쉬워. 우리가 찾는 것은 흐린 날 촬영 기록이야.']);return true;}
   return open(s,'weather-evidence',say,[['소미','테이프 표식과 같은 기록이야. 왼쪽 1020, 오른쪽 1008. 아래 설명도 누군가 고쳐 썼어.'],['강은호','바람 방향과 두 날의 기압·날씨 설명을 함께 확인하면 원본 기록을 구별할 수 있겠어.']]);
  }
  if(s.room==='weather'&&s.seen.noteOpened&&a.type==='inspect'&&a.target==='coded-note'){
   say(['소미','찬 공기 비교 이름표와 흐린 날 관측 기록. 같은 번호의 묶음이 원본이라고 적혀 있어.'],['태오',s.answers.density?'이름표는 찾았으니 벽의 관측 기록을 확인하자.':'저울 옆 이름표를 확인하고 벽의 기록과 번호를 맞춰 보자.']);return true;
  }
  if(s.room==='coast'&&a.type==='inspect'&&['day-coast','night-coast'].includes(a.target))return open(s,'editing',say,[['소미','원본에는 두 장면이 있어. 밝은 장면과 어두운 장면에 관측 기록을 맞춰 보자.'],['강은호','함께 적힌 온도는 낮 육지 30도·바다 20도, 밤 육지 10도·바다 20도야. 이름표만 믿지 말고 비교해 보자.']]);
  if(s.room==='coast'&&a.type==='inspect'&&a.target==='last-recording'&&!s.answers.editing){say(['소미','먼저 해안 촬영 장면과 온도·기압·바람 기록을 연결해 보자. 그래야 어느 부분이 뒤섞였는지 알 수 있어.']);return true;}
  return false;
 }
 function playback(s,say){
  if(s.after!=='editing-playback'||s.dialogue.length)return false;
  if(s.seen.playback===0){s.seen.playback=1;say(['강은호','두 번째는 밤. 육지 10도, 바다 20도. 바람이 육지에서 바다로 바뀌었어.']);}
  else{s.seen.playback=2;s.after='';say(['소미','밤 장면이 끝났는데 낮 촬영 종료 소리가 또 나와. 음성이 뒤에 붙어 있어.'],['태오','잘못된 이름표만의 문제가 아니었네. 녹음기에서 마지막 조각을 확인해 보자.']);}return true;
 }
 const b=(key,value,text,selected)=>`<button type="button" data-work-key="${key}" data-work-value="${value}" aria-pressed="${selected===value}">${text}</button>`;
 function frame(night){return `<svg class="v3-film-frame" viewBox="${night?'774':'351'} 17 370 215" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${night?'달이 떠 있는 밤 해안 촬영본':'햇빛이 비치는 낮 해안 촬영본'}"><image href="assets/chapter2-v3/coast-room.png" width="1672" height="941"/></svg>`;}
 function weatherPicture(weather){
  const content=weather?'<circle cx="90" cy="40" r="23" fill="#efc66b"/><path d="M185 22v62m-14-15 14 15 14-15M400 90V28m-14 15 14-15 14 15" fill="none" stroke="#416776" stroke-width="6"/><path d="M470 61c-36 0-38-30-13-36 2-27 42-26 47-5 32-4 42 40 9 41z" fill="#94aab5"/><text x="150" y="129">고기압 · 내려오는 공기</text><text x="455" y="129">저기압 · 올라가는 공기</text>':'<circle cx="130" cy="66" r="49" fill="#fff7df" stroke="#547782" stroke-width="4"/><circle cx="470" cy="66" r="49" fill="#fff7df" stroke="#547782" stroke-width="4"/><text x="130" y="62" font-size="26">1020</text><text x="470" y="62" font-size="26">1008</text><text x="130" y="88">hPa</text><text x="470" y="88">hPa</text><text x="300" y="80" font-size="40">?</text><text x="300" y="136">바람은 어느 쪽으로 불까?</text>';
  return '<svg style="display:block;width:100%;max-height:160px" viewBox="0 0 600 155" role="img" aria-label="'+(weather?'고기압의 하강 기류와 맑은 하늘, 저기압의 상승 기류와 구름':'왼쪽 1020 hPa, 오른쪽 1008 hPa 기압계')+'"><rect width="600" height="155" rx="16" fill="#dcebed"/><g fill="#24444f" text-anchor="middle" font-size="18">'+content+'</g></svg>';
 }
 function render(s,esc){
  if(s.question==='story-choice'){const c=choices[s.choiceId];return `<div class="characters v3-cast"><img class="character" style="left:26%" src="assets/characters/taeo/normal.png" alt=""><img class="character" style="left:76%" src="assets/characters/somi/normal.png" alt=""></div><section class="v3-story-choice" aria-label="이야기 선택">${c.options.map((o,i)=>`<button class="choice-btn" data-story-choice="${i}"><span class="choice-number">${i+1}</span><span class="choice-label">${esc(o[0])}</span></button>`).join('')}</section><div class="dialogue v3-choice-context"><span class="speaker">태오</span><span class="line">${esc(c.title)}</span></div>`;}
  const w=s.work?.[s.question];if(!w)return '';
  let title='',body='';
  if(s.question==='wind-evidence'){title='종이를 날린 바람';body=`<div class="v3-direction"><span>서쪽 · 열린 창문</span><strong>천 끝 →</strong><span>동쪽 · 선반</span></div><p>천이 서쪽 창문에서 동쪽으로 뻗어 있어. 이 바람을 뭐라고 부를까?</p><form class="v3-wind-form"><label for="v3-wind">바람의 이름</label><input id="v3-wind" maxlength="12" autocomplete="off" placeholder="직접 적어 보기"><button type="submit">말하기</button></form>`;}
  if(s.question==='manuscript'){title='누가 고친 촬영 원고';body=`<p>촬영 원고에서 과학적으로 틀린 문장 하나를 찾아보자.</p><fieldset><legend>틀린 문장 하나 고르기</legend><div class="v3-five">${['차가운 컵을 준비한다.','컵 겉면을 마른 수건으로 닦는다.','잠시 두고 겉면을 관찰한다.','컵 안의 물이 유리를 통과해 나온다.','컵 겉면에 작은 물방울이 맺힌다.'].map((t,i)=>b('error',String(i+1),`${i+1}. ${t}`,w.error)).join('')}</div></fieldset>`;}
  if(s.question==='manuscript-repair'){title='하나가 설명하려던 장면';body=`<p>잘못 덧쓴 문장은 찾았어. 컵 겉면의 물방울이 생긴 까닭을 바르게 고쳐 보자.</p><fieldset><legend>원고에 들어갈 설명</legend><div>${[['condense','컵 밖 수증기가 차가운 표면에서 응결한다'],['melt','유리가 녹아서 물이 된다'],['leak','얼음이 컵을 통과한다']].map(([v,t])=>b('repair',v,t,w.repair)).join('')}</div></fieldset>`;}
  if(s.question==='weather-evidence'){title=w.directionDone?'일기도 · 2/2 날씨 설명':'일기도 · 1/2 바람 방향';body=weatherPicture(!!w.directionDone)+(w.directionDone?`<p>그림을 보고 원고에 남길 올바른 날씨 설명 두 개를 골라 보자.</p><fieldset><legend>② 날씨 설명 두 개 선택 (${w.claims?.length||0}/2)</legend><div class="v3-five">${['저기압 중심은 공기가 모여 상승해 구름이 생기기 쉽다.','고기압 중심은 공기가 내려와 대체로 맑다.','저기압이면 반드시 비가 내린다.','고기압 중심의 기압은 주변보다 낮다.','저기압 중심에서 공기가 내려와 퍼져 나간다.'].map((t,i)=>b('claims',String(i+1),`${i+1}. ${t}`,w.claims?.includes(String(i+1))?String(i+1):'')).join('')}</div></fieldset>`:`<p>왼쪽 1020 hPa ─ 오른쪽 1008 hPa<br>수평 기압차만 고려한 지표 부근 모형. 바람은?</p><fieldset><legend>① 바람 방향</legend><div>${[['right','왼쪽 → 오른쪽'],['left','오른쪽 → 왼쪽'],['still','기압차가 있어도 이동하지 않음']].map(([v,t])=>b('direction',v,t,w.direction)).join('')}</div></fieldset>`);}
  if(s.question==='editing'){title='해안 촬영본 편집';body=`<p>촬영 메모: 낮 육지 30℃·바다 20℃ / 밤 육지 10℃·바다 20℃<br>두 장면의 세 항목을 모두 맞추면 촬영본이 이어져.</p><div class="v3-edit-grid">${[['day','☀ 밝은 장면'],['night','☾ 어두운 장면']].map(([p,t])=>`<article><h4>${t}</h4>${frame(p==='night')}${[['Temp','더 따뜻한 곳'],['Pressure','상대적으로 고기압인 곳'],['Wind','지표 바람이 향하는 곳']].map(([k,label])=>`<p>${label}</p><div>${b(p+k,'land',k==='Wind'?'바다 → 육지':'육지',w[p+k])}${b(p+k,'sea',k==='Wind'?'육지 → 바다':'바다',w[p+k])}</div>`).join('')}</article>`).join('')}</div>`;}
  if(!title)return '';
  return `<section class="v3-work" aria-label="${title}"><header><h3>${title}</h3><button data-v3="cancel">장면으로 돌아가기</button></header><div class="v3-work-body">${body}</div><p role="status">${esc(w.message||'선택한 근거를 확인하세요. 다시 누르거나 다른 답을 골라 수정할 수 있어요.')}</p>${['editing','wind-evidence'].includes(s.question)?'': '<button data-work-check="true">근거 확인하기</button>'}</section>`;
 }
 const api={act,advance,playback,render,choices,frame};if(typeof module!=='undefined')module.exports=api;root.Chapter2Investigation=api;
})(typeof window==='undefined'?globalThis:window);
