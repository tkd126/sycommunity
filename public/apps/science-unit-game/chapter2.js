(function(root){
 'use strict';
 function build(){
  const s={};
  function line(id,speaker,text,next,extra={}){s[id]={label:'2편 · 운동회에 없는 아이',date:'1999년 12월 29일',time:'오전 9:00',mode:'past',backdrop:'field',chars:['taeo','somi','eunho'],active:({'태오':'taeo','소미':'somi','강은호':'eunho'})[speaker]||'',speaker,line:text,next,...extra};}
  const yesterday={date:'1999년 12월 28일',time:'오전 11:50'};
  line('chapter2-start','소미','방송실에서 찾은 마지막 촬영 약속은 골대 옆이었어. 이름을 적은 종이도 챙겼지? 선생님과 같이 가 보자.','c2-search',{...yesterday,time:'오전 11:45'});
  line('c2-search','소미','골대 앞은 비어 있어. 누군가 남긴 물건이 있는지 살펴보자.','c2-teacher',{...yesterday,chars:[],experiment:'hana-search'});
  line('c2-found','윤하나','오지 마. 방금도 은호가 나를 보고 그냥 지나갔어. 또 그러면… 나도 내가 여기 있는지 모르겠어.','c2-anchor',yesterday);
  line('c2-anchor','소미','윤하나. 네가 과학 수업을 소개했지? 네 이름을 여기 적었어. 은호야, 이 종이 보고 천천히 불러 줘.','c2-call',yesterday);
  line('c2-call','강은호','윤하나. …맞아. 어제 원고 읽다가 네가 웃었잖아. 내가 ‘식용유’를 ‘식용우’라고 해서.','c2-answer',yesterday);
  line('c2-answer','윤하나','…그걸 기억해? 맞아. 내가 다시 읽어 보라고 했어. 이제 나 보이는 거지?','c2-teacher',yesterday);
  line('c2-teacher','1999년 담임','교무실에 도착했구나. 하나는 여기서 몸을 녹이고 있으렴. 보호자께 연락하는 동안 너희도 함께 있어 주겠니?','c2-hesitate',{...yesterday,time:'낮 12:00',backdrop:'classroom',chars:['teacher','somi'],active:'teacher'});
  line('c2-hesitate','강은호','너…… 잠깐, 이름이 또 안 나와. 종이를 어디 뒀지? 방금 분명 기억했는데.','c2-record',{...yesterday,time:'낮 12:02',backdrop:'classroom',chars:['eunho','somi']});
  line('c2-record','소미','윤하나. 여기 써 있어. 이름이랑, 우리가 같이 겪은 일도 적자. 또 헷갈리면 꺼내 볼 수 있게.','c2-evening',{...yesterday,time:'낮 12:02',backdrop:'classroom',choices:[{text:'촬영 때 있었던 일을 적는다.',branch:'c2-write-memory'},{text:'지금 나눈 대화를 적는다.',branch:'c2-write-today'}]});
  line('c2-write-memory','강은호','‘식용우라고 읽고 소 흉내를 냈다’…… 이걸 정말 쓰게? 알았어. 창피해도 잊어버리는 것보다는 낫지.','c2-write-memory2',{...yesterday,time:'낮 12:03',backdrop:'classroom'});
  line('c2-write-memory2','소미','응. 무슨 일이 있었는지 네 말로 남겨 두자. 하나도 옆에서 확인해 주고 있어.','c2-evening',{...yesterday,time:'낮 12:03',backdrop:'classroom'});
  line('c2-write-today','소미','골대 뒤에서 만났고, 은호가 이름을 읽었고…… 하나가 했던 말도 그대로 적어 둘게.','c2-write-today2',{...yesterday,time:'낮 12:03',backdrop:'classroom'});
  line('c2-write-today2','강은호','끝에 이것도 써 줘. ‘같이 교무실에 왔다.’ 혼자 두고 온 건 아니니까.','c2-evening',{...yesterday,time:'낮 12:03',backdrop:'classroom'});
  line('c2-evening','1999년 담임','보호자와 연락이 닿았다. 하나는 만나서 함께 귀가하도록 하마. 내일도 선생님과 교실로 오기로 했어.','c2-event-plan',{...yesterday,time:'낮 12:20',backdrop:'classroom',chars:['teacher','somi'],active:'teacher'});
  line('c2-event-plan','소미','교실 안내에 내일 짧은 학급 경기와 기념 촬영이 있대. 선생님, 하나와 저희가 함께 있는 사진도 찍어 주실 수 있어요?','c2-photo-plan',{...yesterday,time:'낮 12:21',backdrop:'classroom'});
  line('c2-photo-plan','1999년 담임','하나도 좋다고 하는구나. 함께 찍어 주마. 다만 필름 사진은 현상한 뒤에 볼 수 있단다. 그동안 오늘 쓴 기록도 잘 보관하렴.','c2-promise',{...yesterday,time:'낮 12:21',backdrop:'classroom',chars:['teacher','somi'],active:'teacher'});
  line('c2-promise','강은호','내일 아침 아홉 시, 교실 앞에서 기다릴게. 내가 못 알아봐도 그냥 가지 마. 이 종이부터 보여 줘.','c2-morning',{...yesterday,time:'낮 12:22',backdrop:'classroom'});
  line('c2-morning','태오','새천년맞이 겨울 운동회… 진짜 하는 거였네? 이 추운 날에?','c2-event');
  line('c2-event','1999년 담임','온종일 뛰는 행사는 아니야. 짧은 학급 경기와 기념 촬영이지. 몸부터 풀고, 날씨나 바닥이 나쁘면 실내로 옮긴다.','c2-fog-intro',{chars:['teacher','taeo'],active:'teacher'});
  line('c2-fog-intro','윤하나','나 여기 있어. 어제처럼 내 이름 불러 줘서 고마워. 그런데 저쪽 골대가 안 보여. 렌즈가 뿌연 건가?','c2-fog');
  line('c2-fog','소미','렌즈만 닦기 전에 주변도 보자. 풀, 운동장 공기, 하늘은 서로 다르게 보여.','c2-fog-after',{experiment:'weather',weather:'fog'});
  line('c2-fog-after','소미','렌즈 문제가 아니었네. 안개가 옅어질 때까지 선생님과 실내에서 준비하자. 하나야, 내 옆으로 와.','c2-partner');
  line('c2-partner','강은호','이제 골대가 보여. 선생님도 바닥 확인 끝내셨대. 순서표 챙길 사람? 하나가 마지막 주자야.','c2-gust',{time:'오전 10:00',choices:[
   {text:'은호와 함께 순서표를 확인한다.',branch:'c2-partner-eunho'},
   {text:'하나와 함께 응원 구호를 맞춘다.',branch:'c2-partner-hana'},
   {text:'정복과 날아갈 물건을 고정한다.',branch:'c2-partner-jeongbok'}]});
  line('c2-partner-eunho','강은호','내가 세 번째, 하나가 네 번째. 오늘은 안 헷갈려. …아니, 헷갈리면 이걸 다시 읽을게.','c2-partner-eunho2');
  line('c2-partner-eunho2','소미','응. 기억한다고 버리지는 말자. 순서표도 사진에 같이 찍어 두면 좋겠어.','c2-gust');
  line('c2-partner-hana','윤하나','내 이름 넣어서 응원하면 좀 쑥스럽긴 한데… 오늘은 그렇게 해 줘. 목소리가 들리면 덜 무서워.','c2-partner-hana2');
  line('c2-partner-hana2','태오','윤! 하! 나! …너무 컸어? 알았어, 경기 시작하면 더 크게 할게.','c2-gust');
  line('c2-partner-jeongbok','박정복','내가 집게를 다 챙겼지. 이런 건 나한테 맡겨! …어라, 마지막 하나 어디 갔지?','c2-partner-jeongbok2');
  line('c2-partner-jeongbok2','소미','네 소매에 붙어 있어. 자랑하기 전에 이것부터 꽂자. 바람이 세졌어.','c2-gust');
  line('c2-gust','태오','앗, 순서표! 사진 찍으려고 집게 뺀 사이에 날아갔어. 아무 데나 뛰어가면 놓치겠는데!','c2-wind',{time:'오전 10:08'});
  line('c2-wind','강은호','마지막으로 본 건 운동장 한가운데야. 깃발이랑 관측판을 보고 찾을 쪽을 정하자.','c2-wind-after',{time:'오전 10:08',experiment:'weather',weather:'wind'});
  line('c2-wind-after','윤하나','찾았다! 동쪽 생울타리에 걸렸네. 마지막 칸에 내 이름 있어. 은호야, 이번엔 꼭 보고 있어.','c2-race',{time:'오전 10:15'});
  line('c2-race','강은호','하나야, 받아! …좋아, 바통 넘겼어! 난 여기서 멈출게. 결승선까지 조금만 더!','c2-erased',{time:'오전 10:20'});
  line('c2-erased','강은호','결승선? 내가 들어왔는데? …잠깐. 난 세 번째 주자였어. 그런데 왜 내가 마지막이었다고 생각했지?','c2-evidence',{time:'오전 10:24'});
  line('c2-evidence','소미','순서표 마지막 칸이 또 비었어. 하지만 녹음에는 태오가 하나를 부르는 소리가 남았어. 이름만으로는 부족해. 얼굴이 나온 사진도 남겨야 해.','c2-weather-change',{time:'오전 10:25'});
  line('c2-weather-change','1999년 담임','다음 경기는 잠깐 중단하자. 바람이 강해지고 먹구름이 들어온다. 방송부는 관측 기록과 바닥 상태를 가져오렴.','c2-schedule',{time:'오전 11:00',chars:['teacher','somi'],active:'teacher'});
  line('c2-schedule','소미','아까 맑았다고 계속 맑은 건 아니야. 오전 기록, 새 예보, 운동장 상태를 함께 보자.','c2-schedule-after',{time:'오전 11:00',experiment:'weather',weather:'schedule'});
  line('c2-schedule-after','1999년 담임','그래. 야외 경기는 끝내고 강당에서 몸을 녹이자. 사진도 비를 피해서 찍겠다. 바깥 물건은 선생님들이 챙길 테니 나가지 마.','c2-confess',{time:'오전 11:10',chars:['teacher','somi'],active:'teacher'});
  line('c2-confess','윤하나','사실 나도 미래 학교가 나오는 영상을 봤어. 졸업앨범에도 방송부 기록에도 내 이름이 없었어. 그런데 어른이 된 은호는 계속 누굴 찾고 있었어.','c2-confess2',{time:'오전 11:20',backdrop:'classroom'});
  line('c2-confess2','윤하나','내가 사라지면 그 사람이 더는 안 찾아도 되는 걸까? 그게… 다들 편해지는 길이라면?','c2-reassure',{time:'오전 11:20',backdrop:'classroom'});
  line('c2-reassure','소미','하나에게 뭐라고 말할까?','c2-photo-intro',{backdrop:'classroom',time:'오전 11:21',choices:[
   {text:'“네가 없는 게 편한지, 우리한테도 물어봐야지.”',branch:'c2-stay'},
   {text:'“영상에 없다고 네 미래까지 정해진 건 아니야.”',branch:'c2-future'}]});
  line('c2-stay','강은호','난 안 편해. 모르는 사람 찾는 기분이 되는 게 제일 무서워. 네가 없어져도 괜찮다고 한 적 없어.','c2-stay2',{backdrop:'classroom'});
  line('c2-stay2','윤하나','…미안. 혼자 결론 내렸네. 나도 남고 싶어. 사진, 나도 같이 찍을래.','c2-photo-intro',{backdrop:'classroom'});
  line('c2-future','소미','그 영상 하나가 전부라는 증거는 없잖아. 어제 못 읽던 이름도 우리가 다시 찾았어. 오늘 남길 수 있는 것부터 남기자.','c2-future2',{backdrop:'classroom'});
  line('c2-future2','윤하나','응. 사라진다는 생각만 하고 있었어. 나도 사진에 남을래. 이번엔 뒤에 숨지 않을게.','c2-photo-intro',{backdrop:'classroom'});
  line('c2-photo-intro','강은호','사진관에 맡길 봉투에 촬영 기록도 넣으래. 경기 사진의 시계가 멈춰 있는데… 날씨 기록으로 언제 찍힌 건지 좁힐 수 있을까?','c2-photo',{time:'오전 11:25',backdrop:'classroom'});
  line('c2-photo','소미','세 장의 기록을 비교해 봐. 시간 하나만 맞추는 게 아니라 하나가 실제로 경기했다는 증거를 연결하는 거야.','c2-shutter',{time:'오전 11:25',backdrop:'classroom',experiment:'weather',weather:'photo'});
  line('c2-shutter','1999년 담임','하나야, 앞줄 가운데로 와. 얼굴 가리는 우산은 접고. 모두 이름을 한 번씩 말해 볼까? …좋아, 찍는다!','c2-face',{time:'오전 11:35',backdrop:'classroom',chars:['teacher','somi'],active:'teacher'});
  line('c2-face','윤하나','윤하나. 내가 여기 있었다고, 잊으면 이 사진을 봐 줘. 나도 너희 이름 잊지 않게 적어 둘게.','c2-night',{time:'오전 11:35',backdrop:'classroom'});
  line('c2-night','강은호','선생님이 맡긴 사진을 같이 찾으러 왔어. …인화된 사진 봐! 하나 얼굴이 선명해. 순서표랑 녹음 기록도 맞아.','c2-theft',{time:'오후 6:10',backdrop:'night'});
  line('c2-theft','태오','잠깐! 검은 우비가 사진관 안으로… 필름 봉투를 가져갔어! 하나야, 내 뒤에 있어!','c2-safe',{time:'오후 6:11',backdrop:'night',glitch:true});
  line('c2-safe','1999년 담임','쫓아가지 마! 모두 안으로 들어와. 주인아저씨, 경찰에 연락해 주세요. 나는 아이들 곁에 있겠습니다.','c2-whistle',{time:'오후 6:12',backdrop:'night',chars:['teacher','somi'],active:'teacher'});
  line('c2-whistle','소미','인화한 사진 한 장은 내가 갖고 있어. 기록도 나눠 뒀고. …그런데 바닥에 이 호루라기. 은호야, 네가 목에 걸던 거 아니야?','c2-deny',{time:'오후 6:13',backdrop:'night'});
  line('c2-deny','강은호','내 거 맞아. 아침까지 분명 걸고 있었는데… 언제 없어진 거지? 나 계속 너희 옆에 있었잖아.','c2-last',{time:'오후 6:13',backdrop:'night'});
  line('c2-last','윤하나','우비 입은 사람이 돌아볼 때… 은호 목소리로 말했어. “그 사진을 믿지 마.”','chapter2-end',{time:'오후 6:14',backdrop:'night'});
  // Branches reconverge without making the visible clock run backwards.
  for(const [id,scene] of Object.entries(s)){
   if(id.startsWith('c2-partner'))scene.time='오전 10:00';
   if(['c2-stay','c2-stay2','c2-future','c2-future2'].includes(id))scene.time='오전 11:21';
   if(['c2-erased','c2-evidence','c2-confess','c2-confess2','c2-theft','c2-whistle','c2-deny','c2-last'].includes(id))scene.music='mystery';
  }
  // Keep existing IDs so chapter-two saves can enter the new exploration safely.
  for(const [id,mode] of Object.entries({'c2-fog':'fog','c2-wind':'wind','c2-schedule':'pack','c2-photo':'photo'})){
   s[id].experiment='playground';s[id].playground=mode;
  }
  s['c2-fog'].line='하나는 우리 옆에 있어. 흐린 건 먼 골대 쪽이야. 렌즈 표면과 바깥 풍경을 따로 살펴보자.';
  s['c2-wind'].line='순서표를 놓쳤어! 창고에서 쓸 만한 물건을 챙기고 깃발을 보자.';
  s['c2-erased'].next='c2-locker-intro';
  line('c2-locker-intro','소미','선생님이 방금 녹음한 테이프를 보관함에 넣으셨대. 우리가 확인해도 된다고 잠금을 풀어 주셨어. 은호의 기억과 녹음 중에 무엇이 다른지 직접 들어 보자.','c2-locker',{time:'오전 10:24'});
  line('c2-locker','강은호','선생님께 허락받았어. 관측 카드는 방송석, 깃대 밑, 창고에 나눠 뒀대. 내가 마지막으로 뛰었는지 직접 들어 보자.','c2-evidence',{time:'오전 10:24',experiment:'playground',playground:'locker'});
  s['c2-evidence'].line='은호가 “하나야, 받아!”라고 부른 뒤 “난 여기서 멈출게”라고 했어. 은호가 마지막은 아니었어. 사진과 관측 기록까지 맞춰 보자.';
  s['c2-schedule'].line='선생님이 야외 경기를 멈추셨어. 처마 아래에서 새 예보를 확인하고, 우리가 찾은 기록을 비에 젖지 않게 챙기자.';
  s['c2-weather-change'].time='오전 10:40';
  s['c2-weather-change'].line='빗방울이 떨어진다. 여기서 야외 경기를 마치자. 모두 처마 안으로! 방송부 기록도 안쪽 작업대에서 정리하렴.';
  s['c2-schedule'].time='오전 10:40';
  s['c2-schedule-after'].time='오전 10:45';
  s['c2-stay2'].next='c2-photo-intro';s['c2-future2'].next='c2-photo-intro';
  s['c2-photo-intro'].line='선생님이 경기 사진도 찍으셨대. 필름을 맡기면 저녁에 찾을 수 있어. 지금은 하나 얼굴이 잘 보이게 단체 사진을 찍자.';
  s['c2-photo-intro'].next='c2-shutter';
  s['c2-night'].line='인화 사진을 받았어! 선생님이 주인아저씨와 필름을 확인하시는 동안 경기 기록과 맞춰 보자. 하나가 마지막으로 뛰는 순간이 있을 거야.';
  s['c2-night'].next='c2-photo';
  Object.assign(s['c2-photo'],{time:'오후 6:10',backdrop:'night',next:'c2-proof',line:'사진 한 장만으로 짐작하지 말자. 깃발, 동시 녹음, 관측 시각을 연결해 봐.'});
  line('c2-proof','소미','찾았어. 하나가 네 번째로 뛰던 순간이야. 인화 사진은 내가, 이름과 시각을 옮긴 수첩은 네가 갖자. 하나를 기억할 증거를 나눠 지키는 거야.','c2-theft',{time:'오후 6:10',backdrop:'night'});
  // Hana only appears after she has been found. Use the approved solid sprite,
  // not an invisible speaker or an unrelated child's portrait.
  for(const scene of Object.values(s)){
   if(scene.speaker==='윤하나'){
    scene.chars=['eunho','hana'];scene.active='hana';
   }
  }
  // The approved second half keeps old scene IDs so existing saves still work.
  const room={backdrop:'classroom'};
  const at=(time,extra={})=>({time,...extra});
  line('c2-morning','강은호','아홉 시 맞지? 이름 종이도 가져왔어. 어제 교실 앞에서 만나자고 한 약속, 기억해.','c2-arrival',{...room,time:'오전 9:00'});
  line('c2-arrival','1999년 담임','하나와 함께 왔다. 보호자께도 오늘 일정을 알려 드렸어. 이동할 때는 선생님과 함께 가자.','c2-arrival-hana',{...room,time:'오전 9:00',chars:['teacher','hana'],active:'teacher'});
  line('c2-arrival-hana','윤하나','윤하나. 내가 먼저 이름 말하기로 했지? 기다려 줘서 고마워. 오늘은 같이 사진 찍자.','c2-event',{...room,time:'오전 9:01'});
  Object.assign(s['c2-event'],{...room,time:'오전 9:02'});
  for(const id of ['c2-fog-intro','c2-fog','c2-fog-after'])s[id].time='오전 9:10';
  s['c2-fog-after'].next='c2-prepare-intro';
  line('c2-prepare-intro','1999년 담임','실내에서 기다리는 동안 안개가 옅어졌다. 이제 골대가 잘 보이고 바닥도 괜찮아. 창고 도구를 챙겨 방송석을 준비하자.','c2-prepare',at('오전 9:50',{chars:['teacher','somi'],active:'teacher'}));
  line('c2-prepare','소미','선생님께 창고 열쇠를 받자. 집게와 집게봉을 챙기고, 순서표를 게시대에 고정하면 돼.','c2-partner',at('오전 9:50',{experiment:'playground',playground:'wind',prepare:true}));
  s['c2-partner'].choices[2].text='태오와 순서표가 잘 고정됐는지 확인한다.';
  s['c2-partner-jeongbok'].speaker='태오';s['c2-partner-jeongbok'].active='taeo';
  s['c2-partner-jeongbok'].line='집게 꽉 물렸지? 사진에 순서표도 보이게 들면 좋겠다. 잠깐만 빼서 들고 있을게.';
  s['c2-partner-jeongbok2'].line='선생님이 찍으실 때만 들자. 바람이 부니까 두 손으로 꼭 잡고.';
  s['c2-gust'].line='앗! 게시대에 고정해 뒀던 순서표를 사진에 들려고 꺼내다 놓쳤어. 깃발 끝이 향하는 쪽으로 밀려가!';
  s['c2-wind'].line='창고에서 챙긴 도구도 있어. 깃발을 살피고 운동장 그림에서 종이가 갈 곳을 눌러 보자.';
  s['c2-wind-after'].line='낮은 울타리에서 꺼내 다시 고정했어. 3번 은호, 4번 윤하나. 내 이름도 여기 있어.';
  s['c2-wind-after'].next='c2-race-ready';
  line('c2-race-ready','태오','난 방송석에서 응원을 녹음할게. 선생님은 바통 구역에서 사진 찍으신대. 하나야, 우리 목소리 듣고 달려!','c2-race',at('오전 10:20',{choices:[{text:'하나의 이름을 불러 응원한다.',branch:'c2-cheer-name'},{text:'순서표 옆에서 순서대로 응원한다.',branch:'c2-cheer-order'}]}));
  line('c2-cheer-name','윤하나','들려! 끝까지 크게 불러 줘.','c2-race',at('오전 10:20'));
  line('c2-cheer-order','태오','3번 은호, 다음은 4번 하나! 녹음기도 잘 돌아가고 있어.','c2-race',at('오전 10:20'));
  s['c2-race'].next='c2-baton-answer';
  line('c2-baton-answer','윤하나','받았어! 4번, 출발!','c2-erased',at('오전 10:20'));
  s['c2-erased'].next='c2-conflict-hana';
  line('c2-conflict-hana','윤하나','네가 나한테 바통 줬어. 내 손에 아직 있는데……. 순서표 4번도 아까 같이 읽었잖아.','c2-locker-intro',at('오전 10:24'));
  s['c2-locker-intro'].line='순서표 마지막 이름이 비었어. 선생님이 태오의 녹음테이프를 보관함에 넣으셨대. 확인해도 된다고 잠금을 풀어 주셨어.';
  s['c2-locker'].speaker='태오';s['c2-locker'].active='taeo';s['c2-locker'].line='내가 방송석에서 녹음했어. 보관함에서 테이프를 꺼내 녹음기에 넣어 보자.';
  s['c2-evidence'].line='3번 은호가 “하나야, 받아!”라고 했고 하나는 “받았어! 4번, 출발!”이라고 대답했어. 사진에서도 바통을 받는 행동을 확인해 보자.';
  s['c2-schedule-after'].line='잘 챙겼구나. 강당 대신 가까운 우리 교실에서 몸을 녹이자. 바깥 기구는 선생님들이 정리할 테니 나가지 마.';
  s['c2-confess'].line='미래 학교 영상에서 내 자리가 비어 있었어. 아까 은호도 내가 뛴 일을 잊었고. 앞으로도 계속 이럴까 봐 무서워.';
  s['c2-confess2'].line='눈앞에서 이야기해도 기억이 바뀌면…… 다시 말 걸 용기가 안 날 것 같아. 나를 또 모른다고 할까 봐.';
  s['c2-reassure'].choices=[{text:'“잊으면 다시 알려 줘. 그냥 지나가지는 않을게.”',branch:'c2-stay'},{text:'“아직 사진은 못 봤잖아. 같이 확인해 보자.”',branch:'c2-future'}];
  s['c2-stay'].line='혹시 또 이름이 안 떠오르면 물어볼게. 모르는 척하고 그냥 지나가지는 않을게. 종이도 계속 가지고 있을게.';
  s['c2-stay2'].line='응. 그때는 나도 다시 말해 볼게. 윤하나라고. 사진에도 너희 옆에 서고 싶어.';
  s['c2-future'].line='순서표와 녹음에는 함께 뛴 일이 남았어. 저녁에 사진도 보자. 그때까지 나랑 같이 있자.';
  s['c2-future2'].line='응. 아직 확인하지 못한 것도 있지. 지금 찍을 단체 사진에도 같이 남고 싶어.';
  s['c2-photo-intro'].line='경기 중 바통 사진과 지금 찍는 단체 사진은 따로야. 교실에서 얼굴이 안 가리게 서자. 필름은 선생님이 맡기신대.';
  s['c2-shutter'].line='여긴 우리 교실이지만 함께 있는 모습은 잘 보이겠구나. 하나야, 앞줄 가운데로. 얼굴 가리는 친구 없지? 좋아, 찍는다!';
  s['c2-face'].line='찍힌 사진은 저녁에 현상한 뒤 보는 거지? 내 얼굴도 잘 나왔으면 좋겠다. 나도 너희 이름을 적어 둘게.';
  s['c2-face'].next='c2-depart';
  line('c2-depart','강은호','사진 찾으러 가기 전에 학교에 두고 온 목도리를 가져올게. 보호자랑 같이 다녀올 거야. 선생님께도 말씀드렸어.','c2-depart-teacher',at('오후 5:30',room));
  line('c2-depart-teacher','1999년 담임','그래, 보호자와 함께 다녀오렴. 다른 친구들은 나와 사진관으로 가자. 여섯 시면 현상이 끝난다고 하셨다.','c2-night',at('오후 5:30',{...room,chars:['teacher','somi'],active:'teacher'}));
  const studio={backdrop:'photoStudio',chars:['taeo','somi','hana']};
  Object.assign(s['c2-night'],studio,{speaker:'태오',active:'taeo',time:'오후 6:00',line:'사진관에 도착했어! 선생님이 현상한 사진을 받으셨어. 하나 얼굴도 나왔네. 경기 사진은 기록하고 맞춰 보자.'});
  for(const id of ['c2-photo','c2-proof','c2-theft','c2-safe','c2-whistle','c2-deny','c2-last'])Object.assign(s[id],studio);
  s['c2-theft'].time='오후 6:12';s['c2-safe'].time='오후 6:12';
  s['c2-safe'].chars=['teacher','somi'];s['c2-safe'].active='teacher';
  s['c2-safe'].line='쫓아가지 마! 모두 내 옆에 있으렴. 주인아저씨, 경찰에 신고해 주세요. 원본 필름 봉투를 가져갔습니다.';
  s['c2-whistle'].line='열린 문 바로 안쪽에 호루라기가 떨어졌어. 은호가 쓰던 것과 닮았는데…… 같은 건지는 모르겠어. 밖으로 나가지는 말자.';
  s['c2-deny'].speaker='태오';s['c2-deny'].active='taeo';s['c2-deny'].line='은호는 목도리 찾으러 간 뒤 아직 안 왔지? 이것만으로 누구였다고 말할 수는 없어. 선생님께 보여 드리자.';
  s['c2-last'].line='필름은 없어졌지만 소미가 사진을, 네가 수첩을 갖고 있어. 나도 여기 있고. 남은 기록부터 함께 지키자.';
  for(const scene of Object.values(s)){
   if(scene.speaker==='윤하나'){scene.chars=scene.backdrop==='photoStudio'?['somi','hana']:['eunho','hana'];scene.active='hana';}
  }
  for(const id of ['c2-teacher','c2-hesitate','c2-record','c2-write-memory','c2-write-memory2','c2-write-today','c2-write-today2','c2-evening'])s[id].backdrop='staffroom';
  for(const id of ['c2-confess','c2-confess2','c2-reassure','c2-stay','c2-stay2','c2-future','c2-future2','c2-photo-intro','c2-shutter','c2-face'])s[id].backdrop='hall';
  s['c2-schedule-after'].line='잘 챙겼구나. 이제 강당에서 몸을 녹이자. 바깥 기구는 선생님들이 정리할 테니 나가지 마.';
  s['c2-photo-intro'].line='경기 중 바통 사진과 지금 찍는 단체 사진은 따로야. 강당 앞쪽에 얼굴이 안 가리게 서자. 필름은 선생님이 맡기신대.';
  s['c2-shutter'].line='하나야, 강당 앞줄 가운데로 와. 모두 얼굴 가리지 않게 조금씩 옆으로. 좋아, 찍는다!';
  // Filming-record investigation replaces the former sports sequence.
  const revised={
   'c2-event-plan':'선생님, 학교 소개 영상을 찍을 때 사진도 남기셨죠? 하나와 함께 있었다는 기록을 확인하고 싶어요.',
   'c2-event':'어제 촬영한 필름과 원고를 확인하자. 오늘은 빠진 학교 소개 부분만 짧게 찍겠다. 날씨가 나빠지면 바로 실내로 옮기자.',
   'c2-partner':'소개 원고에 우리 이름이 같이 있어. 내가 건네면 하나가 다음 부분을 읽기로 했지. 촬영 전에 기록부터 확인하자.',
   'c2-partner-eunho':'내가 원고를 건네고 하나가 소개하기. 이렇게 써 두니까 누가 무엇을 했는지 분명하네.',
   'c2-partner-hana':'내가 읽는 동안 이름도 불러 줘. 내 목소리가 녹음에 남는지 같이 확인하고 싶어.',
   'c2-partner-hana2':'윤하나, 학교 소개 준비됐나요? …이렇게 부르면 되지? 녹음기도 켜 둘게.',
   'c2-wind-after':'촬영 메모를 다시 고정했어. 원고를 건네는 은호, 다음 소개를 읽는 윤하나. 둘 다 적혀 있어.',
   'c2-race-ready':'난 옆에서 촬영 소리를 녹음할게. 선생님은 사진을 찍으신대. 원고와 목소리가 같은 순간인지 확인하자.',
   'c2-cheer-name':'내 이름 들렸어. 이제 소개를 시작할게.',
   'c2-cheer-order':'은호가 원고를 건네고 하나가 읽기. 준비됐어. 녹음도 시작했어.',
   'c2-race':'하나야, 소개 원고 받아. 나는 옆으로 비켜 줄게. 다음은 네가 읽는 부분이야.',
   'c2-baton-answer':'받았어. 다음은 내가 읽을게. 우리 학교 과학실에서는…',
   'c2-erased':'내가 혼자 끝까지 읽었나? …아니, 방금 원고를 누군가에게 건넸는데. 왜 다음 목소리가 생각 안 나지?',
   'c2-conflict-hana':'네가 나한테 원고를 줬어. 아직 내 손에 있잖아. 내가 읽는 것도 바로 옆에서 들었고…',
   'c2-evidence':'은호가 원고를 건넨 뒤 하나가 다음 부분을 읽었어. 녹음과 사진, 촬영 시각을 함께 확인하자.',
   'c2-confess':'미래 학교 영상에서 내 자리가 비어 있었어. 방금 은호도 내가 읽은 일을 잊었고. 앞으로도 계속 이럴까 봐 무서워.',
   'c2-future':'메모와 녹음에는 함께 촬영한 일이 남았어. 저녁에 사진도 보자. 그때까지 나랑 같이 있자.',
   'c2-photo-intro':'원고를 주고받던 사진과 지금 찍는 단체 사진은 따로야. 필름은 선생님이 맡기신대.',
   'c2-night':'사진관에 도착했어. 선생님이 현상한 사진을 받으셨어. 원고를 주고받던 순간을 촬영 기록과 맞춰 보자.',
   'c2-proof':'찾았어. 하나가 원고를 받던 순간이야. 사진은 내가, 이름과 시각을 옮긴 수첩은 네가 갖자.'
  };
  for(const [id,text] of Object.entries(revised))s[id].line=text;
  for(const scene of Object.values(s)){
   scene.label='2편 · 기록에 남은 목소리';
   for(const key of ['line'])scene[key]=scene[key].replaceAll('경기','촬영').replaceAll('순서표','촬영 메모').replaceAll('바통','원고').replaceAll('응원','이름 부르기').replaceAll('주자','소개 담당').replaceAll('결승선','촬영 자리').replaceAll('운동회','학교 소개 촬영');
   for(const choice of scene.choices||[])choice.text=choice.text.replaceAll('순서표','촬영 메모').replaceAll('응원 구호','소개 순서').replaceAll('응원','이름 부르기');
  }
  s['chapter2-start'].next='c2-voice-intro';
  line('c2-voice-intro','태오','하나야! …골대 뒤에서 대답한 것 같아. 그런데 저쪽이 뿌예.','c2-fog-intro',{...yesterday,time:'오전 11:46'});
  Object.assign(s['c2-fog-intro'],{...yesterday,time:'오전 11:47',speaker:'소미',active:'somi',chars:['taeo','somi'],line:'하나야, 거기 있어? …또 대답했어. 골대 뒤는 잘 안 보이네. 벤치에는 촬영 카메라가 놓여 있어. 방금까지 누가 여기 있었나 봐.'});
  for(const id of ['c2-fog','c2-fog-after'])Object.assign(s[id],{...yesterday,time:'오전 11:48',chars:['taeo','somi']});
  s['c2-fog'].line='선생님이 함께 가 주신대. 뛰어가지는 말자. 카메라에 남은 흔적부터 보고, 목소리가 들린 쪽을 확인하자.';
  s['c2-fog-after'].line='카메라를 닦아도, 맨눈으로 봐도 골대가 흐리네. 공기 중에 떠 있는 작은 물방울, 안개 때문이었어. 풀잎의 물방울은 표면에 붙어 있었고. 선생님과 골대 가까이 가자. 하나야, 우리 가고 있어!';
  s['c2-fog-after'].next='c2-search';
  s['c2-event'].next='c2-prepare-intro';
  s['c2-prepare-intro'].line='선생님이 촬영 장소를 확인하고 창고 열쇠를 주셨어. 메모를 고정할 집게와, 손이 안 닿을 때 쓸 긴 집게를 챙기자.';
  s['c2-cheer-name'].next='c2-cheer-name2';
  line('c2-cheer-name2','태오','잘 들려. 이번에는 녹음에도 이름이 남을 거야.','c2-race',{time:'오전 10:20'});
  s['c2-cheer-order'].next='c2-cheer-order2';
  line('c2-cheer-order2','소미','원고에 적힌 순서도 맞아. 선생님, 시작해 주세요.','c2-race',{time:'오전 10:20'});
  for(const scene of Object.values(s))scene.label='2편 · 기록에 남은 목소리';
  return s;
 }
 function restartFlags(flags){return Object.fromEntries(Object.entries(flags).filter(([key])=>key!=='hana-search'&&!key.startsWith('weather-')&&!key.startsWith('playground-')));}
 const api={build,restartFlags};if(typeof module!=='undefined')module.exports=api;root.Chapter2=api;
})(typeof window==='undefined'?globalThis:window);
