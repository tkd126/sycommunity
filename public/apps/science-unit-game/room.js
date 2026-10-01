(function(root){
 'use strict';
 function initial(mode){return {mode,key:mode==='finale',selected:'',massChecked:false,filterChecked:false,wrapped:false,floorPaper:false,floorTape:false,floorBox:false,notebook:false,cases:false,camera:false,route:false,drawerOpen:false,tray:false,board:false,equipment:false,tape:false,script:false,device:false,power:false,loaded:false,heard:false,unlocked:false,complete:false};}
 function restore(mode,saved){const clean=initial(mode);if(!saved||saved.mode!==mode)return clean;for(const k of Object.keys(clean))if(typeof saved[k]===typeof clean[k])clean[k]=saved[k];return clean;}
 function step(s,a){
  s={...s};
  if(a==='weigh-right')s.massChecked=true;
  if(a==='apparatus-right')s.filterChecked=true;
  if(a==='wrap'&&s.complete)s.wrapped=true;
  if(['floorPaper','floorTape','floorBox'].includes(a))s[a]=true;
  if(a==='tray')s.tray=true;
  if(a==='board')s.board=true;
  if(a==='equipment')s.equipment=true;
  if(a==='sieve-right'&&s.tray)s.key=true;
  if(a==='select-key'&&s.key)s.selected='key';
  if(a==='select-tape'&&s.tape)s.selected='tape';
  if(a==='drawer'&&s.selected==='key'){s.drawerOpen=true;s.selected='';}
  if(a==='tools-right'&&s.drawerOpen&&s.mode==='supplies')s.complete=true;
  if(a==='tape-right'&&s.drawerOpen&&s.mode==='finale')s.tape=true;
  if(a==='script-right'&&s.board)s.script=true;
  if(a==='device-right'&&s.equipment)s.device=true;
  if(a==='reason-right'&&s.device)s.power=true;
  if(a==='tv'&&s.selected==='tape'){s.loaded=true;s.selected='';}
  if(['notebook','cases','camera'].includes(a))s[a]=true;
  if(a==='route-right'&&s.notebook&&s.cases&&s.camera)s.route=true;
  if(a==='play'&&s.loaded&&s.power&&s.script&&s.route)s.heard=true;
  if(a==='code-right'&&s.heard)s.unlocked=true;
  if(a==='door'&&s.unlocked)s.complete=true;
  return s;
 }
 const spots=[['window','창문',0,2,23,57],['tray','창가의 재료 접시',2,60,21,12],['drawer','책상 서랍',27,58,25,9],['tv','텔레비전과 비디오',30,28,24,28],['board','벽의 방송 원고',54,19,23,32],['equipment','선반의 장비 상자',57,65,10,15],['door','방송실 문',86,10,13,82]];
 function mount(host,mode,onComplete,saved,onSave=()=>{}){
  let s=restore(mode,saved),speaker='소미',line=mode==='supplies'?'하나가 쓰던 도구를 찾자. 창가 접시 안에서 금속이 반짝여. 물건을 직접 눌러 봐.':'밖에서는 우리 목소리가 안 들리나 봐. 방송을 연결해서 선생님께 알려야겠어. 책상과 장비부터 살펴보자.',detail='',finished=false,peek=false;
  let bagOpen=false;
  // Optional scenery uses the same glow as clues; exploring it never gates progress.
  // id, name, x/y/width/height (%), artwork contour, speaker, observation
  const scenery=mode==='supplies'?[
   ['globe','지구본',53,0,9,12,'M56.4 .2 C59.3 -.2 60.1 2.1 60.1 5.1 C60.1 8.3 58.5 10.2 56.6 10.1 C54.5 10 53.8 7.6 53.8 5 C53.8 2.3 54.7 .3 56.4 .2 Z M57.2 10.2 V11 L58.9 11.4 V11.8 H54.7 V11.4 L56.2 11 V10','태오','우리 동네를 찾아보려 했는데… 학교까지는 안 나오네. 손가락 하나로 나라를 다 가리겠어.'],
   ['balance','양팔 저울',46,41,12,11,'M 46.651 42.295 Q 48.624 41.870 50.897 42.295 Q 50.778 43.464 49.880 43.889 L 49.043 43.996 L 49.043 44.527 L 51.256 44.527 L 51.376 43.996 L 51.615 43.996 L 51.675 43.571 L 51.914 43.571 L 51.914 44.102 Q 52.213 44.208 52.213 44.633 L 54.426 44.633 L 54.426 44.102 L 53.888 43.996 Q 53.050 43.783 52.811 42.402 Q 54.844 41.977 57.057 42.402 Q 56.878 43.783 55.801 44.102 L 55.203 44.208 L 55.203 44.740 L 55.622 44.952 Q 55.861 45.377 55.622 45.909 L 55.263 46.015 L 55.203 47.184 L 55.682 47.290 L 55.981 49.097 L 56.280 49.203 L 56.459 50.691 L 56.100 51.010 L 55.622 51.010 L 55.562 51.328 L 54.605 51.328 L 54.426 50.372 L 48.983 50.372 L 48.864 51.010 L 47.189 51.116 L 47.129 50.372 L 47.309 49.416 L 47.548 49.309 L 47.847 47.396 L 48.266 47.290 L 48.325 46.227 Q 47.967 46.121 48.026 45.377 Q 48.026 44.846 48.325 44.633 L 48.325 43.996 L 47.787 43.889 Q 46.890 43.571 46.651 42.295 Z M 49.103 45.696 L 51.256 45.696 L 51.316 47.184 L 49.043 47.184 Z M 52.153 45.802 L 54.306 45.802 L 54.366 47.184 L 52.153 47.184 Z','강은호','양쪽 접시에 지우개를 올려 봤다가 선생님한테 들켰어. 오늘은 눈으로만 구경하자.'],
   ['towel','접어 둔 수건',30,73,12,10,'M30.2 73.7 L39 74.2 Q42 74.4 40.8 77 L41.3 78 Q41.7 79 40.7 80 L40.9 81 Q40.5 82.5 38 82.4 L30 81 Z','소미','물기를 닦으려고 접어 놓았나 봐. 젖은 손으로 수첩을 만지면 글씨가 번지겠지.'],
   ['plant','창가 화분',0,25,9,29,'M0 26 Q3 24 4 29 Q7 26 8 31 Q9 34 5 36 Q8 38 6 41 L4.5 45 L4 53 H0 Z','태오','이 화분은 미래 과학실에서도 본 것 같은데. 설마 나보다 선배야?'],
   ['mortar','막자사발',60,41,6,11,'M 60.706 46.759 Q 61.543 46.334 62.679 46.440 L 64.773 42.189 Q 64.952 41.658 65.251 41.977 L 65.610 42.508 Q 65.789 42.933 65.550 43.358 L 63.995 46.546 Q 64.474 46.546 64.653 46.759 Q 64.653 49.416 63.756 50.691 L 63.995 51.116 L 63.935 51.541 Q 62.679 51.860 61.423 51.541 L 61.364 51.116 L 61.603 50.691 Q 60.706 49.522 60.706 46.759 Z','소미','안이 깨끗하게 씻겨 있어. 누가 다음 사람을 위해 정리해 놓았구나.'],
   ['sink','수도꼭지',16,40,7,11,'M17.7 48 V43 Q17.7 40.5 19.5 41 Q21.5 40 21.7 43 V48 H22.5 V49.5 H20.4 V48 H21 V43 Q20 41.5 19 43 V48 H19.5 V49.5 H17 V48 Z','강은호','끝까지 잠가야 물이 안 떨어져. 조용할 때 똑, 똑 소리가 나면 괜히 뒤를 돌아보게 된다니까.'],
   ['stool','둥근 의자',31.5,61,7,10,'M32.4 63 Q32.5 61.5 36 61.5 H37.7 V65 L37 65.5 V70 H35.7 V66 H34 L33.5 70 H32.4 L33 65.5 Q32 65 32.4 63 Z','태오','등받이가 없네. 뒤로 기대려다가 큰일 날 뻔했어.'],
   ['specimen','표본 병',65,0,5,12,'M66.7 0 H68 V1.7 Q69 2.5 69 4 V11 H65.5 V4 Q65.5 2.5 66.7 1.7 Z','소미','유리병 속 표본이야. 빛이 비쳐서 잠깐 움직이는 줄 알았어.'],
   ['solar','태양계 모형',39,0,11,12,'M43.9 1.9 a1.3 2.3 0 1 0 0.01 0 Z M39.8 4 a0.45 0.8 0 1 0 0.01 0 Z M41.2 4.4 a0.4 0.7 0 1 0 0.01 0 Z M47 4.8 a0.4 0.7 0 1 0 0.01 0 Z M49.3 3.5 a0.5 0.9 0 1 0 0.01 0 Z M39.8 5.6 V8.6 L43.7 9.5 L49.3 8 V5.3 M41.2 5.8 V8.9 M47 6.2 V8.6 M43.9 6.5 V11 M42.4 11.2 Q44 10.8 45.7 11.2 V12 H42.4 Z','강은호','행성이 도는 모형이야. 내가 만지면 꼭 하나가 삐뚤어져서, 선생님이 이제 보기만 하래.'],
   ['pebbleDish','흰 재료 접시',25.5,83,19.5,15,'M26 89 L31.3 84 Q32 83.5 34 83.5 L44 84.5 Q45 84.8 44.3 86 L39 96.5 Q38.7 97.5 37 97.5 L28 96.2 Q27 96 27 94 Z','소미','골라 놓은 돌이 따로 담겨 있어. 누군가 하던 일을 잠깐 멈춘 흔적 같아.']
  ]:[
   ['microphone','방송 마이크',48,44,7,12,'M49 45 Q49.7 44 50.6 45 L51.2 46.2 Q51.6 47 51 47.5 L52 52 V54 H54 V55.8 H49 V54 H51 L50.5 48 Q49.8 48 49 47 Z','태오','아, 아… 지금은 연결 안 됐지? 괜히 전교에 내 목소리가 나갈까 봐 긴장되네.'],
   ['cables','감아 둔 연결선',68,67,12,11,'M68.5 70 C68 66 74 67 74.5 69 C77 65 80 69 79 73 L78 77 L69 77 Q68 74 68.5 70 Z','소미','선을 동그랗게 감아서 정리했네. 엉킨 걸 풀다가 중요한 연결까지 빠지면 안 되니까 그대로 두자.']
  ];
  const baseArt=mode==='supplies'?'science-prep-cartoon-v1.png':'broadcast-cartoon-floor-v2.png';
  const roomSpots=mode==='supplies'?[
   ['window','창문',0,0,28,49],['tray','창가의 재료 접시',0,68,31,30],['drawer','실험 도구 서랍',48,54,13,29],['shelf','유리 기구 선반',58,13,19,32],['rolls','말아 둔 배경판',28,12,12,38],['door','과학준비실 문',78,4,22,64]
  ]:spots.concat([['phone','책상 전화기',25,50,6,7],['headphones','걸린 헤드폰',48,24,6,14],['notebook','파란 수첩',62,58,7,5],['cases','테이프 묶음',70,55,8,8],['keybox','비상 열쇠함',78,26,7,16],['camera','카메라 가방',11,77,13,19],['floorPaper','바닥의 촬영 그림',33,85,17,12],['floorTape','바닥에 떨어진 테이프',53,86,10,10],['floorBox','물·식용유 실험병 운반 상자',66,78,23,21]]);
  const delay=root.AnswerDelay.mount(host,'room-'+mode);
  const q=x=>host.querySelector(x),btn=(a,t)=>'<button type="button" data-room-action="'+a+'">'+t+'</button>';
  function say(who,text){speaker=who;line=text;}
  function change(a){s=step(s,a);onSave(s);}
  function inspect(id){
   const decoration=scenery.find(item=>item[0]===id);
   if(decoration){say(decoration[7],decoration[8]);detail=mode==='supplies'&&id==='balance'?'weigh':'';if(mode==='supplies'&&id==='towel'){change('wrap');say('소미',s.wrapped?'찾은 기구를 수건으로 감쌌어. 부딪혀 깨지지 않도록 조심히 가져가자.':'유리 기구를 찾으면 이 수건으로 감싸서 옮기자. 지금은 보관장을 먼저 열어야 해.');}render();return;}
   if(id==='window'){say('태오','창밖에는 운동장이 보여. 여긴 2층이네. 창문으로 나가는 건 위험해. 선생님한테 알릴 방법을 찾자.');detail='';}
   if(id==='tray'){change(id);say('강은호',s.key?'열쇠는 찾았어. 남은 재료는 선생님이 정리해 주신대. 도구부터 챙기자.':'열쇠를 떨어뜨린 접시였구나! 모래와 자갈 사이에 묻혔어. 손으로 뒤적이기 전에, 작은 모래만 아래로 내릴 방법이 있을까?');detail=s.key?'':'tray';}
   if(id==='drawer'){
    const usable=s.selected==='key'||s.drawerOpen;change(id);
    if(usable){say('강은호',mode==='supplies'?'도구가 꽤 많네. 모래를 남기고 액체를 받아 낼 조합은 어느 쪽일까?':'테이프가 두 개야. 하나가 남긴 보관 메모를 보고 오늘 촬영한 것을 골라 보자.');detail=mode==='supplies'?'supplies':'drawer';}
    else{say('태오',s.tape?'빈 서랍이야. 테이프는 우리가 챙겼어.':'잠겨 있어. 아래 가방에서 열쇠를 선택한 뒤 이 서랍을 눌러야겠어.');detail='';}
   }
   if(id==='board'){change(id);say('소미',mode==='supplies'?'하나의 방송 원고가 뒤섞여 있어. 먼저 실험을 끝내고 돌아오면 무슨 내용인지 알 수 있겠지.':'세 실험의 원고 조각이 뒤섞였어. 틀린 설명을 그대로 방송할 수는 없잖아. 우리가 확인한 결과와 맞춰 보자.');detail=mode==='supplies'?'':'board';}
   if(id==='equipment'){change(id);say('강은호',mode==='supplies'?'방송 장비는 선생님이 점검 중이래. 실험 도구는 책상 서랍에서 찾아보자.':'상자마다 환경 방송 소품이 들어 있어. 선생님 쪽지에는 ‘방송 연결선은 전기 없이 공기를 거르는 소품과 함께 보관’이라고 쓰여 있네. 어느 상자를 열까?');detail=mode==='supplies'?'':'equipment';}
   if(id==='tv'){change(id);say('소미',mode==='supplies'?'지금은 화면이 꺼져 있어. 도구부터 찾고 실험 뒤에 돌아오자.':s.loaded?'테이프를 넣었어. 방송 연결과 원고 확인을 마치면 재생할 수 있어.':'테이프가 없어. 서랍을 조사하고, 가방에서 찾은 테이프를 선택해 여기에 넣자.');detail=mode==='supplies'?'':'tv';}
   if(id==='door'){change(id);say('태오',mode==='supplies'?'문은 잠겨 있지 않아. 선생님은 바로 옆 작업대에 계셔. 여기 열쇠는 출입문이 아니라 기구 보관장용이야.':s.unlocked?'비상 열쇠로 이 문을 열었어. 이제 밖으로 나가자.':s.heard?'방송에서 비상 열쇠함 번호를 들었어. 문 옆 열쇠함에 입력해 보자.':'손잡이가 움직이지 않아. 바깥에서 잠겼나 봐. 문을 부수기보다는 방송으로 선생님께 알려야겠어.');detail=mode==='supplies'?'return':'door';}
   const extras={phone:['태오','수화기에서 아무 소리도 안 나. 선이 벽 안으로 이어져 있어. 함부로 뜯지 말고 다른 연락 방법을 찾자.'],headphones:['강은호','한쪽 귀 덮개에 실밥이 풀렸네. 하나가 늘 쓰던 거야. …왜 이건 기억나지?'],notebook:['소미','수첩에 “학교생활 소개 영상 · 우리 반 과학 시간”이라고 적혀 있어. 방송 원고와 소품을 맞춰 보면 되겠어.'],cases:['태오','전부 예전 행사 영상이야. 오늘 것은 책상 서랍에 따로 보관했다는 쪽지가 있어.'],camera:['강은호','카메라는 없고 삼각대 연결 부품만 있어. 선생님이 촬영할 때 쓰던 카메라야. 어디로 옮겼는지 다른 기록도 확인하자.'],shelf:['소미','길쭉한 것은 유리 막대, 원뿔 모양은 깔때기야. 거름종이는 깔때기에 받쳐 써. 깨진 유리는 손대지 말자.'],rolls:['태오','이것도 하나의 촬영 배경인가 봐. 뒤에 “작업이 끝나면 도구는 씻어서 반납”이라고 적혀 있어.']};
   if(extras[id]){say(...extras[id]);detail='';}
   if(mode==='supplies'&&id==='shelf')detail='apparatus';
   if(['notebook','cases','camera'].includes(id)){change(id);detail='evidence';say('소미','물건마다 촬영 기록이 조금씩 남아 있어. 서로 맞춰 보면 하나가 어디로 갔는지 알 수 있겠어.');}
   if(['floorPaper','floorTape','floorBox'].includes(id)){
    change(id);detail='';
    const notes={
     floorPaper:['소미','접힌 촬영 그림이야. 교실 장면 다음에는 복도, 그다음에는 야외 풍경이 그려져 있어. 책상 수첩의 촬영 계획과 비교해 보자.'],
     floorTape:['태오','케이스에서 빠진 연습용 테이프네. 옆면에 “교실 촬영 연습”이라고 적혀 있어. 오늘 방송 수정본은 서랍에 따로 있다던 쪽지와 구별해야겠어.'],
     floorBox:['강은호','물·식용유 실험병을 천으로 감싸서 옮겼구나. 빈 병의 안쪽에 기름 자국이 남아 있어. 물과 기름이 잘 섞이지 않아 두 층으로 보였던 소품이야. 방송 원고의 물·식용유 실험병 설명과 맞춰 보자.']
    };say(...notes[id]);
   }
   if(id==='keybox'){say('소미','비상 열쇠가 보이는데 번호를 알아야 꺼낼 수 있어. 하나가 남긴 방송을 찾아보자.');detail='door';}
   render();
   if(s.complete&&mode==='finale'&&!finished){finished=true;onComplete();}
  }
  function render(){
   host.classList.add('room-panel');
   const art=s.drawerOpen?(mode==='supplies'?'science-prep-open-v1.png':'broadcast-open-v1.png'):baseArt;
   const goal=mode==='supplies'?'서랍에서 실험 도구 찾기':!s.heard?'방송을 연결해 밖에 도움 요청하기':!s.unlocked?'비상 열쇠함을 열어 출입문 열쇠 찾기':'문을 열고 친구들과 나가기';
   // Artwork coordinates (percent of the whole image), not stretched button rectangles.
   const outlines=mode==='supplies'?{
    window:'M0 0 H25.8 V44.2 L0 49 Z',
    tray:'M0 66.5 Q1 66 3 66.6 L30.5 70.7 Q31.5 71 31.4 73.2 L29.5 82.8 Q29.3 84.1 27.9 85 L6 100 H0 Z',
    drawer:'M49.9 61 L60.7 61.6 V81.4 L56.1 81.2 V73.3 L49.9 72.3 Z',
    shelf:'M58.5 14 H77.2 V46 H58.5 Z',
    rolls:'M32.3 47 L32 19.5 L32.8 19 V16 H34.2 V18 L34.8 18 V12.5 H37.2 V20.5 L37.8 20.4 V15 H39.2 V20.8 L39.8 21 L39 47.4 Z',
    door:'M79.7 9 L93.5 8 V65 L79.7 64.6 Z'
   }:{
    window:'M0 0 L22.4 10.7 V57.4 L0 60 Z',
    tray:'M1.8 64.3 L13.1 59.9 Q13.5 59.8 14 60 L21.3 61.3 Q21.8 61.5 21.4 62.2 L20.2 67.4 Q20 68 19.3 68.2 L13.5 70 Q13 70.2 12.3 70 L2.6 68.3 Z',
    drawer:'M27.5 58.1 H52 V65.2 H27.5 Z',
    tv:'M30.3 29.8 L31.7 28.4 L45.3 29.3 Q45.7 29.4 45.7 30.1 V47.3 Q45.7 47.8 45.2 47.8 H42 V49.7 H46.5 V55.6 H29.5 V49.7 H34.4 V48 L30.2 47.2 Z',
    board:'M54.5 19.2 H76.4 V50.3 H54.5 Z',
    equipment:'M58.4 67.5 H64.3 Q65.1 67.5 65.8 68.8 L67 70.9 V76.6 Q67 77.5 66.2 77.5 H57.5 V70.8 Z',
    door:'M86.6 16.5 L98.6 6.4 V95.3 L86.6 81 Z',
    phone:'M26.1 50.9 Q27.4 50 28.8 50.4 Q29.7 50.3 30 51.2 L30.8 55.7 L26.2 56 L26 54 L25.7 54 Q25.1 53.5 25.7 52.6 Z',
    headphones:'M48.5 30 Q48.8 26 50.4 25.5 L50.5 24.6 Q50.7 24 51 24.6 L51.2 25.5 Q53.1 26 53.4 30.1 L53.4 32.5 Q53.8 34.5 52.8 35.2 Q51.9 35.4 51.6 33 V30.8 Q51.7 29.9 52.3 30 L52 28 Q51 26.5 49.6 28 L49.3 30.1 Q50 30 50.1 31 V33.8 Q49.9 35.1 49 35 Q48.1 34.8 48.3 32 Z',
    notebook:'M62.3 59.8 L65.7 59 L68.5 60.1 V61.8 L65.2 62.4 L62.3 61.3 Z',
    cases:'M70.1 56.2 L73.8 55.5 L76.9 56.8 V58 L77.3 58.2 V61.3 L73.7 62.4 L70 60.6 Z',
    keybox:'M78.4 27 L84.3 26.5 Q84.8 26.5 84.8 27.3 V40.5 H78.4 Z',
    camera:'M12.2 83 Q12.4 81.6 14 81 L14.3 79.5 Q15.5 78 17 78.5 L17.7 77.4 Q19 77 20 78 L22 78 Q22.8 78 22.8 80 V89 Q22.6 91.5 20.5 93 L16 95.5 Q13.5 95 12.1 93.6 Z',
    floorPaper:'M34.2 87.1 L39.3 86.6 L41.3 85.8 L43.5 86.2 L48.5 85.5 L49.7 94.8 L43.9 95.5 L41.5 95.1 L33 96.2 Z',
    floorTape:'M53.8 89.7 L60.2 87 Q60.6 86.9 60.8 87.5 L62.2 91 V92.2 L56 95.2 L53.8 92.1 Z',
    floorBox:'M66.2 85 L69.8 81 L82 79 L88.4 88 L85.8 88.3 V94.6 L73.2 98.9 L71.9 92.1 L68.3 92.7 Z'
   };
   if(s.drawerOpen)outlines.drawer=mode==='supplies'?'M47.3 58.8 L51 56.3 V72 L47.3 71.5 Z':'M27 63 L30 58 H50.5 L52.2 63 V70 H27 Z';
   host.innerHTML=root.RoomScene.render({place:'1999 · '+(mode==='supplies'?'과학준비실':'방송실'),goal,art:'assets/'+art,alt:mode==='supplies'?'실험 기구와 잠긴 서랍이 있는 과학준비실':'여러 촬영 소품과 비디오가 있는 방송실',peek,speaker,line,
    selected:s.selected==='key'?'사용 중: 작은 열쇠 → 잠긴 서랍을 누르세요':s.selected==='tape'?'사용 중: 테이프 → 비디오를 누르세요':'',
    spots:roomSpots.concat(scenery).map(([id,name,x,y,w,h])=>'<button type="button" class="room-hotspot '+(peek?'revealed':'')+'" data-spot="'+id+'" aria-label="'+name+' 조사" style="left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%"><svg class="room-object-glow" viewBox="'+x+' '+y+' '+w+' '+h+'" preserveAspectRatio="none" aria-hidden="true"><path d="'+(outlines[id]||scenery.find(item=>item[0]===id)?.[6])+'"/></svg><span>'+name+'</span></button>').join('')});
   if(bagOpen){const bag=document.createElement('section');bag.className='room-modal';bag.setAttribute('role','dialog');bag.setAttribute('aria-label','내 가방');bag.innerHTML='<div class="room-modal-content"><h2>내 가방</h2>'+btn('bag-close','가방 닫기')+'<div class="inventory-items">'+(s.key?'<article><span class="inventory-symbol">⚿</span><h3>작은 열쇠</h3><p>과학준비실에서 찾은 공용 서랍 열쇠. 책상 서랍에 사용한다.</p>'+btn('select-key','열쇠 사용하기')+'</article>':'<p>아직 챙긴 물건이 없어.</p>')+(s.tape?'<article><img class="room-tape-detail" src="assets/vhs-cartoon-v1.png" alt="방송 테이프"><h3>하나의 테이프</h3><p>서랍에서 확인한 오늘 방송. 비디오에 넣는다.</p>'+btn('select-tape','테이프 사용하기')+'</article>':'')+(s.script?'<article><h3>복원한 방송 원고</h3><p>세 실험의 분리 방법을 연결했다.</p></article>':'')+'</div></div>';host.append(bag);}
   if(detail){
    const modal=document.createElement('section');modal.className='room-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-label','물건 자세히 조사');
    let html='';
    if(detail==='evidence')html='<h2>하나의 마지막 촬영 기록</h2><p>읽은 기록은 다시 여기서 확인할 수 있어. 아직 빈 칸은 방 안의 실제 물건을 눌러 찾아보자.</p><ul><li>파란 수첩: '+(s.notebook?'“소품 정리 다음에는 밖으로. 마지막 촬영 뒤 방송실로 돌아올 것.”':'아직 조사하지 않음')+'</li><li>테이프 묶음: '+(s.cases?'“교실 촬영 완료. 다음 장면에는 운동장 골대가 보여야 함.”':'아직 조사하지 않음')+'</li><li>카메라 가방: '+(s.camera?'카메라는 없고, 주머니에 “골대 옆에서 은호 기다리기”라는 메모가 남아 있다.':'아직 조사하지 않음')+'</li></ul>'+(s.route?'<p>소미: 다음에 찾아볼 곳은 운동장 골대 옆. 이제 이 촬영의 마지막 방송을 확인하자.</p>':s.notebook&&s.cases&&s.camera?'<p>세 기록을 연결하면, 하나가 다음으로 촬영하려던 곳은?</p>'+btn('route-wrong','교실 · 이미 끝난 촬영을 다시 한다')+btn('route-right','운동장 골대 옆 · 은호와 약속한 촬영 장소')+btn('route-wrong','방송실 · 밖으로 나갈 계획은 없었다'):'<p>소미: 수첩, 테이프 묶음, 카메라 가방을 모두 살펴보자.</p>');
    if(detail==='apparatus')html='<h2>선반의 거름 장치 점검</h2><p>소미: 깔때기에 거름종이를 받쳐서 쓸 거야. 받는 비커까지 준비할 때, 맑은 액체를 버리면 안 되는 이유는?</p>'+btn('apparatus-wrong','맑은 액체는 모두 순수한 물이기 때문에')+btn('apparatus-right','녹아 있는 소금이 액체와 함께 통과하기 때문에')+btn('apparatus-wrong','모래가 모두 물에 녹기 때문에');
    if(detail==='weigh')html='<h2>저울 옆 반납 기록</h2><p>소금 4 g과 모래 6 g을 합쳐 담았다. 빈 비커는 30 g이다. 분리하기 전에 비커째 확인할 질량은?</p><form id="roomMass"><label>비커와 재료의 질량<input name="mass" aria-label="비커와 재료의 질량" inputmode="numeric"> g</label><button>저울 기록 확인</button></form><p>소미: 실험 뒤에 무엇을 흘렸는지 알아보려면 처음 기록도 필요해.</p>';
    if(detail==='tray')html='<h2>모래 속 작은 열쇠</h2><p>열쇠와 자갈은 크고, 모래는 작다. 접시 아래에 받침을 놓았다. 어떤 체를 사용할까?</p><div class="room-tray-art" role="img" aria-label="창가의 모래와 자갈 접시 확대"></div>'+btn('sieve-wrong','열쇠까지 통과하는 성긴 체')+btn('sieve-right','모래만 통과하는 체')+btn('sieve-wrong','모래도 통과하지 못하는 체');
    if(detail==='supplies')html=s.complete?'<h2>도구를 챙겼다</h2><p>비커, 유리 막대, 깔때기와 거름종이를 골랐다. 선생님이 옆 작업대에서 기다리고 있다.</p>'+btn('finish-supplies','준비를 확인하고 선생님께 간다'):'<h2>서랍 안 · 실험 준비 쪽지</h2><p>먼지가 쌓인 체 옆에는 깔때기와 거름종이가 가지런히 놓여 있다. 비커 바닥에는 작은 모래알이 남아 있다.</p><p>어떤 도구 묶음을 챙길까?</p>'+btn('tools-wrong','체와 자석: 소금과 모래를 마른 채로 나누기')+btn('tools-right','비커·유리 막대·깔때기·거름종이: 녹인 뒤 모래 거르기')+btn('tools-wrong','증발 접시만: 모래가 섞인 채 바로 가열하기');
    if(detail==='drawer')html=s.tape?'<h2>오늘 방송을 챙겼다</h2><img class="room-tape-detail" src="assets/vhs-cartoon-v1.png" alt="발견한 비디오테이프"><p>가방에서 테이프를 선택해 비디오에 넣자.</p>':'<h2>두 테이프 중 오늘 방송은?</h2><p>서랍 안 보관 메모: “오늘 방송에는 물에 소금을 녹인 뒤 모래를 거르는 장면을 썼다. 편집자가 결과 설명을 잘못 붙인 초안은 사용하지 말 것.”</p><p>테이프 라벨의 설명을 비교해 사용할 것을 고르자.</p>'+btn('tape-wrong','초안: 거름종이 위에 소금, 아래에 모래가 남는다')+btn('tape-right','수정본: 거름종이 위에 모래, 아래에 소금물이 모인다');
    if(detail==='board')html=s.script?'<h2>복원한 방송 원고</h2><p>모래·자갈: 크기 차이. 물·기름: 서로 잘 섞이지 않음. 소금·모래: 용해 → 거름 → 증발.</p><p>“버리기 전에 다시 나누면, 내일도 쓸 수 있어요.”</p>':'<h2>뒤섞인 방송 원고</h2><p>실험 재료에 맞는 원고를 연결하자. 앞선 실험에서 실제로 본 결과를 떠올려 봐.</p><form id="roomScript"><label>모래 그림<select name="sand" aria-label="모래 그림"><option value="">설명 고르기</option><option value="size">알갱이 크기 차이로 나눔</option><option value="melt">가열해서 자갈을 녹임</option></select></label><label>물·식용유 실험병<select name="oil" aria-label="물·식용유 실험병"><option value="">설명 고르기</option><option value="filter">거름종이가 기름만 붙잡음</option><option value="layers">잘 섞이지 않아 생기는 층을 이용</option></select></label><label>소금과 모래<select name="salt" aria-label="소금과 모래"><option value="">설명 고르기</option><option value="sequence">물에 녹임 → 거름 → 물 증발</option><option value="dry">마른 혼합물을 바로 가열</option></select></label><button type="submit">원고 연결하기</button></form>';
    if(detail==='equipment')html=s.power?'<h2>방송 연결 완료</h2><p>마스크 소품 상자에서 방송 연결선을 찾았다. 선생님이 점검한 연결도대로 꽂으니 비디오의 표시등이 켜진다.</p>':s.device?'<h2>왜 이 장치를 골랐어?</h2><p>마스크 상자 안에 방송 연결선과 설명 카드가 있다. 마지막 방송에 쓸 카드의 빈칸을 채워 보자. ‘마스크는 ___ 때문에 전기 없이 사용할 수 있다.’</p>'+btn('reason-wrong','공기를 새 물질로 바꾸기 때문에')+btn('reason-right','전기 없이 공기 중 입자를 걸러 주기 때문에')+btn('reason-wrong','산소를 직접 만들어 내기 때문에'):'<h2>촬영용 장치 목록</h2><p>학교 환경 방송을 위한 소품들이다. 전기가 끊겨도 그대로 사용할 수 있는 것은?</p>'+btn('device-wrong','전동 공기 청정기')+btn('device-right','마스크')+btn('device-wrong','전동 청소 로봇');
    if(detail==='tv')html='<h2>방송 비디오</h2><div class="room-tv-detail">'+(s.heard?'11 : 35':'▸')+'</div><p>'+(s.heard?'하나: “방송실 비상 열쇠함 번호는 1135. 문이 걸리면 안쪽 열쇠함을 열어. …내 이름도 아직 읽히니?”':'테이프 '+(s.loaded?'✓':'미삽입')+' · 원고 '+(s.script?'✓':'미확인')+' · 방송 연결 '+(s.power?'✓':'필요'))+'</p>'+btn('play','테이프 재생하기');
    if(detail==='return')html='<h2>과학실로 통하는 문</h2><p>열려 있는 문 너머로 선생님이 보인다.</p>'+(s.complete?btn('finish-supplies','찾은 기구를 가지고 돌아간다'):btn('ask-teacher','문 너머 선생님께 물어본다'));
    if(detail==='door')html='<h2>방송실 출입문</h2><p>'+(s.heard?'문 옆 작은 비상 열쇠함에 네 자리 번호 잠금이 있다. 하나의 방송에서 들은 번호를 넣어 보자.':'창문 너머로 선생님은 보이지 않는다. 방송으로 도움을 요청할 수 있을까?')+'</p>'+(s.unlocked?btn('exit','손잡이를 돌려 나가기'):s.heard?'<form id="roomCode"><label>테이프에서 들은 열쇠함 번호<input name="code" aria-label="비상 열쇠함 번호" inputmode="numeric" maxlength="4" autocomplete="off"></label><button>열쇠함 열기</button></form>':'');
    modal.innerHTML='<div class="room-modal-content">'+btn('close','방으로 돌아가기')+html+'</div>';host.append(modal);
   }
   host.querySelectorAll('[data-spot]').forEach(b=>b.onclick=()=>inspect(b.dataset.spot));
   host.querySelectorAll('[data-room-action]').forEach(b=>b.onclick=()=>act(b.dataset.roomAction));
   if(q('#roomMass'))q('#roomMass').onsubmit=e=>{e.preventDefault();const ok=String(new FormData(e.target).get('mass')).normalize('NFKC').trim()==='40';if(ok)change('weigh-right');say('소미',ok?'맞아, 전체 40 g 중 비커 30 g을 빼면 재료는 10 g. 수첩에 적어 두자. 이제 선반에서 거름 기구를 살펴보자.':'비커 자체도 저울에 올라가 있어. 30 g에 두 재료의 질량을 더해 보자.');detail='';render();};
   if(q('#roomScript')) {
    q('#roomScript').querySelectorAll('select').forEach(select=>{
     const group=document.createElement('span');group.className='script-options';group.setAttribute('role','radiogroup');group.setAttribute('aria-label',select.getAttribute('aria-label'));
     Array.from(select.options).filter(option=>option.value).forEach(option=>{
      const label=document.createElement('label');const input=document.createElement('input');input.type='radio';input.name=select.name;input.value=option.value;input.required=true;
      const text=document.createElement('span');text.textContent=option.textContent;label.append(input,text);group.append(label);
     });
     const parent=select.parentElement;const title=document.createElement('strong');title.textContent=select.getAttribute('aria-label');const field=document.createElement('fieldset');field.className='script-field';const legend=document.createElement('legend');legend.textContent=title.textContent;field.append(legend,group);parent.replaceWith(field);
    });
    q('#roomScript').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);act(f.get('sand')==='size'&&f.get('oil')==='layers'&&f.get('salt')==='sequence'?'script-right':'script-wrong');};
   }
   if(q('#roomCode'))q('#roomCode').onsubmit=e=>{e.preventDefault();act(new FormData(e.target).get('code').trim()==='1135'?'code-right':'code-wrong');};
  }
  function act(a){
   let wrong=a.endsWith('-wrong');
   if(a==='close')detail='';
   else if(a==='ask-teacher'){detail='';say('1999년 담임','들어와도 된단다. 다만 실험에 쓸 기구는 아직 저 보관장 안에 있구나. 열쇠를 찾기 어렵다면 은호에게 마지막으로 어디서 썼는지 물어보렴.');}
   else if(a==='bag'){bagOpen=true;detail='';}
   else if(a==='bag-close')bagOpen=false;
   else if(a==='peek'){peek=!peek;}
   else if(a==='finish-supplies'){if(s.complete&&!finished){finished=true;onComplete();return;}detail='';say('소미','문은 열려 있어. 다만 빈손으로 돌아가면 실험을 시작할 수 없겠지. 우리가 가져오려던 기구는 찾았어?');render();return;}
   else if(a==='exit'){inspect('door');return;}
   else{
    change(a);
    if(a==='select-key'||a==='select-tape'){bagOpen=false;detail='';say('소미',a==='select-key'?'열쇠를 손에 들었어. 잠긴 서랍을 눌러 사용하자.':'테이프를 손에 들었어. 방 안의 비디오를 눌러 넣자.');}
    if(a==='apparatus-right'){detail='';say('소미','거름종이를 통과한 액체도 버리지 않기로 했어. 준비 기록에 표시해 둘게.');}
    if(a==='tools-right')say('강은호','이 도구면 소금을 녹인 뒤 모래를 걸러 낼 수 있겠다. 이제 선생님께 가져가자.');
    if(a==='tape-right')say('소미','모래는 거름종이에 남고 소금물은 통과했지. 실제 결과와 맞는 수정본을 가방에 넣었어.');
    if(a==='sieve-right'){detail='';say('태오','체를 흔드니 작은 모래가 아래로 떨어지고 열쇠가 드러났어! 가방에서 열쇠를 선택하고 서랍에 써 보자.');}
    if(a==='script-right'){detail='';say('소미','세 설명이 실제 결과와 맞아. 우리 반 과학 수업 원고가 맞네. 이제 나머지 촬영 기록과 이어서 다음 장소를 찾자.');}
    if(a==='device-right')say('강은호','마스크를 골랐구나. 전기 없이도 쓸 수 있는 이유까지 확인하자.');
    if(a==='reason-right'){detail='';say('강은호','상자에서 찾은 연결선을 선생님의 연결도대로 꽂았어. 마스크 설명 카드도 준비됐고. 이제 테이프를 확인하자.');}
    if(a==='route-right'){detail='evidence';say('강은호','맞아, 골대 옆에서 만나기로 했어. 다음에 찾아갈 곳을 알았으니, 마지막 방송에 무슨 일이 남았는지 들어보자.');}
    if(a==='play'){if(s.heard)say('소미','하나 목소리야! 비상 열쇠함 번호는 1135래. 문 옆 열쇠함을 눌러 번호를 입력해 보자.');else if(!s.route){detail='evidence';say('소미','테이프가 여러 촬영 기록과 이어져 있어. 수첩·테이프 묶음·카메라 가방부터 비교해서 어느 촬영인지 확인하자.');}else say('태오','아직 재생 준비가 안 됐어. 테이프를 넣고 원고와 방송 연결을 확인하자.');}
    if(a==='code-right'){detail='';say('강은호','열쇠함이 열렸어! 안에 있는 비상 열쇠로 문을 열 수 있겠다. 문손잡이를 눌러 보자.');}
    if(wrong){detail='';say('소미',a==='sieve-wrong'?'열쇠와 모래가 함께 움직였어. 모래만 통과하고 열쇠는 남을 만큼의 구멍이 필요해.':a==='script-wrong'?'원고 중 실제 결과와 다른 부분이 있어. 자갈이 녹았는지, 기름이 거름종이에 남았는지, 소금을 어디에서 얻었는지 되짚어 보자.':a==='route-wrong'?'수첩에는 밖으로 나간다고 적혀 있어. 이미 촬영한 곳과 다음에 촬영할 곳을 구별해 보자.':a==='code-wrong'?'열쇠함이 열리지 않아. 비디오에서 마지막 방송을 다시 들어 보자.':'그 설명으로는 상황을 해결하기 어려워. 무엇을 걸러 주는지, 전기가 필요한지 따로 생각해 보자.');}
   }
   render();if(wrong)delay.start();
  }
  render();return ()=>{delay.dispose();host.classList.remove('room-panel');};
 }
 const api={initial,restore,step,mount};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RoomAdventure=api;
})(typeof window==='undefined'?globalThis:window);
