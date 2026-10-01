(function(root){
  'use strict';
  const talks={
    weatherBox:[['태오','저 하얀 상자는 새집이야? 문에 틈이 잔뜩 있네.'],['소미','백엽상이야. 햇빛과 비를 막고 바람은 통하게 해서 기온을 재는 곳이지. 기구는 건드리지 말자.']],
    bench:[['태오','앉으려니까 차가워! 여기 오래 기다렸으면 손도 얼었겠다.'],['소미','천 옆에 카메라가 놓여 있어. 누가 잠깐 자리를 비웠나 봐.']],
    school:[['태오','우리 교실 창문이 저기였지? 여기서 보니까 멀다.'],['소미','창문마다 반사돼서 안은 잘 안 보여. 선생님과 떨어져서 들어가지는 말자.']],
    tree:[['태오','가지에서 눈이 떨어졌어. 누가 움직인 줄 알았네.'],['소미','바람에 흔들린 거야. 나무 바로 아래는 피해서 걷자.']],
    hedge:[['태오','화단 안쪽도 볼게…… 발자국은 안 보여.'],['소미','가지에 옷이 걸릴 수 있어. 밖에서 눈으로만 살펴보자.']],
    fence:[['태오','울타리 너머로 돌아가면 빠르겠는데?'],['소미','넘지 말자. 선생님이 서로 보이는 곳에 있으라고 하셨어.']],
    bucket:[['태오','양동이에 얇은 얼음이 생겼어. 막대로 깨 볼까?'],['소미','그냥 두자. 남아 있던 물이 얼었나 봐. 바닥도 미끄러울 수 있겠어.']],
    cart:[['태오','작은 수레네. 바퀴가 눈 속에 반쯤 묻혔어.'],['소미','흙을 나르는 데 썼나 봐. 지금 밀면 길 한가운데 걸릴 테니 그대로 두자.']],
    cone:[['태오','이 고깔은 누가 세워 놓았지?'],['소미','여기로 가지 말라는 표시일 수도 있어. 옆으로 돌아가자.']],
    speakerBox:[['태오','저 스피커에서 갑자기 이름을 부르면 깜짝 놀라겠다.'],['소미','지금은 조용해. 바람 소리랑 사람 목소리를 잘 들어 보자.']],
    equipmentBox:[['태오','장비 상자 잠금쇠가 잠겨 있어. 안에서 달그락거리네.'],['소미','선생님 물건일 거야. 흔들지 말고 필요하면 허락을 받자.']],
    track:[['태오','운동장 선이 눈 밑에서 끊겨 보인다.'],['소미','선이 없어진 건 아니고 눈에 가린 거겠지. 사람도 앞에서 안 보인다고 없는 건 아닐 거야.']],
    arrival:[['태오','가까이 왔는데 골대 앞쪽에는 아무도 없네. 대답은 뒤에서 들렸지?'],['소미','응. 방송실에서 찾은 메모에도 골대 옆이라고 적혀 있었어. 선생님과 함께 뒤쪽을 확인하자. 하나야, 우리 왔어!']],
    sound:[['태오','하나야! 여기 있어?'],['윤하나','……은호도 왔어?'],['소미','골대 뒤에서 들렸어. 돌아가 보자.']],
    found:[['강은호','여기 있었구나. 그런데…… 미안, 우리가 아는 사이야?'],['윤하나','아까도 그렇게 물었어. 그래서 다시 부르기가 무서웠어.'],['소미','은호야, 아까 네가 잊지 않으려고 적어 둔 이름이 있어. 내가 꺼내 줄게. 같이 읽어 보자.']],
    uncertain:[['강은호','목소리는 낯설지 않은데…… 이름이 생각 안 나.'],['윤하나','억지로 아는 척 안 해도 돼. 그래도, 그냥 가지는 말아 줘.']],
    hana:[['윤하나','카메라를 챙겨서 교실로 가려다가…… 은호가 날 못 알아봐서 여기 앉아 있었어.'],['소미','우린 네 이름을 찾아서 온 거야. 은호도 다시 떠올릴 수 있는지 같이 해 보자.']],
    hanaNote:[['윤하나','내가 카메라 끈에 끼워 둔 쪽지야. 기다리다가 벤치에 두고 왔어. 챙겨 줘서 고마워.'],['소미','카메라는 선생님과 같이 가져가자. 쪽지는 우리가 보관하고 있을게.']],
    hanaName:[['윤하나','내 이름이다…… 지워지기 전에 적어 줬구나. 고마워.'],['소미','하나야, 은호에게도 같이 보여 주자. 네가 기억하는 이야기를 들으면 뭔가 떠오를지도 몰라.']],
    memory:[['강은호','윤하나…… 윤하나.'],['윤하나','촬영할 때 네가 식용유를 ‘식용우’라고 읽었잖아. 내가 웃어서 다시 찍었고.'],['강은호','……음머! 내가 소 흉내까지 냈지. 너 웃느라 원고 못 읽었잖아.'],['윤하나','맞아. 그 얘기, 나 말고 기억하는 사람이 생겼네.'],['소미','이름만 읽었을 때는 망설였는데, 그때 이야기를 들으니까 기억났구나. 종이는 버리지 말자.']],
    teacher:[['1999년 담임','하나야, 많이 놀랐겠다. 나와 교무실로 가자. 보호자께 연락하고 오늘 일을 함께 적어 두겠다.'],['윤하나','은호도 같이 가면 안 돼요? 또 못 알아볼까 봐…….'],['강은호','같이 갈게. 내가 또 멈칫하면 이 종이부터 보여 줘.']],
    earlyTeacher:[['1999년 담임','선생님은 골대 반대쪽을 확인하마. 너희는 서로 보이는 곳에서 같이 찾아보렴.'],['소미','네. 누가 대답하면 바로 말씀드릴게요.']],
    wrong:[['태오','종이를 여기 대는 건 아닌 것 같아. 구겨지겠어.'],['소미','그대로 갖고 있어. 이 이름을 잊어버린 친구에게 보여 주면 어떨까?']],
    ball:[['태오','공이 여기 있었네. 은호야, 네 거야?'],['강은호','응. 지금은 두자. 사람부터 찾아야지.']],
    shed:[['태오','문이 단단히 잠겨 있어. 똑똑…… 하나야, 안에 있어?'],['소미','대답이 없어. 문을 억지로 열지는 말자. 선생님께 여쭤보면 돼.']],
    radio:[['태오','마이크로 부르면 운동장 끝까지 들리지 않을까?'],['소미','전원 선이 빠져 있어. 젖은 땅에서 우리가 연결하지 말고, 선생님께 부탁하자.']],
    shelter:[['태오','지붕 아래는 눈이 덜 쌓였네. 여기서 기다렸을까?'],['소미','의자도 차갑고 아무도 없어. 촬영 쪽지에 적힌 장소와 비교해 보자.']],
    flag:[['태오','깃발만 펄럭여. 운동장이 조용하니까 소리가 더 크게 들린다.'],['소미','잠깐 조용히 있어 보자. 누가 대답하는지 들을 수 있게.']]
  };
  function initial(saved){
    const s={version:1,note:false,windChecked:false,heard:false,found:false,remembered:false,escorted:false,complete:false,selected:'',talk:'arrival',beat:0,detail:'',speaker:'소미',message:''};
    if(!saved||saved.version!==1)return s;
    for(const key of ['note','windChecked','heard','found','remembered','escorted','complete'])s[key]=saved[key]===true;
    s.found=s.found&&s.heard;s.remembered=s.remembered&&s.found;s.escorted=s.escorted&&s.remembered;s.complete=s.complete&&s.escorted;
    s.selected=['name','note'].includes(saved.selected)&&(saved.selected!=='note'||s.note)?saved.selected:'';
    s.talk=Object.hasOwn(talks,saved.talk)?saved.talk:'';
    s.beat=s.talk&&Number.isInteger(saved.beat)?Math.max(0,Math.min(saved.beat,talks[s.talk].length-1)):0;
    s.detail=saved.detail==='camera'?'camera':'';
    // Rebuild visible speech from authored content, never arbitrary save text.
    s.message=s.remembered?'선생님이 우리 쪽으로 오셨어. 하나와 같이 가자.':s.found?'은호를 눌러 말을 걸어 보자. 이름을 함께 읽으면 기억이 날지도 몰라.':s.heard?'골대 뒤쪽에서 목소리가 들렸어.': '약속한 골대 옆을 조금 더 살펴보자.';
    return s;
  }
  function act(state,action){
    const s={...state};
    function talk(id){s.talk=id;s.beat=0;s.detail='';return s;}
    if(action==='next'&&s.talk){
      if(s.beat+1<talks[s.talk].length)s.beat++;
      else {const done=s.talk;s.talk='';s.beat=0;
        if(done==='sound')s.heard=true;
        if(done==='memory')s.remembered=true;
        if(done==='teacher')s.escorted=true;
        s.speaker='소미';s.message=s.escorted?'하나도 일어났어. 함께 교무실로 가자.':s.remembered?'선생님이 우리 쪽으로 오셨어. 하나와 같이 가자.':s.found?'은호를 눌러 말을 걸어 보자. 이름을 함께 읽으면 기억이 날지도 몰라.':s.heard?'골대 뒤쪽에서 목소리가 들렸어.':'방송실에서 찾은 촬영 약속은 골대 옆이었어.';
      }return s;
    }
    if(s.talk)return s;
    if(action==='cloth'){s.selected='';s.detail='wind';s.speaker='소미';s.message='벤치의 천을 한쪽 끝만 잡아 들어 보자. 지금 깃발이 뻗은 쪽을 보면, 천의 끝은 화면의 어느 쪽으로 날릴까?';return s;}
    if(s.detail==='wind'&&action.startsWith('wind-')){
      if(action==='wind-right'){s.windChecked=true;s.detail='';s.message='오른쪽으로 날리네! 바람이 천을 미는 쪽과 깃발이 뻗은 쪽이 같아. 천은 다시 벤치에 놓아두자.';}
      else s.message='바람이 불어오는 쪽과 천이 밀려가는 쪽을 바꿔 생각했나 봐. 깃대에서 떨어진 깃발 끝을 다시 봐.';
      return s;
    }
    if(action==='stow'){s.selected='';return s;}
    if(action==='select-name'){s.selected='name';s.detail='';return s;}
    if(action==='select-note'&&s.note){s.selected='note';s.detail='';s.message='쪽지에는 ‘골대 옆에서 은호 기다리기’라고 적혀 있어. 그림에서 약속 장소를 눌러 비교해 보자.';return s;}
    if(action==='close'){s.detail='';return s;}
    if(action==='take-note'&&s.detail==='camera'){s.note=true;s.detail='';s.speaker='소미';s.message='쪽지는 따로 챙겼어. 카메라는 주인에게 물어보고 가져가자.';return s;}
    if(action==='finish'){if(s.escorted)s.complete=true;return s;}
    if(action==='eunho'&&s.found){
      if(s.selected==='name'){s.selected='';return talk('memory');}
      s.selected='';
      return talk('memory');
    }
    if(action==='hana'&&s.found){const id=s.selected==='name'?'hanaName':s.selected==='note'?'hanaNote':'hana';if(s.selected!=='name')s.selected='';return talk(id);}
    if(s.selected==='note'&&!s.found&&['goal','shed','shelter'].includes(action)){
      if(action==='goal'){s.selected='';return talk('sound');}
      s.speaker='소미';s.message=action==='shed'?'쪽지에는 골대 옆이라고 적혀 있어. 창고는 골대에서 멀고, 문도 잠겨 있네. 다른 곳과 비교해 보자.':'지붕은 있지만 골대 옆은 아니야. 쪽지의 약속 장소와 맞는 곳을 그림에서 골라 보자.';return s;
    }
    if(s.selected&&['goal','camera','ball','shed','flag','approach'].includes(action))return talk('wrong');
    if(action==='camera'){s.note=true;s.detail='camera';return s;}
    if(action==='goal')return talk(s.found?'uncertain':'sound');
    if(action==='approach'&&s.heard){s.found=true;return talk('found');}
    if(action==='teacher')return talk(s.remembered?'teacher':'earlyTeacher');
    if(['ball','shed','flag','radio','shelter','weatherBox','bench','school','tree','hedge','fence','bucket','cart','cone','speakerBox','equipmentBox','track'].includes(action))return talk(action);
    return s;
  }
  function speech(s){
    if(s.talk)return talks[s.talk][s.beat];
    if(s.detail==='wind')return [s.speaker,s.message];
    if(s.selected==='note'&&!s.found)return ['소미',s.message.includes('쪽지')?s.message:'쪽지에는 ‘골대 옆에서 은호 기다리기’라고 적혀 있어. 그림에서 약속 장소를 눌러 비교해 보자.'];
    if(s.selected)return ['소미',`${s.selected==='name'?'이름을 적은 종이':'촬영 쪽지'}를 꺼냈어. ${s.found?'누구에게 보여 줄까? 인물 아래의 ‘보여 주기’를 눌러 봐.':'보여 줄 사람을 찾으면 인물을 눌러 봐. 지금은 ‘다시 넣기’로 넣어 둘 수도 있어.'}`];
    return [s.speaker,s.message];
  }
  const api={initial,act,speech,talks};if(typeof module!=='undefined')module.exports=api;root.HanaSearch=api;
})(typeof window==='undefined'?globalThis:window);
