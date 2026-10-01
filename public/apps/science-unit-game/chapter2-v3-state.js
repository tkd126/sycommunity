(function(root){
 'use strict';
 const weather=typeof module!=='undefined'?require('./chapter2-weather-story'):root.Chapter2WeatherStory;
 const active=typeof module!=='undefined'?require('./chapter2-active'):root.Chapter2Active;
 const investigation=typeof module!=='undefined'?require('./chapter2-investigation'):root.Chapter2Investigation;
 const line=(speaker,text)=>({speaker,text});
 const intro=[line('소미','선생님과 운동장까지 왔어. 방송실에서 찾은 촬영 메모에는 골대 옆이라고 돼 있었지? 하나야, 거기 있어?'),line('태오','……방금 “여기”라고 한 거야? 너희도 들었지?'),line('소미','응. 대답이 들리긴 했는데…… 골대 뒤가 잘 안 보여.'),line('강은호','저 벤치, 촬영 장비를 놓던 자리야. 남겨 둔 게 있는지 보자.')];
 function initial(saved){
  const fresh={version:3,revision:1,room:'yard',seen:{},answers:{},inventory:[],selected:'',dialogue:intro,question:'',after:'',complete:false};
  if(!saved||saved.version!==3)return fresh;
  const restored={...fresh,...JSON.parse(JSON.stringify(saved)),seen:{...saved.seen},answers:{...saved.answers},inventory:Array.isArray(saved.inventory)?[...saved.inventory]:[],dialogue:Array.isArray(saved.dialogue)?saved.dialogue.map(x=>({...x})):[]};
  if(!saved.revision&&!restored.complete){
   if(restored.room==='prep'&&!restored.seen.recordingHeard&&restored.after!=='archive'){
    restored.seen.doorOpen=false;
    if(['tapePressure','tapeBreeze'].includes(restored.question)||restored.after==='tape-play'){
     restored.question='manuscript';restored.work={...restored.work,manuscript:{}};restored.after='';restored.dialogue=[];
    }
    if(restored.after==='door-open')restored.after='';
   }
   if(restored.room==='weather'&&['pressure','high','low','gradient'].includes(restored.question)){
    restored.question='';restored.dialogue=[];
   }
   if(restored.lab?.kind==='mass'){restored.lab={...restored.lab,measured:false};}
   if(restored.room==='coast'&&['sea','land'].includes(restored.question)){
    restored.question='editing';restored.work={...restored.work,editing:{}};restored.dialogue=[];
   }
  }
  restored.revision=1;return restored;
 }
 function reduce(previous,a){
  const s=initial(previous);
  const say=(...lines)=>{s.dialogue=lines.map(x=>Array.isArray(x)?line(...x):line('소미',x));};
  const ready=()=>s.seen.camera&&s.seen['weather-record']&&s.answers.dew&&s.answers.fog&&s.answers.sky;
  if(s.complete)return s;
  if(a.type==='next'){
   if(s.dialogue[0])s.history=[...(Array.isArray(s.history)?s.history:[]),{...s.dialogue[0]}].slice(-80);
   s.dialogue.shift();
   if(!s.dialogue.length&&(investigation.playback(s,say)||investigation.advance(s,say)))return s;
   if(!s.dialogue.length&&s.after==='lab-mass'){s.after='';active.act(s,{type:'lab-open',target:'mass'},say);return s;}
   if(!s.dialogue.length&&s.after==='tape-play'){s.after='';return act(s,{type:'operate',target:'play'});}
   if(!s.dialogue.length&&s.after==='prep'){
    s.after='';s.room='prep';s.question='';s.selected='';
    say(['1999년 담임','여기가 촬영 장비를 두는 곳이란다. 들어가 보렴. 선생님도 바로 따라 들어가마.'],['태오','앗, 바람 때문에 문이…… 선생님! 손잡이를 내려도 안 열려요.'],['1999년 담임','선생님 바로 밖에 있으니 걱정하지 말아라. 손잡이와 걸쇠를 잇는 부분이 고장 난 모양이구나. 밖에서 살펴보마.'],['소미','태오야, 문을 세게 당기지는 말자. 그런데 책상 위에 있던 종이 못 봤어?'],['태오','문 닫힐 때 날아갔어. 창문으로 바람이 들어오나 봐. 저 천도 펄럭이네.']);
   }else if(!s.dialogue.length&&s.after==='door-open'){
    s.after='';s.seen.doorOpen=true;
    say(['1999년 담임','이제 열리는구나. 안쪽 손잡이가 헛돌고 있었어. 수리를 맡겨야겠구나.'],['1999년 담임','놀랐지? 문은 열어 둘 테니 걱정 말아라. 아까 살펴보던 것은 함께 마저 보자꾸나.']);
   }else if(!s.dialogue.length&&s.after==='archive'){
    s.after='';s.room='archive';s.question='';s.selected='';s.inventory=[];
    say(['강은호','어제 끝까지 들어 봤을 때는 이런 말이 없었어. 분명히.'],['태오','누가 나중에 녹음한 걸까? 우리 이름을 어떻게 알고?'],['1999년 담임','우선 확인할 수 있는 것부터 보자꾸나. 어제 찍은 사진과 촬영 일지가 이곳에 있단다.'],['소미','사진에도 우리가 못 본 게 남아 있을지 몰라. 은호야, 같이 찾아보자.'],['강은호','응. 그런데…… 하나랑 여기서 사진을 정리했던 것 같은데, 얼굴은 생각이 안 나.']);
   }else if(!s.dialogue.length&&s.room==='archive'&&s.after==='end'){weather.enter(s,say);}
   else if(!s.dialogue.length&&weather.advance(s,say)){}
   else if(!s.dialogue.length&&s.after==='end'){s.complete=true;s.after='';}
   else if(!s.dialogue.length&&s.room==='yard'&&ready()){
    say(['태오','벤치 근처가 젖어 있어서 누가 막 다녀간 줄 알았는데…… 그것만 보고 따라가면 안 되겠네.'],['강은호','응. 메모에는 장비를 준비실로 옮겼다고 적혀 있어. 하나도 그쪽으로 갔을까?'],['소미','가서 확인해 보자. 아까 들린 목소리도 마음에 걸려. 선생님, 같이 가 주실 수 있어요?'],['1999년 담임','그래, 함께 가 보자꾸나. 안개 때문에 멀리서는 잘 보이지 않는구나. 길은 선생님이 먼저 살필 테니, 서로 떨어지지 말고 따라오렴.']);s.after='prep';
   }
   return s;
  }
  if(a.type==='story-start'){s.seen.choiceIntro=true;if(!s.dialogue.length)investigation.advance(s,say);return s;}
  if(s.dialogue.length)return s;
  if(a.type==='notebook'){s.question='notebook';return s;}
  if(investigation.act(s,a,say))return s;
  if(s.room==='weather'&&!s.seen.noteOpened&&(a.type==='lab-open'||a.type==='inspect'&&!['coded-note','room-speaker','weather-door'].includes(a.target))){say(['소미','잠깐, 책상 위 접힌 쪽지부터 읽어 보자. 무엇을 찾는지 알아야 기록을 비교할 수 있겠어.']);return s;}
  if(s.room==='weather'&&a.type==='inspect'&&a.target==='coded-note'&&!s.seen.noteOpened){
   say(['태오','어? 책상 위 종이가 들썩였어.'],['소미','접힌 쪽지잖아. 끝에 연필 자국이 보여.'],['강은호','찢어지지 않게 펼쳐 보자.']);s.question='unfold-note';return s;
  }
  if(s.room==='weather'&&a.type==='unfold-note'&&s.question==='unfold-note'){
   s.seen.noteOpened=true;s.question='';say(['소미','“찬 공기 비교 이름표와 흐린 날의 관측 기록. 같은 번호의 묶음이 원본.” 누가 찾아보라고 남겼나 봐.'],['강은호','저울 옆 이름표 두 개가 떨어져 있어. 벽의 촬영 일지도 고쳐져 있고.'],['소미','둘 다 확인하면 어느 기록이 맞는지 알겠어. 여기 적힌 보관란을 찾아보자.'],['태오','잠깐. 방금 복도에서 웃는 소리 안 났어?'],['강은호','……우리 셋 다 여기 있는데.']);return s;
  }
  if(active.act(s,a,say))return s;
  if(s.room==='archive'&&a.type==='evidence'&&s.question==='photo'){
   if(['fog','east','clear','west'].includes(a.target)&&a.value){
    s.photoMarks={...s.photoMarks};
    if(s.photoMarks[a.value])delete s.photoMarks[a.value];else s.photoMarks[a.value]=a.target;
    for(const key of ['fog','east','clear','west'])s.seen['evidence-'+key]=Object.values(s.photoMarks).includes(key);
    return s;
   }
   if(['fog','east','clear','west'].includes(a.target))s.seen['evidence-'+a.target]=!s.seen['evidence-'+a.target];return s;
  }
  if(s.room==='weather'&&a.type==='inspect'&&a.target==='air-balance'&&!s.answers.density){
   say(['태오','실험 기록에 공기 이름이 지워졌어. 어느 공기였는지 알아내면 뒤에 끼워진 사진도 찾을 수 있겠어.'],['소미','더 무거운 공기를 적은 기록이래. 먼저 예상하고, 저울로 확인해 보자.'],['강은호','이건 공기만 비교한 수업 모형이야. 기압은 같고 용기 무게는 뺐대. 부피부터 맞춰 보자.']);s.after='lab-mass';return s;
  }
  if(weather.act(s,a,say))return s;
  if(a.type==='select'){s.selected=s.inventory.includes(a.target)?a.target:'';s.question='';return s;}
  if(a.type==='answer'){
   const key=a.target,word=String(a.value||'').normalize('NFKC').replace(/\s/g,'');
   if(s.question!==key)return s;
   if(key==='photo'){
    if(word!=='2'&&word!=='2번'){say(['소미',word==='1'||word==='1번'?'이 사진은 운동장 끝까지 선명해. 일지에는 골대 뒤가 안 보였다고 했지?':'이 사진은 깃발이 서쪽으로 뻗어 있어. 사진 아래에 적힌 동쪽이 어느 쪽인지 다시 보자.'],['1999년 담임','한 가지가 비슷하다고 같은 날이라 할 수는 없지. 기록에 있는 조건을 하나씩 비교해 보렴.']);return s;}
    s.answers.photo=true;s.question='';say(['소미','두 번째는 골대 뒤가 안개에 가려져 있고, 깃발도 동쪽으로 뻗어 있어. 두 기록이 모두 맞네.'],['1999년 담임','좋다. 봉투에 적힌 필름 번호도 일지와 같구나. 어제 촬영분이 맞겠어.'],['강은호','이 사진 뒷면, 연필로 뭔가 적혀 있어.']);return s;
   }
   const answers={dew:['이슬'],fog:['안개'],sky:['구름'],wind:['오른쪽','동쪽','서풍']};
   if(!answers[key]?.includes(word)){say(key==='wind'?'천의 끝이 향하는 쪽을 봐. 바람이 들어오는 쪽과 나가는 쪽은 달라.':'물방울이 붙어 있는 곳을 다시 보자. 잎 표면은 이슬, 땅 가까운 공기는 안개, 높은 하늘은 구름이야. 다시 적어 볼래?');return s;}
   s.answers[key]=true;s.question='';
   const feedback={dew:[['소미','아, 이슬! 공기 중의 수증기가 차가운 잎에 닿아 물방울이 된 거지.'],['태오','난 누가 물 묻은 장비를 여기 내려놓은 줄 알았어.'],['소미','그럴 수도 있지만, 잎이 젖었다는 것만으로는 모르겠네. 누가 남긴 물건이나 글이 있는지 더 보자.']],fog:[['태오','안개였구나. 난 골대 뒤에 아무도 없는 줄 알았는데.'],['소미','안 보이는 거랑 없는 건 다르지. 아까 목소리가 난 쪽을 여기서는 확인하기 어렵겠어.'],['강은호','혼자 들어가진 말자. 다른 흔적부터 찾아보고 선생님과 같이 가자.']],sky:[['소미','응, 저 높은 곳에 있는 건 구름이야. 작은 물방울이나 얼음 알갱이가 모여 있지.'],['태오','골대 앞도 비슷하게 하얘서 같은 건 줄 알았어.'],['소미',s.answers.fog?'골대 앞은 땅 가까이에 생긴 안개였지. 그래서 여기서 사람을 찾기가 어려운 거야.':'골대 앞은 훨씬 낮은 곳이잖아. 목소리가 들린 쪽을 다시 자세히 보자.']],wind:[['태오','그럼 오른쪽 선반 쪽이겠네. 책상 밑만 찾고 있었어.'],['강은호','밖의 깃발도 그쪽으로 펄럭였지. 서쪽에서 불어오는 바람이라 서풍이라고 해.'],['소미','선반 밑에 들어갔을지도 몰라. 종이 끝이 보이는지 살펴보자.']]};
   say(...feedback[key]);return s;
  }
  if(a.type==='operate'&&s.room==='prep'){
   if(!s.seen.inserted){say('먼저 메모에 적힌 테이프를 녹음기에 넣자.');return s;}
   if(a.target==='rewind'){s.seen.rewound=true;say(['강은호','처음으로 돌아갔어. 재생해서 끝까지 들어 보자.']);}
   if(a.target==='play'){
    if(!s.seen.rewound)say('중간부터 들으면 무슨 녹음인지 모르겠어. 먼저 되감자.');
    else if(!s.seen.doorOpen)say('선생님이 문을 열어 주신 뒤 허락받고 같이 듣자. 손잡이의 끈부터 확인해 봐.');
    else {say(['강은호','녹음에서 내가 “식용우”라고 읽네…… 하나가 웃던 소리도 있어.'],['소미','잠깐, 끝난 뒤에도 목소리가 남아 있어. “태오야. 소미야. 이걸 찾았다면…… 다음에는 자료실로 와.”'],['태오','우리 이름이잖아. 이거 언제 녹음한 거야?'],['강은호','어제. 너희가 전학 오기 전인데.'],['소미','그런데…… 우리 이름을 어떻게 알지?'],['태오','창밖에 누가…… 아니, 안개 때문에 잘못 봤나?'],['1999년 담임','테이프는 선생님이 챙기마. 자료실까지 함께 가 보자꾸나.']);s.after='archive';}
   }return s;
  }
  if(a.type!=='inspect')return s;
  const id=a.target;s.question='';s.seen[id]=true;
  if(s.room==='archive'){
   const notes={
    logbook:[['소미','12월 27일. 어제 기록이야. “오전 운동장 촬영. 골대 뒤는 안개로 보이지 않음. 서풍.”'],['강은호','그래서 운동장 촬영을 일찍 끝냈어. 오후에 선생님이 인화한 사진을 가져오셨고.'],['1999년 담임','필름 번호도 적혀 있구나. 사진을 추린 뒤 봉투 번호까지 대조해 보자.']],
    map:[['태오','벽에 걸린 운동장 사진이야. 사진 밑에 왼쪽은 서쪽, 오른쪽은 동쪽이라고 적혀 있어.'],['소미','서풍은 서쪽에서 불어오는 바람이니까…… 사진 속 깃발 끝이 향하는 쪽도 확인할 수 있겠다.']],
    albums:[['강은호','예전 졸업 앨범들이야. 하나 이름을 찾아보고 싶지만…… 먼저 어제 일을 확인하자.']],
    window:[['태오','여기서도 골대 뒤는 흐릿해. 아까 본 게 사람인지 아직 모르겠어.']],
    speaker:[['소미','방송 스피커야. 지금은 조용하네. 테이프 목소리가 여기서도 나왔던 걸까?']],
    archiveDoor:[['1999년 담임','복도로 나가는 문이란다. 필요한 기록을 찾으면 함께 나가자꾸나.']]
   };
   if(id==='photos'){
    if(!s.seen.logbook||!s.seen.map)say(['태오','봉투마다 운동장 사진이 들어 있어. 날씨도 깃발 방향도 조금씩 달라.'],['소미','어제 사진을 찾는 거니까, 촬영 일지랑 찍은 위치를 먼저 알아두면 좋겠어.']);
    else if(!s.answers.photo){say(['소미','일지에는 안개와 서풍이 적혀 있었지. 어느 사진이 어제 기록과 맞을까?']);s.question='photo';}
    else say(['강은호','두 번째 봉투가 어제 촬영분이야. 뒷면 글씨도 살펴보자.']);
   }else if(id==='photo-back'&&s.answers.photo){s.seen.backRead=true;say(['소미','“방송이 끝나도 녹음을 멈추지 마.” 준비실 메모랑 글씨가 같아.'],['태오','그래서 끝까지 들으라고 한 거구나. 우연히 남은 목소리가 아니었어.'],['강은호','봉투 안에 실내 사진도 한 장 있어. 여기 자료실이잖아. 책상 쪽을 봐.']);}
   else if(id==='photo-detail'&&s.seen.backRead){say(['태오','사진 가장자리에 누군가의 손이 찍혔어. 이 수첩을 책상에 놓고 있나 봐.'],['강은호','빨간 끈…… 우리가 운동장에서 주운 수첩이랑 같아. 하나가 남긴 거라면 여기도 들렀겠네.'],['소미','사진 뒷면에도 글씨가 있어. “관측실 창가에서 하나와 촬영.” 여기를 찾아가 보자.'],['1999년 담임','복도 끝 기상 관측실이구나. 하나가 촬영 기록을 정리하던 곳이란다. 선생님과 함께 가 보자꾸나.'],['태오','자료실 문을 나가서 오른쪽, 복도 끝이라고요?'],['강은호','응. 관측실 창문에서도 운동장이 보여. 거기서 하나가 기다리는지 보자.']);s.after='end';}
   else say(...(notes[id]||[['소미','책상 왼쪽의 펼친 촬영 일지와 벽에 걸린 운동장 사진을 비교해 보자. 그러면 사진 세 장을 함께 볼 수 있겠어.']]));
   if(['logbook','map'].includes(id)&&s.seen.logbook&&s.seen.map&&!s.answers.photo)s.question='photo';
   return s;
  }
  if(s.room==='yard'){
   const observations={camera:[['강은호','카메라 끈에 촬영 메모가 끼워져 있어. “안개 때문에 운동장 촬영 중단. 장비는 준비실로.”'],['태오','골대 뒤에서 기다리는 게 아니라 준비실로 들어간 걸까?']], 'weather-record':[['강은호','백엽상 옆 아침 관측 기록이야. “밤사이 비 없음. 오전에는 땅 가까이 안개.”'],['소미','비가 왔는지 기억에만 의존하지 말고 이 기록과 비교하자.']],leaves:[['소미',s.seen['weather-record']?'비는 안 왔다는데 잎 표면에 물방울이 붙어 있네. 이런 걸 뭐라고 했지?':'잎 표면에 작은 물방울이 붙어 있어. 밤에 비가 왔는지 백엽상 옆 기록부터 확인해 보자.']],fog:[['태오','골대 아래쪽이 뿌옇게 가려져 있어. 땅 가까운 공기에 모인 작은 물방울…… 뭐라고 했지?']],sky:[['소미','골대 앞과 달리 여기는 높은 하늘이야. 저렇게 모인 작은 물방울이나 얼음 알갱이를 뭐라고 하지?']],cloth:[['강은호','장비 덮는 천이야. 카메라는 선생님 물건이니까 그대로 두자.']],bench:[['소미','장비를 두던 벤치래. 카메라에 종이가 끼워져 있어.']],door:[['소미','방송 준비실이야. 어디로 갔는지 단서를 모은 뒤 선생님과 가 보자.']],flag:[['태오','깃발이 오른쪽으로 펄럭여. 바람이 꽤 부네.']],school:[['강은호','저쪽이 우리가 있던 과학실이야. 창문 너머에서는 운동장 끝이 안 보일 수도 있겠다.']]};
   observations.leaves=[['태오','여기 잎이 젖어 있어. 누가 물 묻은 장비를 내려놨던 걸까?'],['소미',s.seen['weather-record']?'아까 기록에는 밤에 비가 안 왔다고 했지? 잠깐, 물방울이 잎 표면에 조그맣게 맺혀 있어. 이런 걸 배웠는데…… 이름이 뭐였더라?':'그런데 물방울이 여러 잎에 맺혀 있네. 밤에 비가 왔던 걸 수도 있잖아. 은호야, 여기 날씨 적어 두는 곳도 있어?'],...(!s.seen['weather-record']?[['강은호','저 하얀 백엽상 옆에 관측 기록이 있어. 먼저 읽어 보자.']]:[])];
   observations['weather-record']=[['강은호','아침에 적은 기록이 남아 있어. 밤사이 비는 안 왔대.'],['태오',s.seen.leaves?'비가 안 왔는데 벤치 옆 잎은 왜 젖어 있지?':'그럼 벤치 주변에 젖은 데가 있어도 빗물은 아닐 수 있겠네.'],['소미','잎에 맺힌 물방울을 가까이 보면 알 수 있지 않을까?']];
   observations.fog=[['태오','저기 골대 기둥은 보이는데 뒤쪽은 통 안 보이네. 하나가 있어도 못 알아보겠어.'],['소미','하늘이 흐린 것과는 달라. 땅 가까운 공기가 뿌옇잖아. 이런 날 앞을 가리는 걸 뭐라고 했지?']];
   observations.sky=[['태오','하늘도 골대 앞도 온통 희뿌옇네. 같은 건가?'],['소미','어디에 있는지 나눠서 보자. 우선 저 높은 하늘에 있는 건 뭐지?']];
   say(...(observations[id]||[['소미','눈이 남아 있으니 조심해서 걷자.']]));
   if(id==='leaves'&&s.seen['weather-record']&&!s.answers.dew)s.question='dew';
   if(['fog','sky'].includes(id)&&!s.answers[id])s.question=id;
   return s;
  }
  if(id==='ribbon'){say(['소미','환기창의 천이 오른쪽으로 뻗어 있어. 왼쪽이 서쪽, 오른쪽이 동쪽이야. 종이는 어느 쪽으로 밀렸을까?']);if(!s.answers.wind)s.question='wind';}
  else if(['ruler','broom','clip','flashlight'].includes(id)){if(!s.inventory.includes(id))s.inventory.push(id);say(['태오',({ruler:'긴 자를 챙겼어. 손이 안 닿는 곳에 쓸 수 있겠다.',broom:'빗자루야. 안쪽 물건을 살살 끌어낼 수 있겠어.',clip:'집게를 챙겼어. 종이가 다시 날리지 않게 고정하자.',flashlight:'손전등을 챙겼어. 선반 밑을 비춰 볼 수 있겠다.'})[id]]);}
  else if(id==='paper'||id==='shelf'){
   if(!s.answers.wind)say('종이가 어디로 날아갔는지 먼저 환기창의 천을 보고 예상해 보자.');
   else if(!s.seen.recovered&&['ruler','broom'].includes(s.selected)){s.seen.recovered=true;s.selected='';say(['태오','꺼냈어! 종이가 찢어지지 않게 살살 당겼어.'],['소미','또 날아가지 않게 집게로 고정하자.']);}
   else if(s.seen.recovered&&s.selected==='clip'){s.seen.secured=true;s.selected='';say(['소미','이제 읽을 수 있어. “녹음 끝부분은 지우지 말 것.” 뒤에는 테이프를 둔 자리도 표시해 뒀네.'],['강은호','이 필체, 촬영 원고에서 본 것 같아. 녹음에 뭘 남긴 걸까?']);}
   else say(s.seen.secured?'메모에는 녹음 끝부분을 남겨 두라고 했지. 무슨 소리가 들어 있을까?':s.seen.recovered?'종이가 자꾸 들썩이네. 집게가 필요할 것 같아.':'선반 밑에 종이 끝이 보여. 손은 안 닿는데…… 긴 물건이 있으면 좋겠다.');
  }else if(id==='strap'||id==='door'){
   if(s.seen.doorOpen)say(['소미','문이 열려 있으니까 한결 낫다. 선생님도 여기 계시고.']);
   else {say(['태오','선생님, 안쪽 손잡이는 계속 헛돌아요.'],['1999년 담임','걸쇠가 걸렸구나. 억지로 당기지 말고 기다리렴. 선생님이 여기서 고치고 있으마. 촬영 원고는 살펴보아도 좋다.']);}
  }
  else if(id==='tape'){if(!s.seen.secured)say('테이프가 하나 있어. 먼저 날아간 메모에 무엇이 적혔는지 확인하자.');else {if(!s.inventory.includes('tape'))s.inventory.push('tape');say(['강은호','메모에 적힌 테이프야. 녹음기에 넣어 보자.']);}}
  else if(id==='recorder'){if(s.selected==='tape'&&s.inventory.includes('tape')){s.seen.inserted=true;s.selected='';say(['소미','테이프를 넣었어. 먼저 되감고 재생해 보자.']);}else say(s.seen.inserted?'되감기와 재생으로 녹음 내용을 확인하자.':'녹음기가 있어. 메모를 확인하고 맞는 테이프를 넣어 보자.');}
  else say(['강은호',id==='bag'?'촬영 장비 가방이야. 물건을 함부로 꺼내지는 말자.':'방송 준비실에서 쓰는 물건이야. 지금은 날아간 메모부터 찾아보자.']);
  return s;
 }
 function act(previous,a){
  const s=reduce(previous,a);
  s.notebook=Array.isArray(s.notebook)?s.notebook:[];
  const add=(id,text,lines)=>{if(s.notebook.some(n=>n.id===id))return;s.notebook.push({id,text});s.dialogue.push(...lines.map(([speaker,text])=>line(speaker,text)));};
  if(s.seen.camera||s.room!=='yard')add('found','표지는 비어 있다. 첫 장에는 작은 글씨로 “하나”만 적혀 있다.',s.room==='yard'?[['태오','카메라 밑에 수첩도 끼어 있어. 빨간 끈이 달렸네.'],['소미','표지는 비어 있는데…… 첫 장에 “하나”라고 적혀 있어. 뒤쪽은 아직 아무것도 안 쓰여 있어.'],['강은호','하나 거라면 돌려줘야지. 같이 챙겨 가자.']]:[]);
  if(s.seen.recordingHeard)add('photo','어제 사진에는 내가 있어.',[['소미','잠깐. 수첩에 글씨가 생겼어. 아까 분명 비어 있었는데.'],['태오','“어제 사진에는 내가 있어.” ……하나가 남긴 말일까?']]);
  if(s.room==='weather'&&previous.room==='archive')add('room','사진 속 창가. 내가 마지막으로 기다린 곳.',[['소미','수첩에 또 한 줄이 있어. “사진 속 창가. 내가 마지막으로 기다린 곳.”'],['강은호','사진 뒷면에도 관측실이라고 적혀 있었지. 하나가 여기서 누굴 기다렸던 걸까?']]);
  if(s.answers.gradient&&!previous.answers?.gradient)add('voice','내 목소리는 영상이 끝난 뒤에 남아 있어.',[['소미','수첩 봐. “내 목소리는 영상이 끝난 뒤에 남아 있어.” 아까는 없던 문장이야.'],['태오','촬영본이 있는 편집실에서 끝까지 들어 보자. 하나가 어디 있는지 알려 줄지도 몰라.']]);
  if(s.after==='teaser-still'&&previous.after!=='teaser-still')add('warning','찾으러 와 줘서 고마워. 그런데 지금 뒤돌아보지는 마.',[['소미','……수첩에 글씨가 더 생겼어. “찾으러 와 줘서 고마워. 그런데 지금 뒤돌아보지는 마.”'],['태오','하나야…… 우리 바로 뒤에 있는 거야?']]);
  return s;
 }
 function preview(room){const s=initial();if(!['yard','prep','archive','weather','coast'].includes(room))return s;s.room=room;s.dialogue=[];s.notebook=room==='yard'?[]:[{id:'found',text:'운동장 카메라 밑에서 발견한 이름 없는 수첩. 첫 장에 “하나”가 적혀 있다.'}];if(['archive','weather','coast'].includes(room))s.notebook.push({id:'photo',text:'어제 사진에는 내가 있어.'});return s;}
 const api={initial,act,preview};if(typeof module!=='undefined')module.exports=api;root.Chapter2V3State=api;
})(typeof window==='undefined'?globalThis:window);
