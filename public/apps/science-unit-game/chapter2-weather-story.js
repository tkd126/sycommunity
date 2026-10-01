(function(root){
 'use strict';
 // Each answer interprets a physical record. It never unlocks a magic door.
 const tasks={
  tapePressure:{room:'prep',prompt:'기압차만 생각하면 어느 쪽으로 바람이 불까? (왼쪽 / 오른쪽)',evidence:'회수한 메모의 보관 약도\n왼쪽 선반 1020 hPa ─── 오른쪽 녹음기 옆 1008 hPa\n「바람이 향하는 쪽의 테이프. 마지막 녹음은 지우지 말 것.」\n실제 실내 기압이 아닌, 기압차만 고려한 암호 모형',answers:['오른쪽','녹음기옆'],hint:'공기는 기압이 높은 쪽에서 낮은 쪽으로 이동하려 해. 1020과 1008을 비교해 보자.'},
  tapeBreeze:{room:'prep',prompt:'낮 기록 → 밤 기록 순서로 바람 이름을 적어 볼까?',evidence:'테이프 케이스의 해안 촬영 기록\n낮: 육지가 더 빨리 데워짐 / 바다 → 육지\n밤: 육지가 더 빨리 식음 / 육지 → 바다\n「낮의 바람, 그다음 밤의 바람. 두 녹음 뒤에 남긴 말.」\n답: 해풍과 육풍을 알맞은 순서로',answers:['해풍육풍','해풍,육풍','해풍→육풍','해풍과육풍'],hint:'바다에서 육지로 부는 것은 해풍, 육지에서 바다로 부는 것은 육풍이야. 메모에는 낮부터 듣자고 했지.'},
  pressure:{object:'tape-back',room:'weather',prompt:'바람이 모여드는 쪽은? (고기압 / 저기압)',evidence:'테이프 뒷면: 「바람이 모이는 쪽의 기록. 맑은 날 것은 아님.」\n수업 메모: 주변보다 기압이 높은 곳 → 낮은 곳으로 공기가 이동하려 한다.',answers:['저기압'],intro:[['태오','테이프 뒤에도 글씨가 있어. 너무 작아서 못 봤네.'],['소미','“바람이 모이는 쪽의 기록.” 장소 이름 대신 이런 말을 남겼어. 벽의 일기도를 가리키는 걸까?']],hint:'주변보다 기압이 낮으면 주변 공기가 모여들겠지. 어느 쪽 기록을 뜻할까?',feedback:[['소미','저기압 쪽이구나. 뒷면에는 “맑은 날 것은 아님”이라고도 적혀 있어.'],['태오','누가 기록을 섞어 놓을까 봐 특징을 써 둔 걸까? 일기도의 두 쪽을 비교해 보자.']]},
  high:{object:'high-chart',room:'weather',prompt:'이쪽 촬영표에 어울리는 날씨는? (맑음 / 흐림)',evidence:'일기도 왼쪽: 중심 1024 hPa / 주변 1020 hPa\n고기압: 공기가 내려오며 구름이 적은 날이 많음.\n촬영표 빈칸: 운동장 전체 촬영 — 날씨 ______',answers:['맑음','맑다','맑은날','맑은날씨'],intro:[['강은호','왼쪽은 중심 숫자가 더 커. 촬영표에는 “운동장 전체”라고 적혀 있어.'],['소미','옆의 수업 메모엔 고기압에서 공기가 내려온대. 이쪽에 끼웠던 맑음·흐림 이름표 중 뭐가 맞을까?']],hint:'공기가 내려오는 곳은 대체로 구름이 적어. 늘 그런 것은 아니지만, 이 촬영표는 보통의 날씨를 적은 거야.',feedback:[['태오','맑은 날 운동장 전체를 찍은 기록이네. 테이프가 가리킨 것은 이쪽이 아니겠다.'],['소미','응. “맑은 날 것은 아님”이랑 맞지 않아. 다른 쪽을 보자.']]},
  low:{object:'low-chart',room:'weather',prompt:'오른쪽 이름표의 날씨는? (맑음 / 흐림)',evidence:'일기도 오른쪽: 중심 1004 hPa / 주변 1008 hPa\n저기압: 공기가 모여 올라가며 구름이 생기기 쉬움.\n촬영표: 날씨 ______ — 실내에서 해안 촬영본 정리',answers:['흐림','흐리다','흐린날','흐린날씨'],intro:[['소미','이쪽은 중심의 기압이 낮아. 공기가 올라가면 식으면서 구름이 생기기 쉽다고 적혀 있어.'],['태오','그러면 이쪽 이름표는 어느 날씨였을까?']],hint:'상승하는 공기가 식으면 수증기가 작은 물방울로 변해 구름이 생기기 쉬워. 흐리고 비가 오는 경우도 많지.',feedback:[['소미','흐린 날의 기록이 맞겠어. 그날은 실내에서 해안 촬영본을 정리했대.'],['강은호','그 영상은 옆 편집실에 있어. 그런데 책상 쪽지에도 같은 동그라미 표시가 있네.']]},
  density:{object:'air-balance',room:'weather',prompt:'같은 부피·같은 기압이라면 어느 공기가 더 무거울까?',evidence:'지난 수업의 비교 기록 — 용기 무게는 빼고 공기만 비교\nA: 찬 공기 1 L / B: 따뜻한 공기 1 L / 기압은 같음\n메모: 「더 무거운 쪽에 파란 점, 그쪽부터 읽기」',answers:['찬공기','차가운공기','a','A','에이'],intro:[['태오','저울 옆에 실험 기록이 있어. 파란 점이 지워졌네.'],['소미','쪽지에 “파란 점 쪽부터 읽기”라고 돼 있어. 어느 쪽에 점을 찍었는지 알면 읽는 순서를 찾겠어.'],['강은호','같은 부피, 같은 기압인 공기끼리 비교한 기록이야. 용기 무게는 뺐대. 찬 공기와 따뜻한 공기 중 어느 쪽이 더 무거웠을까?']],hint:'같은 부피·기압에서는 찬 공기에 공기 입자가 더 많이 들어 있어. 밀폐된 용기를 데워 공기 무게가 사라진다는 뜻은 아니야.',feedback:[['소미','찬 공기 쪽, A부터 읽는 거였네. 찬 공기의 밀도가 더 크니까 같은 부피의 공기는 더 무거워.'],['태오','그럼 쪽지의 A와 B를 거꾸로 읽을 뻔했어.']]},
  gradient:{object:'coded-note',room:'weather',requires:['density','pressure','high','low'],prompt:'쪽지의 단순 모형에서 바람이 향하는 쪽은? (왼쪽 / 오른쪽)',evidence:'회수한 쪽지: A 1020 hPa ─── B 1008 hPa\n왼쪽 A: 보관실 / 오른쪽 B: 편집실\n「파란 점부터. 바람이 가려는 쪽에 원본.」\n기압차만 생각한 지표 부근의 단순 모형',answers:['오른쪽','b','B','편집실'],intro:[['소미','숫자랑 알파벳뿐이라 암호처럼 보였는데, 이제 읽을 수 있겠어. A가 왼쪽이야.'],['태오','높은 기압 쪽에서 낮은 쪽으로…… 어느 방을 가리키는 거지?']],hint:'왼쪽 1020이 오른쪽 1008보다 높아. 기압차 때문에 공기가 이동하려는 쪽을 생각해 봐.',feedback:[['소미','오른쪽, 편집실이야. 흐린 날 해안 촬영본을 정리했다는 기록과도 맞아.'],['강은호','연결문으로 갈 수 있어. 선생님도 여기랑 편집실에서 기다리라고 하셨지.'],['태오','잠깐. 누가 먼저 문 옆을 지나간 것 같은데…… 발소리는 안 들렸어.']]},
  sea:{object:'day-coast',room:'coast',prompt:'낮에 바다에서 육지로 부는 바람은?',evidence:'사진에 딸린 낮 촬영 기록: 육지가 바다보다 빨리 데워짐\n관측자가 적은 깃발 방향: 바다 → 육지\n영상 이름표: 「밤 촬영」 — 멈춘 영상에는 밝은 햇빛',answers:['해풍'],intro:[['태오','영상 이름표엔 밤이라는데 화면이 밝아. 사진에 딸린 기록에는 바람이 육지 쪽으로 불었다고 적혀 있어.'],['소미','벽의 낮 관측 사진이랑 같은 해안이야. 낮에 바다에서 육지로 부는 바람 이름이 뭐였지?']],hint:'낮에는 육지가 더 빨리 데워져 공기가 올라가고, 바다 쪽의 상대적으로 찬 공기가 육지로 불어와. 바다 해 자로 시작해.',feedback:[['소미','해풍이야. 빛과 관측 기록까지 함께 보면 낮 촬영본이겠어. 밤이라는 이름표는 잘못 붙었네.'],['태오','그럼 밤에 찍었다던 마지막 부분은…… 다른 녹음이 섞인 거야?']]},
  land:{object:'night-coast',room:'coast',prompt:'밤에 육지에서 바다로 부는 바람은?',evidence:'사진에 딸린 밤 촬영 기록: 육지가 바다보다 빨리 식음\n관측자가 적은 깃발 방향: 육지 → 바다\n편집 메모: 「밤 원본은 별도 보관. 마지막 목소리는 낮 촬영본 뒤.」',answers:['육풍'],intro:[['강은호','밤 관측 기록에는 반대 방향이 적혀 있어. 육지에서 바다 쪽으로 불었대.'],['소미','육지가 더 빨리 식는 밤의 바람이지. 이 기록에는 무슨 이름을 붙이면 될까?']],hint:'육지에서 바다로 부는 바람이야. 육지의 첫 글자로 시작해.',feedback:[['소미','육풍. 밤 원본은 따로 있었구나. 낮 촬영본 뒤에 남은 목소리를 찾아야 해.'],['태오','날씨 기록 덕분에 이름표가 바뀐 걸 알았어. 녹음기를 다시 들어 보자.']]},
  valley:{object:'valley-poster',room:'coast',optional:true,prompt:'맑은 낮에 골짜기에서 산 쪽으로 부는 바람은?',evidence:'추가 관측: 맑은 낮, 산비탈이 데워짐\n골짜기 → 산비탈 위쪽으로 바람. 밤에는 반대 흐름이 나타나기도 함.',answers:['곡풍'],intro:[['강은호','이건 산에서 찍은 참고 사진이야. 낮에 골짜기에서 산 쪽으로 바람이 불었대.'],['소미','곡풍이라는 말을 배운 적 있어? 해안 기록과는 다른 촬영분이네.']],hint:'골짜기 곡 자를 써서 곡풍이라고 해.',feedback:[['소미','곡풍이구나. 산에서 찍은 장면까지 해안 촬영본에 섞지 않도록 따로 두자.']]},
  coalescence:{object:'blue-notebook',room:'coast',optional:true,prompt:'작은 물방울들이 충돌해 합쳐져 비가 되는 설명은?',evidence:'참고 노트: 따뜻한 구름 속 작은 물방울들이 부딪쳐 합쳐지고 커져 떨어짐\n병합설 / 빙정설',answers:['병합설','병합'],intro:[['태오','파란 노트는 비 촬영 수업 메모야. 물방울들이 합쳐지는 그림이 있어.'],['소미','작은 물방울들이 부딪쳐 커져서 비가 된다는 설명, 두 이름 중 어느 쪽이지?']],hint:'합쳐진다는 뜻이 들어간 병합설이야.',feedback:[['소미','병합설이야. 이건 해안 촬영 뒤 붙이려던 설명 장면이네. 목소리가 남은 원본과는 구분해서 두자.']]},
  ice:{object:'white-notebook',room:'coast',optional:true,prompt:'차가운 구름 속 얼음 알갱이가 자라는 설명은?',evidence:'참고 노트: 영하의 구름에 과냉각 물방울과 얼음 알갱이가 함께 있음\n얼음 알갱이가 자라 떨어짐. 내려오며 녹으면 비가 될 수 있음.\n병합설 / 빙정설',answers:['빙정설','빙정'],intro:[['강은호','흰 노트에는 얼음 알갱이가 그려져 있어. 구름 속에 물방울과 얼음이 같이 있대.'],['소미','얼음 알갱이가 자라 떨어진다는 설명은 어느 쪽일까?']],hint:'얼음 결정을 뜻하는 빙정이라는 말이 들어가.',feedback:[['소미','빙정설이구나. 지상에 비가 온다고 구름 속도 전부 물방울인 건 아니네.'],['태오','이 노트도 수업 영상 자료구나. 찾는 목소리는 촬영본 끝에 남아 있겠어.']]}
 };
 Object.assign(tasks.valley,{prompt:'햇볕에 데워지는 산비탈, 낮의 바람은 어느 쪽일까?',answers:['산쪽','산비탈위쪽'],intro:[['태오','산에서 찍은 사진도 있네. 낮에 햇볕을 받는 산비탈이래.'],['소미','비탈의 공기가 데워져 올라가면 아래쪽 공기는 어느 쪽으로 움직일까? 화살표로 생각해 보자.']],hint:'데워진 산비탈을 따라 공기가 올라가. 골짜기에서 비탈 위쪽을 향하는 화살표를 골라 보자.',feedback:[['소미','골짜기에서 산비탈 위쪽으로 부는 방향이네. 이런 낮의 바람을 곡풍이라고도 해. 이름을 외우기보다 데워진 쪽으로 공기가 움직이는 모습을 기억하자.'],['태오','해안 촬영분이 아니라 산 촬영분이었구나. 따로 두자.']]});
 const normalize=x=>String(x||'').normalize('NFKC').replace(/\s/g,'').toLowerCase();
 tasks.sea.intro=[['태오','밤 촬영이라면서 햇빛은 왜 이렇게 쨍쨍해?'],['소미','함께 둔 관측 메모에도 바다에서 육지로 바람이 불었다고 적혀 있어. 이름표가 잘못 붙었나 봐.'],['강은호','밤에 찍은 건 따로 있어. 이쪽 이름표부터 바로잡자.']];
 tasks.land.intro=[['강은호','이건 어두워진 뒤 찍은 사진이야. 함께 남긴 바람 메모도 반대쪽이지?'],['태오','정말이네. 육지에서 바다 쪽이라고 적혀 있어.'],['소미','두 원본을 구분하면 끝부분에 섞인 녹음도 찾을 수 있겠다.']];
 tasks.high.intro=[['태오','이름표가 두 개 떨어져 있어. 맑음이랑 흐림.'],['소미','이쪽은 가운데 기압이 높고 공기가 내려오는 기록이네.'],['강은호','원래 자리에 붙여 두자. 테이프가 어느 날 기록인지 알아야 하니까.']];
 tasks.low.intro=[['소미','반대쪽은 공기가 모여 올라가네. 올라가면서 식으면 구름이 생기기 쉬웠지.'],['태오','그럼 이쪽에 맞는 이름표도 알겠어.']];
 tasks.coalescence.intro=[['태오','이건 물방울들이 합쳐지는 장면이네.'],['소미','찾는 목소리는 없지만, 설명이랑 짝을 맞춰 두자. 또 섞이면 헷갈리겠다.']];
 tasks.ice.intro=[['강은호','이 장면엔 얼음 알갱이가 있어. 아까 물방울 장면이랑 달라.'],['소미','얼음이 자라는 설명 쪽에 놓으면 되겠다.']];
 Object.assign(tasks.coalescence,{answers:['합쳐짐'],hint:'왼쪽의 작은 물방울과 가운데 서로 닿은 물방울을 비교해 봐.',intro:[['태오','파란 노트에 구름 속을 그린 그림이 있어. 해안 사진에 끼어 있었네.'],['소미','설명 문장이 떨어졌어. 세 그림이 어떻게 이어지는지 보면 다시 정리할 수 있겠다.']],feedback:[['소미','작은 물방울이 합쳐져 커졌구나. 충분히 커진 물방울은 비로 떨어질 수 있어.'],['태오','이건 구름 설명용 그림이네. 우리가 찾는 어제 촬영 사진과는 따로 두자.']]});
 Object.assign(tasks.ice,{answers:['자람'],hint:'가운데의 큰 눈송이와 왼쪽의 작은 얼음 알갱이를 비교해 봐.',intro:[['강은호','흰 노트에도 세 그림이 있어. 이번에는 차가운 구름 속이래.'],['소미','동그란 물방울 옆에 각진 알갱이도 있네. 무엇이 달라졌는지 보자.']],feedback:[['소미','얼음 알갱이가 자라는 장면이야. 구름 속에는 물방울뿐 아니라 얼음도 있을 수 있구나.'],['강은호','이 그림도 참고 자료 묶음에 둘게. 찾는 목소리는 녹음 끝에 남아 있었지.']]});
 function enter(s,say){
  s.room='weather';s.after='';s.question='';s.inventory=[];s.selected='';
  say(['1999년 담임','복도 끝까지 잘 따라왔구나. 여기 문 옆이 기상 관측실이란다. 사진 뒷면에 적힌 창가를 살펴보렴.'],['강은호','관측실 창가…… 사진에 적힌 곳까지 왔어요. 하나야, 우리 왔어.'],['소미','……대답은 없네. 창가에도 아무도 없어. 그래도 여기에 흔적은 남았을 거야.'],['1999년 담임','선생님은 바로 아래 행정실에 문 수리를 부탁하고 오마. 관측실과 옆 편집실에서 함께 기다리렴. 무슨 일이 있으면 복도 쪽으로 불러라.'],['태오','문은 열어 둘게요. 혼자 움직이지 않을게요.']);
 }
 function advance(s,say){
  if(s.after==='weather'){enter(s,say);return true;}
  if(s.after==='coast'){
   s.after='';s.room='coast';s.question='';
   say(['강은호','여기가 편집실이야. 낮과 밤 해안 촬영본을 여기서 정리했어.'],['태오','방금 켠 것도 아닌데 화면이 나오네. 누가 보고 있었나?'],['소미','재생기는 멈춰 있어. 마지막으로 보던 화면이 남아 있는 것 같아.'],['강은호','그런데 저 이름표…… 어제는 낮 촬영이라고 적혀 있었는데.'],['소미','누가 바꿨다고 단정하진 말자. 화면 속 빛이랑 바람 기록부터 비교해 보자.']);return true;
  }
  return false;
 }
 function act(s,a,say){
  if(s.room==='prep'){
   if(a.type==='inspect'&&a.target==='tape'&&s.seen.secured&&!s.answers.tapePressure){
    s.question='tapePressure';say(['태오','녹음기 옆에 테이프가 있어. 이게 메모에 적힌 원본일까?'],['소미','메모 뒷면에 숫자랑 보관 약도가 있어. “바람이 향하는 쪽.” 기압을 보고 어느 쪽인지 알아보자.']);return true;
   }
   if(a.type==='operate'&&a.target==='play'&&s.seen.inserted&&s.seen.rewound&&s.seen.doorOpen&&!s.answers.tapeBreeze){
    s.question='tapeBreeze';say(['강은호','이건 편집 전에 따로 녹음해 둔 두 부분이야. A랑 B만 써 놓아서 어느 게 먼저인지 모르겠네.'],['소미','케이스에는 “낮 촬영 다음에 밤 촬영”이라고 적혀 있어. 은호 네가 설명한 바람을 들어 보면 구분할 수 있겠다.'],['태오','그 뒤에 남겼다는 말도 들어야지. 앞부분부터 맞춰 보자.']);return true;
   }
   if(a.type==='tape-listen'){
    if(s.question==='tapeBreeze'&&['A','B'].includes(a.target)){
     s.tapeHeard={...s.tapeHeard,[a.target]:true};s.tapeCaption=a.target;
    }return true;
   }
   if(a.type==='answer'&&['tapePressure','tapeBreeze'].includes(a.target)){
    if(s.question!==a.target)return true;
    if(a.target==='tapeBreeze'&&(!s.tapeHeard?.A||!s.tapeHeard?.B)){
     say(['소미','두 부분에서 어떤 바람을 설명하는지 먼저 확인해 보자. 순서를 맞출 근거가 필요해.']);return true;
    }
    const t=tasks[a.target];if(!t.answers.some(v=>normalize(v)===normalize(a.value))){say(['소미',t.hint]);return true;}
    s.answers[a.target]=true;s.question='';
    if(a.target==='tapePressure'){
     if(!s.inventory.includes('tape'))s.inventory.push('tape');
     say(['소미','높은 1020에서 낮은 1008 쪽. 오른쪽 녹음기 옆이 맞네.'],['태오','테이프를 챙겼어. 그냥 숫자 암호가 아니라 보관 위치를 표시한 거였구나.']);
    }else{
     say(['소미','해풍, 육풍 순서야. 낮에는 바다에서 육지로, 밤에는 반대로 부는 바람이지.'],['강은호','그 순서로 들으니까 촬영 종료 안내가 이어져. 잠깐…… 그 뒤에도 소리가 남아 있어.']);s.after='tape-play';
    }return true;
   }
   return false;
  }
  if(!['weather','coast'].includes(s.room))return false;
  if(a.type==='answer'){
   const t=tasks[a.target];if(!t||s.question!==a.target||t.room!==s.room)return true;
   if(!t.answers.some(v=>normalize(v)===normalize(a.value))){say(['소미',t.hint]);return true;}
   s.answers[a.target]=true;s.question='';say(...t.feedback);
   if(s.room==='weather'&&['pressure','high','low','density','gradient'].every(k=>s.answers[k]))s.after='coast';
   return true;
  }
  if(a.type!=='inspect')return true;
  s.question='';s.seen[a.target]=true;
  const entry=Object.entries(tasks).find(([,t])=>t.room===s.room&&t.object===a.target);
  if(entry){
   const [key,t]=entry;
   if((key==='gradient'&&s.answers.tapePressure)||(key==='sea'||key==='land')&&s.answers.tapeBreeze){
    if(t.requires?.some(k=>!s.answers[k])){say(['소미','쪽지를 읽는 순서는 저울 옆 기록부터 알아보자. 일기도와 테이프 뒷면도 확인해야겠어.']);return true;}
    s.answers[key]=true;say(...t.feedback);
    if(s.room==='weather'&&['pressure','high','low','density','gradient'].every(k=>s.answers[k]))s.after='coast';
    return true;
   }
   if(t.requires?.some(k=>!s.answers[k])){say(['소미','쪽지에 A와 B가 적혀 있어. “파란 점부터 읽기.” 저울 옆 기록과 테이프 뒷면, 일기도를 먼저 대조해 보자.']);return true;}
   if(s.answers[key])say(...t.feedback);else{say(...t.intro);s.question=key;}
  }else if(a.target==='last-recording'){
   if(!s.answers.sea||!s.answers.land)say(['소미','이름표와 영상이 맞는지 먼저 확인하자. 낮과 밤 해안 기록을 비교하면 어떤 부분을 들어야 할지 알 수 있겠어.']);
   else{say(['태오','낮 촬영본의 끝이야. 파도 소리가 작아지고……'],['소미','“이름표는 믿지 마. 내가 본 날씨를 남겨 둘게.” 그 목소리야.'],['강은호','하나……? 이 말은 처음 들어.'],['소미','잠깐, 아직 끝이 아니야. “수첩을 찾았다면, 내 목소리를 잊지 마.”'],['태오','이 수첩은 아까 운동장에서 주웠잖아. 하나가 우리한테 맡긴 걸까?'],['소미','하나를 찾으면 직접 물어보자. 왜 우리 이름을 알고 있는지도.'],['강은호','복도에 그림자가…… 선생님?'],['태오','아무도 없어. 발소리도 안 났어.'],['소미','선생님이 돌아오시면 이 녹음도 같이 듣자. 오늘 찾은 기록은 셋이 나눠 적어 두고.'],['강은호','응. 한 사람 기억에서 없어져도, 나머지는 기억할 수 있게.']);s.after='end';}
  }else say(['태오',a.target==='room-speaker'?'전원도 안 켰는데 아까 딸깍 소리가 났어. 지금은 아무 소리도 안 나.':'복도로 나가지는 말자. 선생님이 돌아오실 때까지 같이 기다리자.']);
  return true;
 }
 const api={tasks,enter,advance,act};if(typeof module!=='undefined')module.exports=api;root.Chapter2WeatherStory=api;
})(typeof window==='undefined'?globalThis:window);
