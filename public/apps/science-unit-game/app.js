"use strict";

const $ = (selector) => document.querySelector(selector);

const dom = {
  background: $("#background"),
  scanlines: $("#scanlines"),
  glitch: $("#glitch"),
  hud: $("#hud"),
  date: $("#dateChip"),
  time: $("#timeChip"),
  title: $("#titleScreen"),
  story: $("#storyScreen"),
  ending: $("#endingScreen"),
  playerName: $("#playerName"),
  btnStart: $("#btnStart"),
  btnContinue: $("#btnContinue"),
  sceneLabel: $("#sceneLabel"),
  propArea: $("#propArea"),
  characters: $("#characters"),
  choices: $("#choiceArea"),
  dialogue: $("#dialogue"),
  speaker: $("#speaker"),
  line: $("#line"),
  logPanel: $("#logPanel"),
  logList: $("#logList"),
  toast: $("#toast"),
  endingSummary: $("#endingSummary"),
  endingBadges: $("#endingBadges"),
};

const SAVE_KEY = "science1999PracticeSaveV1";

const initialState = () => ({
  playerName: "지우",
  scene: "storage-1",
  suspicion: 0,
  trust: { taeo: 0, somi: 0, eunho: 0 },
  flags: {
    watchedCarefully: false,
    tookTape: false,
    heldHands: false,
    hidPhone: false,
    toldSchoolName: false,
    noticedHana: false,
  },
  log: [],
  sound: true,
});

let state = initialState();
let typingTimer = null;
let currentLineDone = true;
let pendingNext = null;
let pendingReply = null;
let previewSession = false;
let audioContext = null;
let disposeExperiment = null;

const cast = {
  taeo: { name: "태오", className: "char-taeo" },
  somi: { name: "소미", className: "char-somi" },
  eunho: { name: "은호", className: "char-eunho" },
  teacher: { name: "1999년 담임", className: "char-teacher" },
  hana: { name: "윤하나", className: "char-hana", image: "assets/hana-first-meeting-v1.png" },
};

const scenes = {
  "storage-1": {
    label: "현재 · 과학실 창고",
    mode: "present",
    chars: ["taeo", "somi"], active: "taeo",
    speaker: "태오",
    line: "와, 여기 진짜 보물창고다. 비디오테이프에... 카세트에... 이건 설마 삐삐야?",
    next: "storage-2",
  },
  "storage-2": {
    label: "현재 · 과학실 창고",
    mode: "present",
    chars: ["taeo", "somi"], active: "somi",
    speaker: "소미",
    line: "보물이 아니라 먼지야. 잠깐, 이 상자에 우리 학교 이름이 적혀 있어.",
    prop: "tape",
    next: "tape-choice",
  },
  "tape-choice": {
    prop: "tape",
    label: "낡은 비디오테이프",
    mode: "present",
    chars: ["taeo", "somi"], active: "",
    speaker: "",
    line: "누렇게 바랜 라벨에는 '1999년 5학년 3반 - 2000년이 되기 전에 꼭 볼 것'이라고 적혀 있다.",
    next: "play-tape",
    choices: [
      { text: "라벨과 테이프 상태를 자세히 살펴본다.", branch: "tape-path-observe", feedbackSpeaker: () => state.playerName, feedbackType: "thought", feedback: "1999년 5학년 3반… 우리 반이랑 같네. 누가 찍은 영상이지?", effect: () => { state.flags.watchedCarefully = true; state.trust.somi += 1; addLog("단서", "테이프에는 1999년 5학년 3반이라고 적혀 있다. 촬영자는 아직 모른다."); } },
      { text: "일단 재생해 본다. 답은 영상 안에 있을 것이다.", branch: "tape-path-play", feedbackSpeaker: "태오", feedback: "좋아, 재생한다! 답은 영상 안에 있을 거야.", effect: () => { state.trust.taeo += 1; } },
      { text: "선생님께 먼저 보여 드리자고 한다.", branch: "tape-path-teacher", feedbackSpeaker: "소미", feedback: "문이 잠겼어... 결국 우리가 확인해야 하나 봐.", effect: () => { state.trust.somi += 1; addLog("생각", "선생님을 부르러 가려는 순간 과학실 문이 저절로 잠겼다."); } },
    ],
  },
  "tape-path-observe": {
    label: "낡은 테이프의 단서", mode: "present", chars: ["taeo", "somi"], active: "somi", speaker: "소미",
    line: "뒷면은 글씨가 지워져서 못 읽겠어. 테이프는 끊어지지 않았네. 옆 재생기로 확인해 볼까?", prop: "tape", next: "play-tape",
  },
  "tape-path-play": {
    label: "멈춘 비디오", mode: "present", chars: ["taeo", "somi"], active: "taeo", speaker: "태오",
    line: "어? 테이프가 한 번 튀어나왔어. 다시 넣으니까... 이제 돌아간다!", prop: "tape", next: "play-tape",
  },
  "tape-path-teacher": {
    label: "잠긴 과학실", mode: "present", chars: ["taeo", "somi"], active: "taeo", speaker: "태오",
    line: "문 너머에는 아무도 없어. 그런데 누가 '재생해'라고 말한 거지?", next: "play-tape",
  },
  "play-tape": {
    label: "현재 과학실 · 화면 안은 1999년 12월 31일의 녹화 영상",
    mode: "video",
    scanlines: true,
    chars: [],
    speaker: "화면 속 아이",
    line: "치지직… 나는 강은호야. 지금은 1999년 12월 31일 밤. 이 테이프를 보고 있을 너희에게 남기는 말이야.",
    prop: "screen",
    next: "name-reveal",
  },
  "name-reveal": {
    label: "재생 중 · 1999.12.31",
    mode: "video",
    scanlines: true,
    chars: [],
    speaker: "어린 은호",
    line: () => `${state.playerName}, 태오, 소미. 너희 셋이 맞지? 시간이 없어. 잘 들어.`,
    prop: "screen",
    glitch: true,
    next: "reaction-choice",
  },
  "reaction-choice": {
    label: "현재 · 과학실",
    mode: "video",
    scanlines: true,
    chars: ["taeo", "somi"], active: "taeo",
    speaker: "태오",
    line: () => `방금... 화면 속 애가 ${state.playerName} 네 이름을 부른 거 맞지?`,
    next: "warning",
    choices: [
      { text: "영상을 멈추고 화면 속 단서를 확인한다.", feedbackSpeaker: "소미", feedback: "잠깐! 칠판에 1999년 12월 31일이라고 적혀 있어.", effect: () => { state.flags.watchedCarefully = true; state.trust.somi += 1; addLog("단서", "칠판에는 1999년 12월 31일, 책상 위에는 얼굴이 번진 사진이 있다."); } },
      { text: "끝까지 봐야 해. 계속 재생한다.", feedbackSpeaker: "태오", feedback: "그래, 끝까지 보자. 분명 더 할 말이 있을 거야.", effect: () => { state.trust.taeo += 1; } },
      { text: "누가 우리를 놀리는 거라고 말한다.", feedbackSpeaker: () => state.playerName, feedbackType: "thought", feedback: "장난이라기엔 우리 이름을 너무 정확히 알고 있어.", effect: () => { state.suspicion += 1; } },
    ],
  },
  "warning": {
    label: "재생 중 · 1999.12.31",
    mode: "video",
    scanlines: true,
    chars: [],
    speaker: "어린 은호",
    line: "너희가 도착할 날은 1999년 12월 28일이야. 사흘 뒤, 12월 31일 자정에 통로가 닫혀. 그때까지 하나를 찾아. 마지막 종이 울릴 때는…",
    prop: "screen",
    next: "warning-reaction",
  },
  "warning-reaction": {label:"현재 · 녹화 영상이 멈춘 과학실",mode:"present",chars:["taeo","somi"],active:"somi",speaker:"소미",line:"우리 시계는 오후 4시 44분이야. 자정은 영상 속 1999년 얘기고. 그런데 ‘도착할 날’이라니… 우리가 거기로 간다는 말이야?",next:"blackout"},
  "blackout": {
    label: "현재 · 오후 4:44",
    mode: "blackout",
    chars: [],
    speaker: "",
    line: "툭. 영상이 끊기고 과학실의 모든 불이 꺼졌다. 어둠 속에서 학교 종이 울린다. 뎅-.",
    glitch: true,
    next: "bell-choice",
  },
  "bell-choice": {
    label: "두 번째 종이 울리기 전",
    mode: "blackout",
    chars: ["taeo", "somi"], active: "somi",
    speaker: "소미",
    line: () => `${state.playerName}! 바닥이 흔들려. 뭔가 해야 해!`,
    next: "bells",
    choices: [
      { text: "비디오테이프를 챙긴다.", feedbackSpeaker: () => state.playerName, feedbackType: "thought", feedback: "이 테이프를 놓치면 안 돼!", effect: () => { state.flags.tookTape = true; addLog("소지품", "1999년 비디오테이프를 챙겼다."); } },
      { text: "태오와 소미의 손을 잡는다.", feedbackSpeaker: "소미", feedback: "절대 손 놓지 마! 같이 있어야 해!", effect: () => { state.flags.heldHands = true; state.trust.taeo += 1; state.trust.somi += 1; } },
      { text: "과학실 문을 힘껏 두드린다.", feedbackSpeaker: "의문의 목소리", feedback: "늦었어...", effect: () => { state.suspicion += 1; addLog("기억", "문 너머에서 누군가 '늦었어'라고 속삭였다."); } },
    ],
  },
  "bells": {
    label: "시간 불명",
    mode: "blackout",
    chars: [],
    speaker: "",
    line: "뎅-. 두 번째 종. 교실 바닥이 나무로 바뀐다. 뎅-. 세 번째 종. 먼지 냄새가 분필 냄새로 변한다. 그리고 네 번째 종이 울렸다.",
    glitch: true,
    next: "arrival-check",
  },
  "arrival-check": {"label":"낯선 교실 · 친구 확인","mode":"past","time":"오전 9:00","date":"날짜 확인 중","chars":["taeo","somi"],"active":"taeo","speaker":"태오","line":"소미야, 괜찮아? 분명 아까는 저녁이었는데… 창밖이 왜 밝아? 과학실 책상은 다 어디 갔어?","next":"arrival-evidence"},
  "arrival-evidence": {"label":"낯선 교실 · 날짜 확인","mode":"past","time":"오전 9:01","date":"1999년 12월 28일","chars":["taeo","somi"],"active":"somi","speaker":"소미","line":"칠판에 1999년 12월 28일이라고 적혀 있어. 달력도 같은 해고… 창밖을 봐. 우리 체육관이 있던 자리가 운동장이야. 촬영 세트라기엔 밖까지 달라졌어.","next":"arrival-phone"},
  "arrival-phone": {"label":"낯선 교실 · 연락 시도","mode":"past","time":"오전 9:02","date":"1999년 12월 28일","chars":["taeo","somi"],"active":"taeo","speaker":"태오","line":"엄마한테 전화할래. …연결이 안 돼. 날짜는 그대로인데 통신이 안 잡혀. 이거 꿈이면 좋겠어. 우리 집에는 갈 수 있는 거지?","next":"arrival-return"},
  "arrival-return": {"label":"복도 · 돌아갈 길 확인","mode":"past","time":"오전 9:03","date":"1999년 12월 28일","chars":["taeo","somi"],"active":"somi","speaker":"소미","line":"왔던 문을 다시 열어 봤는데 과학실이 아니야. 복도 안내판도 옛날 모습이고. 아직 확실하진 않지만… 테이프 속 은호가 뭔가 알 것 같아.","next":"arrival-plan"},
  "arrival-plan": {"label":"셋만의 약속","mode":"past","time":"오전 9:05","date":"1999년 12월 28일","chars":["taeo","somi"],"active":"taeo","speaker":"태오","line":"그럼 그 아이부터 찾자. 혼자 돌아다니지 말고 셋이 같이. 누가 물으면 일단 길을 잃었다고 하자. 나 지금 과거에서 왔다고 설명할 자신 없어.","next":"arrival-notice"},
  "arrival-notice": {"label":"복도 · 우리를 기다리던 선생님","mode":"past","time":"오전 9:07","date":"1999년 12월 28일","chars":["teacher","somi"],"active":"teacher","speaker":"1999년 담임","line":"여기 있었구나. 전학 통지서에 적힌 세 학생 맞지? 교실을 못 찾았니? 이름을 확인하고 선생님 따라오렴.","next":"arrival-whisper"},
  "arrival-whisper": {"label":"교실 문 앞 · 전학 통지서","mode":"past","time":"오전 9:08","date":"1999년 12월 28일","chars":["taeo","somi"],"active":"somi","speaker":"소미","line":"우리가 오기도 전에 우리 이름이 적혀 있었어… 왜지? 우선 전학생인 척하자. 교실에서 은호를 찾고, 쉬는 시간에 저 서류도 확인해 보자.","next":"past-wake"},
  "past-wake": {
    label: "1999년 12월 28일 화요일",
    mode: "past",
    date: "1999년 12월 28일",
    time: "오전 9:10",
    chars: ["teacher", "taeo", "somi"], active: "teacher",
    speaker: "1999년 담임",
    line: () => `자, 조용. 오늘부터 우리 반에서 함께 지낼 전학생들이란다. ${state.playerName}, 태오, 소미. 인사하렴.`,
    next: "intro-choice",
  },
  "intro-choice": {
    label: "1999년 · 5학년 3반",
    mode: "past",
    chars: ["teacher", "taeo", "somi"], active: "",
    speaker: "",
    line: "교실의 모든 학생이 우리를 바라본다. 어떻게 소개할까?",
    next: "eunho-first",
    choices: [
      { text: "“멀리 있는 학교에서 왔습니다. 잘 부탁드립니다.”", branch: "intro-path-safe", feedbackSpeaker: "강은호", feedback: "멀리 있는 학교? 그런데 왜 이렇게 낯이 익지?", effect: () => { state.trust.somi += 1; } },
      { text: "현재 학교 이름을 그대로 말한다.", branch: "intro-path-name", feedbackSpeaker: "1999년 담임", feedback: "그게 바로 이 학교 이름인데? 긴장했나 보구나.", effect: () => { state.flags.toldSchoolName = true; state.suspicion += 2; } },
      { text: "태오에게 먼저 인사하라고 떠민다.", branch: "intro-path-taeo", feedbackSpeaker: "태오", feedback: "저희는 인터넷이 아주 느린 시골에서... 아, 아니에요!", effect: () => { state.trust.taeo += 1; } },
    ],
  },
  "intro-path-safe": {
    label: "1999년 · 5학년 3반", mode: "past", chars: ["eunho", "taeo", "somi"], active: "eunho", speaker: "강은호",
    line: "어느 동네인지는 말 안 하네. 좋아, 내가 직접 알아내주지.", next: "eunho-first",
  },
  "intro-path-name": {
    label: "1999년 · 5학년 3반", mode: "past", chars: ["teacher", "taeo", "somi"], active: "somi", speaker: "소미",
    line: () => `${state.playerName}, 우리 학교가 1999년에도 같은 이름이야. 이상하지 않아?`, next: "eunho-first",
  },
  "intro-path-taeo": {
    label: "1999년 · 웃음바다가 된 교실", mode: "past", chars: ["eunho", "taeo", "somi"], active: "eunho", speaker: "강은호",
    line: "인터넷? 학교 전산실에서만 쓰는 건데. 너희 진짜 어디서 왔어?", next: "eunho-first",
  },
  "school-name": {
    label: "1999년 · 5학년 3반",
    mode: "past",
    chars: ["teacher", "taeo", "somi"], active: "teacher",
    speaker: "1999년 담임",
    line: "그게 바로 이 학교 이름인데? 긴장해서 잘못 말했나 보구나.",
    next: "eunho-first",
  },
  "taeo-intro": {
    label: "1999년 · 5학년 3반",
    mode: "past",
    chars: ["teacher", "taeo", "somi"], active: "taeo",
    speaker: "태오",
    line: "저희는... 인터넷이 아주 느린 시골에서 왔습니다! 아, 인터넷이 아니라... 그게...",
    next: "eunho-first",
  },
  "eunho-first": {
    label: "1999년 · 첫 수업 시작",time:"오전 9:10",
    mode: "past",
    chars: ["eunho", "taeo", "somi"], active: "eunho",
    speaker: "강은호",
    line: "내 옆자리 비었어. 교과서 아직 없지? 같이 봐. 선생님 오신다. 궁금한 건 쉬는 시간에 물어볼게.",
    next: "lesson-whisper",
  },
  "lesson-whisper": {label:"1999년 · 수업 중",mode:"past",time:"오전 9:15",chars:["somi","taeo"],active:"somi",speaker:"소미",line:"지금 나가면 눈에 띄어. 일단 수업이 끝날 때까지 기다리자. 옆자리 아이, 영상에서 본 은호가 맞는지도 확인해야 해.",next:"lesson-wait"},
  "lesson-wait": {label:"1999년 · 수업이 이어지는 동안",mode:"past",time:"오전 9:35",chars:["taeo","somi"],active:"taeo",speaker:"태오",line:"칠판 글씨는 베꼈는데 하나도 머리에 안 들어와. 집에서는 우리가 없어진 걸 알까? …종 치면 은호한테 방송실 위치부터 물어보자.",next:"lesson-bell"},
  "lesson-bell": {label:"1999년 · 수업 종료 종",mode:"past",time:"오전 9:50",chars:["teacher","eunho"],active:"teacher",speaker:"1999년 담임",line:"오늘 수업은 여기까지. 십 분 쉬고 연말 행사 준비를 하자. 은호는 새 친구들에게 교실을 안내해 주렴.",next:"break-start"},
  "break-start": {label:"1999년 · 쉬는 시간",mode:"past",time:"오전 9:50",chars:["eunho","taeo","somi"],active:"eunho",speaker:"강은호",line:"이제 말해도 돼. 아까 내 이름 듣고 놀라던데, 나랑 만난 적 있어?",next:"phone-choice"},
  "phone-choice": {
    label: "1999년 · 쉬는 시간",
    mode: "past",
    chars: ["eunho", "taeo", "somi"], active: "eunho",
    speaker: "강은호",
    line: "그리고 네 주머니에서 아까 빛난 건 뭐야?",
    next: "teacher-slip",
    choices: [
      { text: "고장 난 전자수첩이라고 둘러댄다.", branch: "phone-path-organizer", feedbackSpeaker: "강은호", feedback: "그래? 아까부터 꺼냈다 넣었다 하길래. 연락을 기다리는 줄 알았어.", effect: () => { state.flags.hidPhone = true; state.trust.eunho += 1; } },
      { text: "미래에서 온 휴대전화라고 솔직하게 말한다.", branch: "phone-path-future", feedbackSpeaker: "강은호", feedback: "미래? 하하! 너희 거짓말 진짜 못한다. 그런데 방금 왜 흔들렸지?", effect: () => { state.suspicion += 3; triggerGlitch(); addLog("시간 이상", "미래를 말하자 현재 학교 명찰의 글자가 잠깐 사라졌다."); } },
      { text: "정복이라는 아이가 맡긴 물건이라고 거짓말한다.", branch: "phone-path-jeongbok", feedbackSpeaker: "강은호", feedback: "정복이라면 벌써 전교생한테 자랑했을 텐데. 수상한데...", effect: () => { state.suspicion += 1; } },
    ],
  },
  "phone-path-organizer": {
    label: "1999년 · 수상한 전자수첩", mode: "past", chars: ["eunho", "taeo", "somi"], active: "taeo", speaker: "태오",
    line: "화면이 자꾸 꺼져서. 일단 넣어 둘게. …그런데 너 방송실 알아? 사람 하나를 찾고 있어.", next: "teacher-slip",
  },
  "phone-path-future": {
    label: "1999년 · 흔들린 시간", mode: "past", chars: ["eunho", "taeo", "somi"], active: "somi", speaker: "소미", glitch: true,
    line: () => `${state.playerName}, 휴대전화 날짜가 잠깐 1999년으로 바뀌었어. 미래를 말하면 시간이 반응하나 봐.`, next: "teacher-slip",
  },
  "phone-path-jeongbok": {
    label: "1999년 · 옆자리에서 들려온 목소리", mode: "past", chars: ["eunho", "taeo", "somi"], active: "", speaker: "박정복",
    line: "뭐가 내 물건이야? 난 저런 거 처음 보는데!", next: "jeongbok-apology",
  },
  "jeongbok-apology": {
    mode:"past",chars:["eunho","taeo","somi"],active:"",speaker:()=>state.playerName,
    line:"아하하… 내가 이름을 착각했나 봐. 갑자기 네 이름을 꺼내서 미안.",next:"jeongbok-response",
  },
  "jeongbok-response": {
    mode:"past",chars:["eunho","taeo","somi"],active:"eunho",speaker:"강은호",
    line:"방금은 정복이가 맡겼다며? …알았어. 말하기 곤란하면 넣어 둬. 대신 또 남의 이름 대지는 말고.",next:"phone-change-topic",
  },
  "phone-change-topic": {
    mode:"past",chars:["eunho","taeo","somi"],active:"somi",speaker:"소미",
    line:"응, 일단 넣자. 은호야, 사실 우리도 이상한 일이 있어서 그래. 아까 선생님이 우리를 소개하셨을 때 말이야…",next:"teacher-slip",
  },
  "eunho-tease": {
    label: "1999년 · 쉬는 시간",
    mode: "past",
    chars: ["eunho", "taeo", "somi"], active: "eunho",
    speaker: "강은호",
    line: "고장 났으면 일단 넣어 둬. 너희 아까부터 많이 불안해 보여. 무슨 일 있어?",
    next: "teacher-slip",
  },
  "eunho-phone": {
    label: "1999년 · 쉬는 시간",
    mode: "past",
    chars: ["eunho", "taeo", "somi"], active: "eunho",
    speaker: "강은호",
    line: "미래? 푸하하! 너희, 거짓말은 잘 못하는구나. 그런데... 방금 왜 교실이 흔들렸지?",
    next: "teacher-slip",
  },
  "jeongbok-lie": {
    label: "1999년 · 쉬는 시간",
    mode: "past",
    chars: ["eunho", "taeo", "somi"], active: "eunho",
    speaker: "강은호",
    line: "박정복이? 걔가 저런 걸 가졌으면 벌써 전교생한테 자랑했을 텐데. 수상한데...",
    next: "teacher-slip",
  },
  "teacher-slip": {
    label: "1999년 · 쉬는 시간",
    mode: "past",
    chars: ["eunho", "somi"], active: "somi",
    speaker: "소미",
    line: "영상 속 아이랑 이름도, 얼굴도 같아… 저기, 선생님… 아니 은호야! 아까 선생님이 우리 이름을 이미 알고 계셨어. 출석부에도 있는지 같이 봐 줄래?",
    next: "eunho-reaction",
  },
  "eunho-reaction": {
    label: "1999년 · 쉬는 시간",
    mode: "past",
    chars: ["eunho", "somi"], active: "eunho",
    speaker: "강은호",
    line: "서, 선생님? 내가? 너희 진짜 어디서 왔어?",
    next: "roster",
    choices: [
      { text: "“아무것도 아니야. 잘못 불렀어.”", feedbackSpeaker: "강은호", feedback: "흠... 아직 수상하지만, 일단 출석부부터 보자.", effect: () => { state.trust.eunho += 1; } },
      { text: "“너, 커서 선생님이 돼.”", feedbackSpeaker: "강은호", feedback: "내가 선생님? 그건 미래가 망했다는 뜻 아니야?", effect: () => { state.suspicion += 2; triggerGlitch(); } },
      { text: "출석부 쪽으로 화제를 돌린다.", feedbackSpeaker: "소미", feedback: "그 얘기는 나중에! 우선 출석부부터 보여 줘.", effect: () => { state.trust.somi += 1; } },
    ],
  },
  "future-teacher": {
    label: "1999년 · 쉬는 시간",
    mode: "past",
    chars: ["eunho", "somi"], active: "eunho",
    speaker: "강은호",
    line: "내가 선생님이 된다고? 그건 진짜 미래가 망했다는 뜻 아니야?",
    next: "roster",
  },
  "roster": {
    label: "1999년 · 5학년 3반 출석부",
    mode: "past",
    chars: [],
    speaker: "소미",
    line: () => `${state.playerName}, 이것 봐. 우리 이름이... 오늘 적힌 글씨가 아니야. 오래전부터 여기 있었던 것처럼 바래 있어.`,
    prop: "roster",
    next: "roster-investigate",
  },
  "roster-investigate": {label:"1999년 · 책상에 남은 기록",mode:"past",chars:[],speaker:"소미",line:"출석부와 다른 기록을 비교해 보자.",experiment:"clues",next:"hana-name"},
  "hana-name": {
    label: "1999년 · 5학년 3반 출석부",
    mode: "past",
    chars: [],
    speaker: "소미",
    line: "윤하나… 이름을 말하니까 8번 칸에 글씨가 잠깐 돌아왔어. 그런데 또 흐려져! 은호야, 이 친구 어디 있어?",
    prop: "roster-hana",
    glitch: true,
    next: "empty-desk",
  },
  "empty-desk": {
    label: "1999년 · 주인 없는 책상", mode: "past", chars: ["eunho", "somi"], active: "somi", speaker: "소미",
    line: "방금 여기 이름이 있었어. 윤하나라고. 그런데 저 빈 책상… 가방은 그대로 있네?", next: "eunho-forgets",
  },
  "eunho-forgets": {
    label: "1999년 · 주인 없는 책상", mode: "past", chars: ["eunho", "taeo"], active: "eunho", speaker: "강은호",
    line: "윤… 누구? 우리 반에 그런 애 없는데. 이상하다. 저 가방은 매일 봤던 것 같은데.", next: "pager-message",
  },
  "pager-message": {
    label: "1999년 · 삐삐에 도착한 문자", mode: "past", chars: [], speaker: "소미",
    line: "가방에 달린 삐삐가 울렸어. ‘방송실로 와. 은호한테는 말하지 마.’ 누가 우리를 보고 있는 거야?", prop: "pager", next: "end",
  },
  "chapter1-start": {
    label: "1편 · 방송실에 없는 방송부원", mode: "past", chars: ["taeo", "somi"], active: "taeo", speaker: "태오",
    line: "은호한테 말하지 말라는데… 은호가 우리 뒤에 있으면 어떡해?", next: "hallway-eunho",
  },
  "hallway-eunho": {
    label: "1999년 · 방송실 앞", mode: "past", chars: ["eunho", "taeo"], active: "eunho", speaker: "강은호",
    line: "나 들었거든? 방송실 구경 가는 거지? 따라와. 근데 문 앞에 선생님이 계시네.", next: "festival-reason",
  },
  "festival-reason": {label:"방송실 앞 · 행사 준비",mode:"past",chars:["teacher","somi"],active:"teacher",speaker:"1999년 담임",line: "방송실은 점검 중이란다. 학교생활 소개 영상에 넣을 우리 반 작품이 여기 있구나. 촬영은 선생님이 맡고, 하나와 은호가 과학 수업을 소개했지.",next:"festival-clue"},
  "festival-clue": {label:"배경판에 적힌 같은 이름",mode:"past",chars:["taeo","somi"],active:"somi",speaker:"소미",line: "윤하나… 뒤에 이름이 남아 있어! 은호야, 이 글씨 봐. 아까는 모르는 아이라고 했잖아. 이 그림은 기억나?",next:"festival-help"},
  "festival-help": {
    label: "1999년 · 행사 준비 교실", mode: "past", chars: ["teacher", "somi"], active: "teacher", speaker: "1999년 담임",
    line: "둘이 같이 만든 모래 그림이란다. 엎질러진 재료를 나눠 빈 곳을 맞추면 촬영 때 모습과 비교할 수 있겠구나. 먼지가 나니 마스크부터 쓰렴.", next: "sand-problem",
  },
  "sand-problem": {
    label: "1999년 · 모래 그림 준비", mode: "past", chars: ["taeo", "somi"], active: "taeo", speaker: "태오",
    line: "은호가 방금 뭐라고 하려다 멈췄어. 이름까지 잊기 전에 그림부터 맞춰 보자. 내가 큰 돌을 살펴볼게.", next: "hana-work-note",
  },
  "hana-work-note": {label:"1999년 · 배경판 뒤의 연필 글씨",mode:"past",chars:["somi","eunho"],active:"somi",speaker:"소미",line: "뒤에 ‘학교생활 소개 영상 · 우리 반 과학 시간’이라고 적혀 있어. 그림을 든 은호 옆에 하나가 서 있었대. 선생님이 찍은 사진도 있나 봐.",next:"work-note-reason"},
  "work-note-reason": {label:"1999년 · 이어받은 작업",mode:"past",chars:["eunho","taeo"],active:"eunho",speaker:"강은호",line: "내가 이걸 들었다고? 잠깐… 누가 기울어졌다고 웃었는데. 목소리도 이름도 자꾸 놓쳐. 그 종이, 치우지 말아 줘.",next:"sand-plan"},
  "sand-plan": {
    label: "1999년 · 모래와 자갈 관찰", mode: "past", chars: ["somi", "eunho"], active: "somi", speaker: "소미",
    line: "먼저 세 재료가 어떻게 다른지 보자. 큰 자갈부터 따로 모으고, 남은 두 재료를 나누면 덜 헷갈리겠어. 어떤 체를 쓸지는 직접 비교해 보자.", next: "sand-lab",
  },
  "sand-lab": {
    label: "직접 해 보기 · 모래와 자갈 분리", mode: "past", chars: [], speaker: "소미", line: "체 눈 크기를 고르고 흔들어 봐.", experiment: "sieve", next: "sand-result",
  },
  "sand-result": {
    label: "1999년 · 준비가 끝난 모래", mode: "past", chars: ["taeo", "somi"], active: "taeo", speaker: "태오",
    line: "사진 속 그림이랑 같아졌어. 은호야, 받침 옆에 손자국 봐. 네가 잡았던 자리가 여기였어?", next: "sand-explain",
  },
  "sand-explain": {
    label: "1999년 · 모래 그림 준비", mode: "past", chars: ["somi", "eunho"], active: "somi", speaker: "소미",
    line: "윤하나. 이름을 여기에도 적었어. 은호야, 소리 내서 읽어 봐. 아까 무슨 말을 하려던 거야?", next: "hana-credit",
  },
  "hana-credit": {
    label: "1999년 · 배경판 뒷면", mode: "past", chars: ["eunho", "somi"], active: "eunho", speaker: "강은호",
    line: "윤하나… 맞아, 하나가 그림 뒤에 숨어서 설명했어. 방금 전엔 이름조차 몰랐는데! 그런데 얼굴은… 왜 안 떠오르지?", next: "broadcast-call",
  },
  "broadcast-call": {
    label: "1999년 · 갑자기 켜진 교실 스피커", mode: "past", chars: [], speaker: "스피커 속 목소리",
    line: "내 이름을 기억하는 사람이 있다면… 방송실의 학교생활 소개 테이프를 봐 줘. 내가 어디까지 갔는지 거기 남겨 뒀어. 부탁이야.", next: "broadcast-arrive",
  },
  "broadcast-arrive": {label:"1999년 · 방송실 앞",time:"오전 10:30",mode:"past",chars:["teacher","eunho"],active:"teacher",speaker:"1999년 담임",line:"점검 끝났다. 들어와도 좋아. 방금 방송? 녹음 테이프 시험 재생을 했는데… 누가 너희를 불렀니?",next:"broadcast-empty"},
  "broadcast-empty": {label:"1999년 · 빈 방송실",time:"오전 10:30",mode:"past",chars:["taeo","somi"],active:"taeo",speaker:"태오",line: "방금 그 목소리가 녹음이라고? 하나는 여기 없어! 테이프부터 찾자. 은호가 또 잊기 전에.",next:"broadcast-desk"},
  "broadcast-desk": {label:"1999년 · 방송부 작업대",time:"오전 10:30",mode:"past",chars:["somi","eunho"],active:"somi",speaker:"소미",line: "학교생활 소개 영상 원고야. 모래 그림 다음은 물과 식용유 실험병, 그다음은 소금과 모래. 우리 반 과학 수업을 차례로 소개했어.",next:"oil-reason"},
  "oil-reason": {label:"1999년 · 물과 식용유 실험병",time:"오전 10:30",mode:"past",chars:["eunho","taeo"],active:"eunho",speaker:"강은호",line: "물과 식용유가 든 실험병이야. 기울여도 두 층이 생겨. 내가 이걸 들고 설명했는데… 원고엔 두 액체를 따로 받았다고 적혀 있어. 어디서 바꿨더라?",next:"oil-safety"},
  "oil-safety": {label:"1999년 · 촬영 기록 확인",time:"오전 10:30",mode:"past",chars:["teacher","somi"],active:"teacher",speaker:"1999년 담임",line: "촬영 장면과 이 원고가 맞는지 확인하려는 거구나. 액체는 과학실에서 선생님과 다루자. 나는 다른 선생님들께 그 아이를 보셨는지도 물어보마.",next:"oil-lab"},
  "oil-lab": {label:"직접 해 보기 · 물과 식용유",time:"오전 10:40",mode:"past",chars:[],speaker:"소미",line:"섞이지 않는 두 층을 관찰해 보자.",experiment:"oil",next:"oil-memory"},
  "oil-memory": {label:"1999년 · 대여표 뒷면",time:"오전 10:50",mode:"past",chars:["eunho","somi"],active:"eunho",speaker:"강은호",line: "원고 뒤에 하나 말이 있어. ‘은호야, 천천히 기울여 봐.’ …생각났어! 내가 병을 들고, 하나가 설명했어. 끝나고 선생님이 다음 장소로 나오라고 하셨는데.",next:"oil-question"},
  "oil-question": {label:"1999년 · 떠오른 약속",time:"오전 10:50",mode:"past",chars:["somi","eunho"],active:"somi",speaker:"소미",line:"기억이 돌아온 거야? 그럼… 하나의 얼굴도 떠올라?",next:"oil-answer"},
  "oil-answer": {label:"1999년 · 끊긴 기억",time:"오전 10:50",mode:"past",chars:["eunho","somi"],active:"eunho",speaker:"강은호",line:"아니. 목소리랑 그날 했던 말은 들리는데, 얼굴이 있던 자리만 뿌옇게 비어 있어. 내가 일부러 잊은 것도 아닌데….",next:"oil-link"},
  "oil-link": {label:"1999년 · 물건에 남은 기억",time:"오전 10:51",mode:"past",chars:["somi","eunho"],active:"somi",speaker:"소미",line: "이름을 읽었을 때 기억이 조금 돌아왔고, 녹음 속 말과 물건을 맞추니 그때 일이 떠오른 거야. 실험만 하면 기억이 돌아오는 건 아니네. 다음 원고도 확인하자.",next:"salt-reason"},
  "salt-reason": {label:"1999년 · 소금·모래 실험 재료 상자",time:"오전 10:53",mode:"past",chars:["taeo","somi"],active:"taeo",speaker:"태오",line: "마지막 원고는 소금과 모래야. 상자 속 재료도 똑같아. 이 장면을 찍고 어디로 갔는지, 원고가 뒤섞여서 순서를 모르겠어.",next:"salt-plan"},
  "salt-plan": {label:"1999년 · 과학준비실 입구",time:"오전 10:54",mode:"past",chars:["teacher","somi"],active:"teacher",speaker:"1999년 담임",line:"옆 준비실 서랍에 도구가 있단다. 공용 열쇠를 창가 재료 접시에 떨어뜨렸어. 필요한 도구만 챙겨 오렴. 선생님은 여기 작업대에서 기다릴게. 가열은 내가 맡는다.",next:"room-supplies"},
  "room-supplies": {label:"과학준비실 · 실험 도구 찾기",time:"오전 10:55",mode:"past",chars:[],speaker:"소미",line:"창가부터 살펴보자.",experiment:"room",roomMode:"supplies",next:"supplies-return"},
  "supplies-return": {label:"1999년 · 과학실 작업대",time:"오전 10:59",mode:"past",chars:["teacher","somi"],active:"teacher",speaker:"1999년 담임",line: "비커는 여기 내려놓으렴. 원고의 어느 설명이 실제 결과와 맞는지 확인해 보자. 방법은 너희가 정하고, 가열은 선생님이 할게.",next:"salt-lab"},
  "salt-lab": {label:"직접 해 보기 · 소금과 모래",time:"오전 11:00",mode:"past",chars:[],speaker:"소미",line:"물에 넣었을 때 두 재료가 어떻게 달라지는지 보자.",experiment:"salt",next:"salt-after"},
  "salt-after": {label:"1999년 · 식힌 소품 재료",time:"오전 11:20",mode:"past",chars:["taeo","eunho"],active:"taeo",speaker:"태오",line: "이제 뒤섞인 원고를 구별할 수 있어. 마지막 장에 다음 촬영 장소가 이어졌을 거야. 방송실의 나머지 기록이랑 맞춰 보자.",next:"name-copy"},
  "name-copy": {label:"1999년 · 소품 목록의 마지막 칸",time:"오전 11:20",mode:"past",chars:["somi","eunho"],active:"somi",speaker:"소미",line: "은호야, 지금 읽어! ‘발표 윤하나’가 또 흐려져. 내가 옮겨 적을게. 방금 떠오른 말도 잊기 전에 말해 줘!",next:"name-kept"},
  "name-kept": {label:"1999년 · 남겨 둔 이름",time:"오전 11:20",mode:"past",chars:["eunho","somi"],active:"eunho",speaker:"강은호",line: "윤하나… 윤하나. 종이를 보니까 다시 떠올라. 내가 액체를 흘렸을 때 괜찮다고 했어. 이걸 놓으면 또 잊을까 봐 무서워.",next:"room-return"},
  "room-return": {label:"1999년 · 과학실 밖 복도",time:"오전 11:25",mode:"past",chars:["somi","taeo"],active:"somi",speaker:"소미",line: "선생님이 기구를 정리해 주신대. 우린 테이프를 찾자. 이름을 적는 것만으론 오래 못 버텨. 하나가 간 곳을 알아내야 해.",next:"corridor-pause"},
  "corridor-pause": {label:"1999년 · 방송실로 가는 복도",time:"오전 11:26",mode:"past",chars:["eunho","taeo"],active:"eunho",speaker:"강은호",line:"이 복도를 같이 걸었던 것 같아. 하나가 카메라를 들고 앞서 가면, 내가 뒤에서 소품을 옮겼어. 그런데 맨 끝 문 앞에서 기억이 끊겨.",next:"corridor-answer"},
  "corridor-answer": {label:"1999년 · 방송실 문 앞",time:"오전 11:26",mode:"past",chars:["somi","eunho"],active:"somi",speaker:"소미",line: "그 말 그대로 적었어. 은호는 떠오르는 걸 바로 말해 줘. 태오랑 나는 테이프를 찾을게. 혼자 기억하려고 버티지 마.",next:"room-teacher"},
  "room-teacher": {label:"1999년 · 방송실 앞",time:"오전 11:27",mode:"past",chars:["teacher","eunho"],active:"teacher",speaker:"1999년 담임",line: "선생님은 교무실에 그 아이를 찾는 연락을 하고 오마. 너희는 함께 있어라. 방송 연결선은 점검했으니 급하면 마이크로 불러. 문은 닫히지 않게 받쳐 두렴.",next:"room-noise"},
  "room-noise": {label:"1999년 · 닫힌 문",time:"오전 11:28",mode:"past",chars:["taeo","somi"],active:"taeo",speaker:"태오",line:"방금 복도에서 누가 지나갔어? 검은 옷 같은 게… 어? 문이 닫혔어. 잠깐, 손잡이가 안 돌아가!",next:"room-calm"},
  "room-calm": {label:"1999년 · 방송실",time:"오전 11:29",mode:"past",chars:["somi","eunho"],active:"somi",speaker:"소미",line:"선생님! …안 들리시나 봐. 뛰어내리거나 문을 부수면 안 돼. 여기는 방송실이잖아. 방송을 연결해서 교무실에 알리자.",next:"room-finale"},
  "room-finale": {label:"방송실 · 마지막 방송",time:"오전 11:30",mode:"past",chars:[],speaker:"소미",line:"방 안을 살펴서 방송을 연결하자.",experiment:"room",roomMode:"finale",next:"room-outside"},
  "room-outside": {label:"1999년 · 다시 열린 복도",time:"오전 11:40",mode:"past",chars:["teacher","taeo"],active:"teacher",speaker:"1999년 담임",line:"다친 데는 없니? 문 잠금장치를 수리해야겠구나. 그런데… 방금 방송에서 하나 목소리가 들리지 않았니?",next:"room-recognized"},
  "room-recognized": {label:"1999년 · 이름을 기억하는 사람",time:"오전 11:41",mode:"past",chars:["eunho","somi"],active:"eunho",speaker:"강은호",line:"선생님, 저도 이제 하나 목소리가 기억나요. 아까는 같이 만든 그림을 봐도 잘 생각나지 않았는데… 이름을 적고 녹음을 들으니까 조금씩 떠올라요.",next:"room-promise"},
  "room-promise": {label:"1999년 · 오늘의 약속",time:"오전 11:42",mode:"past",chars:["taeo","somi"],active:"taeo",speaker:"태오",line: "운동장 골대 옆이랬지? 내가 선생님께 같이 가 달라고 할게. 소미는 이름 적은 종이 챙겨. 이제 놓치지 말자.",next:"chapter1-end"},
  "chapter1-end": {
    label: "1편 · 이름을 남긴 아이들",time:"오전 11:45", mode: "past", chars: ["eunho", "taeo", "somi"], active: "eunho", speaker: "강은호",
    line: "내일을 기다릴 수 없어. 지금 운동장으로 가자. 하나야, 네 이름 기억하고 있어. 들리면 대답해 줘!", next: "chapter1-preview-end",
  },
};

if (typeof window !== 'undefined' && window.Chapter2) Object.assign(scenes, window.Chapter2.build());

function init() {
  const saved = loadSave();
  if (saved) {
    dom.btnContinue.classList.remove("hidden");
    dom.playerName.value = saved.playerName || "";
  }
  bindEvents();
}

function bindEvents() {
  $('#btnNewGame').addEventListener('click', () => $('#newGameDialog').showModal());
  $('#btnChapters').addEventListener('click', () => window.ChapterAccess.request(() => $('#chapterDialog').showModal()));
  document.querySelectorAll('[data-close-title]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $('#btnChapter2Preview').addEventListener('click',()=>window.ChapterAccess.request(()=>{previewSession=true;state=initialState();state.playerName=dom.playerName.value.trim()||'지우';showStory();renderScene($('#previewChapter2').value);}));
  $('#btnRoomPreview').addEventListener('click',()=>{previewSession=true;state=initialState();state.playerName=dom.playerName.value.trim()||'지우';state.flags.oilSeparated=true;state.flags.saltSeparated=true;showStory();renderScene($('#previewSection').value);});
  dom.btnStart.addEventListener("click", startNew);
  dom.btnContinue.addEventListener("click", continueGame);
  dom.dialogue.addEventListener("click", advance);
  $('#stage').addEventListener('click', event => {
    if(dom.story.classList.contains('hidden')||dom.dialogue.classList.contains('hidden'))return;
    if(event.target.closest('button,input,select,textarea,a,.hud,.experiment-panel,#logPanel,dialog'))return;
    advance();
  });
  $("#btnLog").addEventListener("click", openLog);
  $("#btnCloseLog").addEventListener("click", () => dom.logPanel.classList.add("hidden"));
  $("#btnSound").addEventListener("click", toggleSound);
  $("#btnReset").addEventListener("click", resetGame);
  $("#btnReplay").addEventListener("click", resetGame);
  $("#btnChapter1").addEventListener("click", () => {
    const next=state.scene==='chapter1-preview-end'||state.scene==='chapter2-end'?'chapter2-start':'chapter1-start';
    const enter=()=>{if(next==='chapter2-start')state.flags=window.Chapter2.restartFlags(state.flags);showStory();renderScene(next);};
    if(next==='chapter2-start')window.ChapterAccess.request(enter);else enter();
  });
  dom.playerName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") startNew();
  });
  document.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && !dom.story.classList.contains("hidden") && !event.target.closest("button, input")) advance();
    if (event.key === "Escape") dom.logPanel.classList.add("hidden");
  });
}

function startNew() {
  previewSession = false;
  initAudio();
  state = initialState();
  state.playerName = dom.playerName.value.trim() || "지우";
  addLog("시작", `${state.playerName}, 태오, 소미가 과학실 창고를 정리하기 시작했다.`);
  showStory();
  renderScene("storage-1");
}

function continueGame() {
  const saved = loadSave();
  if (!saved) return startNew();
  const enter=()=>{
    previewSession=false;initAudio();state=saved;showStory();
    renderScene(state.scene || "storage-1");toast("저장된 장면에서 이어갑니다.");
  };
  if(window.ChapterAccess.isLockedScene(saved.scene))window.ChapterAccess.request(enter);else enter();
}

function showStory() {
  document.querySelectorAll('.title-dialog[open]').forEach(dialog => dialog.close());
  dom.title.classList.add("hidden");
  dom.ending.classList.add("hidden");
  dom.story.classList.remove("hidden");
  dom.hud.classList.remove("hidden");
}

function renderScene(id) {
  if(window.ChapterAccess.isLockedScene(id)&&!window.ChapterAccess.unlocked){window.ChapterAccess.request(()=>renderScene(id));return;}
  if(window.Chapter2V3View && (id==='chapter2-start'||id.startsWith('c2-'))){
    if(disposeExperiment){disposeExperiment();disposeExperiment=null;}
    if(id==='chapter2-start')delete state.flags['chapter2-v3'];
    if(previewSession&&id.startsWith('c2-preview-'))state.flags['chapter2-v3']=window.Chapter2V3State.preview(id.slice('c2-preview-'.length));
    state.scene='c2-v3';saveGame();
    dom.dialogue.classList.add('hidden');clearChoices();renderCharacters([]);renderProp();
    dom.sceneLabel.textContent='';dom.date.textContent='1999년 12월 28일';dom.time.textContent='오전 11:50';
    const panel=$('#experimentPanel');panel.classList.remove('hidden');panel.setAttribute('aria-label','2편 안개 속에서 돌아온 대답');
    disposeExperiment=window.Chapter2V3View.mount(panel,()=>renderScene('chapter2-end'),state.flags['chapter2-v3'],progress=>{state.flags['chapter2-v3']=progress;saveGame();},playFoley);
    return;
  }
  // Older saves inside the abrupt first encounter replay only this encounter;
  // later chapter-two saves and every chapter-one flag remain untouched.
  if(['c2-found','c2-anchor','c2-call','c2-answer'].includes(id))id='c2-search';
  if(disposeExperiment){disposeExperiment();disposeExperiment=null;}
  // Earlier versions saved the chapter ending immediately after the sieve lab.
  if (id === "chapter1-preview-end" && !state.flags.oilSeparated) id = "broadcast-arrive";
  else if (id === "chapter1-preview-end" && !state.flags.saltSeparated) id = "salt-reason";
  else if (id === "chapter1-preview-end" && !state.flags.roomEscaped) id = "room-return";
  $("#experimentPanel").classList.add("hidden");
  $("#experimentPanel").innerHTML = "";
  dom.dialogue.classList.remove("hidden");
  pendingNext = null;
  pendingReply = null;
  if (id === "end" || id === "chapter1-preview-end" || id === "chapter2-end") return showEnding(id);
  const scene = scenes[id];
  if (!scene) return;
  state.scene = id;
  musicPlayer.setEnabled(state.sound);
  musicPlayer.select(BGM.cue(id, scene));
  saveGame();

  dom.background.className = `background ${scene.mode || "past"}`;
  if(scene.backdrop==='field')dom.background.classList.add('weather-field');
  if(scene.backdrop==='night')dom.background.classList.add('weather-night');
  if(['photoStudio','staffroom','hall'].includes(scene.backdrop))dom.background.classList.add('c2-'+scene.backdrop);
  if (['room-noise','room-calm','room-finale','broadcast-empty','broadcast-desk','oil-reason'].includes(id)) dom.background.classList.add('broadcast');
  if (['room-return','corridor-pause','corridor-answer','room-teacher','room-outside','room-recognized','room-promise','chapter1-end','broadcast-arrive'].includes(id)) dom.background.classList.add('corridor');
  if (['salt-plan','room-supplies','supplies-return','oil-lab','oil-memory','oil-question','oil-answer','oil-link','salt-reason','salt-lab','salt-after','name-copy','name-kept'].includes(id)) dom.background.classList.add('prep');
  dom.scanlines.classList.toggle("on", Boolean(scene.scanlines));
  dom.sceneLabel.textContent = scene.mode === "video" ? "현재 과학실에서 보는 녹화 영상 · 촬영일 1999.12.31 밤" : scene.label || "";
  dom.date.textContent = scene.date || (scene.mode === "past" ? "1999년 12월 28일" : "2026년 9월 3일");
  const order=Object.keys(scenes), position=order.indexOf(id);
  dom.time.textContent = scene.time || (scene.mode === "past" ? (position>=order.indexOf("chapter1-start")?"오전 10:00":position>=order.indexOf("eunho-first")?"오전 9:50":"오전 9:10") : "오후 4:44");
  if(scene.mode === "video")dom.time.textContent = "현재 오후 4:44";
  renderCharacters(scene.chars || [], scene.active, id);
  renderProp(scene.prop);
  clearChoices();
  setDialogue(scene.speaker || "", resolve(scene.line), scene.dialogueType || "speech");
  dom.dialogue.disabled = Boolean(scene.choices);
  if(scene.experiment==='hana-search'){
    dom.dialogue.classList.add('hidden');
    const panel=$('#experimentPanel');panel.classList.remove('hidden');panel.setAttribute('aria-label','하나를 찾아 운동장 조사');
    disposeExperiment=window.HanaSearchView.mount(panel,()=>renderScene(scene.next),state.flags['hana-search'],progress=>{state.flags['hana-search']=progress;saveGame();},playFoley);
  }
  if(scene.experiment==='playground'){
    dom.dialogue.classList.add('hidden');
    const panel=$('#experimentPanel');panel.classList.remove('hidden');panel.setAttribute('aria-label','운동장 직접 탐색');
    const key='playground-'+scene.playground;
    const old=state.flags['weather-'+scene.weather];
    const saved=state.flags[key]||((old?.complete||state.flags['weather-'+scene.weather+'-done'])?{legacyComplete:true}:undefined);
    disposeExperiment=window.PlaygroundView.mount(panel,scene.playground,()=>{
      state.flags[key+'-done']=true;renderScene(scene.next);
    },saved,progress=>{state.flags[key]=progress;saveGame();},playFoley,{prepare:scene.prepare===true});
  }
  if(scene.experiment==='weather'){
    dom.dialogue.classList.add('hidden');
    const panel=$('#experimentPanel');panel.classList.remove('hidden');panel.setAttribute('aria-label','2단원 날씨 관찰과 추리');
    const key='weather-'+scene.weather;
    disposeExperiment=window.WeatherChapter.mount(panel,scene.weather,()=>{
      state.flags[key+'-done']=true;renderScene(scene.next);
    },state.flags[key],progress=>{state.flags[key]=progress;saveGame();});
  }
  if(scene.experiment==='clues'){
    dom.dialogue.classList.add('hidden');
    const panel=$('#experimentPanel');panel.classList.remove('hidden');panel.setAttribute('aria-label','출석부 조사');
    disposeExperiment=window.ClueBook.mount(panel,()=>renderScene(scene.next));
  }
  if (scene.experiment === 'room') {
    dom.dialogue.classList.add('hidden');
    const panel = $('#experimentPanel');
    panel.classList.remove('hidden');
    panel.setAttribute('aria-label','방송실 직접 탐색');
    disposeExperiment = window.RoomAdventure.mount(panel,scene.roomMode,()=>{
      if(scene.roomMode==='finale')state.flags.roomEscaped=true;
      state.flags['room-'+scene.roomMode]=null;
      renderScene(scene.next);
    },state.flags['room-'+scene.roomMode],progress=>{state.flags['room-'+scene.roomMode]=progress;saveGame();});
  }
  if (scene.experiment === "sieve") {
    dom.dialogue.classList.add("hidden");
    const panel = $("#experimentPanel");
    panel.setAttribute("aria-label", "모래와 자갈 분리 실험");
    panel.classList.remove("hidden");
    disposeExperiment = window.Sieve.mount(panel, () => {
      state.flags.sandSeparated = true;
      addLog("실험 메모", "혼합물은 각각의 성질을 지닌 물질이 섞인 것. 알갱이 크기와 체 눈 크기를 비교하며 모래·작은 자갈·큰 자갈을 나눴다.");
      renderScene(scene.next);
    });
  }
  if (scene.experiment === "oil" || scene.experiment === "salt") {
    dom.dialogue.classList.add("hidden");
    const panel = $("#experimentPanel");
    panel.classList.remove("hidden");
    disposeExperiment = window.LiquidLabs.mount(panel, scene.experiment, () => {
      state.flags[scene.experiment + "Separated"] = true;
      addLog("소미", scene.experiment === "oil" ? "물과 식용유가 층을 이루는 성질로 각각 회수했다." : "소금을 물에 녹이고 모래를 거른 뒤, 소금물의 물을 증발시켜 소금을 회수했다.");
      renderScene(scene.next);
    });
    panel.setAttribute("aria-label", scene.experiment === "oil" ? "물과 기름 분리 실험" : "소금과 모래 분리 실험");
  }

  if (scene.glitch) triggerGlitch();
  if (id === 'bells' || id === 'lesson-bell') playFoley('bell');
  if (scene.choices) window.setTimeout(() => renderChoices(scene.choices), 380);
  addLog(scene.speaker || "장면", resolve(scene.line));
}

function resolve(value) {
  return typeof value === "function" ? value() : value;
}

function renderCharacters(ids, active, sceneId) {
  const layout = window.CharacterLayout.planCharacterLayout(ids, active);
  const visibleIds = new Set(ids);

  Array.from(dom.characters.children).forEach((element) => {
    if (!visibleIds.has(element.dataset.character)) element.remove();
  });

  layout.forEach(({ id, position, role, shot }) => {
    const person = cast[id];
    const mood = window.CharacterMoods.getCharacterMood(sceneId, id);
    let element = dom.characters.querySelector(`[data-character="${id}"]`);
    const isNew = !element;
    if (!element) {
      element = document.createElement("div");
      element.dataset.character = id;
      dom.characters.appendChild(element);
    }
    element.dataset.name = person.name;
    element.dataset.mood = mood;
    element.style.backgroundImage = `url("${person.image || `assets/characters/${id}/${mood}.png`}")`;
    element.className = `character ${person.className} is-${position} is-${role} shot-${shot}${isNew ? ` is-new enter-${position}` : ""}`;
  });
}

function renderProp(type) {
  if (!type) {
    dom.propArea.innerHTML = "";
    return;
  }
  if (type === "pager") {
    dom.propArea.innerHTML = `<div class="pager-clue"><span>수신 메시지</span><p>방송실로 와.<br>은호한테는 말하지 마.</p></div>`;
  } else if (type === "tape") {
    dom.propArea.innerHTML = `<img class="title-tape" src="assets/vhs-cartoon-v1.png" alt="5-3 / 1999 라벨이 붙은 낡은 VHS 비디오테이프">`;
  } else if (type === "screen") {
    dom.propArea.innerHTML = `<div class="vhs-player"><div><b>1999</b><span>PLAY ▶ 00:04:44</span><small>TRACKING...</small></div></div>`;
  } else if (type === "roster" || type === "roster-hana") {
    const hanaClass = type === "roster-hana" ? "fading" : "";
    dom.propArea.innerHTML = `<article class="evidence-card"><h3>1999학년도 5학년 3반</h3><div class="roster"><span>6 박민수</span><span>7 강은호</span><span class="${hanaClass}">8 ${type === 'roster-hana' ? '윤하나' : '이름이 번진 자리'}</span><span>9 이수진</span><span class="future-name">27 ${state.playerName}</span><span class="future-name">28 김태오</span><span class="future-name">29 박소미</span></div></article>`;
  }
}

function setDialogue(speaker, text, type = "speech") {
  clearInterval(typingTimer);
  const resolvedSpeaker = resolve(speaker) || "상황";
  dom.speaker.textContent = resolvedSpeaker;
  dom.dialogue.classList.toggle("thought", type === "thought");
  dom.line.textContent = "";
  dom.line.dataset.fullText = text;
  currentLineDone = false;
  let index = 0;
  const chars = Array.from(text);
  typingTimer = setInterval(() => {
    dom.line.textContent += chars[index] || "";
    index += 1;
    if (index >= chars.length) {
      clearInterval(typingTimer);
      currentLineDone = true;
    }
  }, 18);
}

function advance() {
  if (scenes[state.scene]?.experiment) return;
  if (!currentLineDone) {
    clearInterval(typingTimer);
    dom.line.textContent = dom.line.dataset.fullText || dom.line.textContent;
    currentLineDone = true;
    return;
  }
  if (pendingNext) {
    if (pendingReply) {
      const reply = pendingReply;
      pendingReply = null;
      setDialogue(reply.speaker, reply.text);
      addLog(reply.speaker, reply.text);
      return;
    }
    const destination = pendingNext;
    pendingNext = null;
    renderScene(destination);
    return;
  }
  if (dom.dialogue.disabled) return;
  const scene = scenes[state.scene];
  if (!scene) return;
  // Reading ordinary dialogue is silent.
  renderScene(scene.next);
}

function renderChoices(choices) {
  dom.choices.innerHTML = choices.map((choice, index) => `<button class="choice-btn" type="button" data-index="${index}"><span class="choice-number">${index + 1}</span><span class="choice-label">${choice.text}</span></button>`).join("");
  dom.choices.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = choices[Number(button.dataset.index)];
      const scene = scenes[state.scene];
      const destination = choice.branch || choice.next || scene.next;
      playFoley('paper');
      addLog("나의 선택", choice.text);
      if (choice.effect) choice.effect();
      if (choice.feedback) {
        const feedbackSpeaker = choice.feedbackSpeaker || (scene.active && cast[scene.active]?.name) || "상황";
        addLog("선택 결과", choice.feedback);
        pendingNext = destination;
        pendingReply = window.ChoiceDialogue.followup(state.scene, Number(button.dataset.index));
        setDialogue(feedbackSpeaker, choice.feedback, choice.feedbackType || "speech");
        saveGame();
      }
      clearChoices();
      dom.dialogue.disabled = false;
      if (!choice.feedback) renderScene(destination);
    });
  });
}

function clearChoices() {
  dom.choices.innerHTML = "";
}

function showEnding(id = "end") {
  musicPlayer.select('calm');
  clearInterval(typingTimer);
  const preview = id === "chapter1-preview-end";
  state.scene = id;
  saveGame();
  dom.story.classList.add("hidden");
  dom.ending.classList.remove("hidden");
  dom.background.className = "background past";
  dom.scanlines.classList.remove("on");
  dom.date.textContent = "1999년 12월 28일";
  dom.time.textContent = preview ? "오전 11:45" : "오전 9:50";
  $("#endingKicker").textContent = preview ? "1편 · 방송실에 남은 목소리" : "프롤로그 끝";
  $("#endingTitle").textContent = preview ? "우리가 남긴 이름" : "아무도 기억하지 않는 아이";
  $("#endingMessage").textContent = preview ? "윤하나. 이번엔 잊어도 다시 볼 수 있게." : "방송실로 와. 은호한테는 말하지 마.";
  $("#btnChapter1").textContent = preview ? "2편 · 운동장에서 하나 찾기" : "방송실로 간다";
  $("#endingNote").textContent = preview ? "다음: 운동회에 없는 아이 · 날씨와 우리 생활" : "다음: 방송실에 없는 방송부원 · 직접 체를 흔드는 첫 실험";

  const brave = state.flags.tookTape ? "테이프를 놓치지 않았고" : state.flags.heldHands ? "친구들의 손을 놓지 않았고" : "낯선 목소리를 기억했고";
  dom.endingSummary.textContent = `${state.playerName}는 ${brave}, 1999년의 강은호와 처음 만났다. 하지만 출석부에는 설명할 수 없는 이름이 하나 더 남아 있었다.`;
  if (preview) dom.endingSummary.textContent = "세 가지 소품을 정리하며 하나와 은호의 촬영 약속을 찾았다. 방송실에 남은 테이프를 되살리고 잠긴 문을 연 아이들. 선생님도 하나를 기억해 냈다. 하나는 아직 만나지 못했지만, 이제 은호 혼자 기억해야 하는 이름은 아니다.";
  const title = window.EpisodeTitle.choose(state.flags, preview);
  dom.endingBadges.innerHTML = `<span class="badge episode-title">에피소드 칭호 · ${title}</span>`;
  if(id==='chapter2-end'){
    dom.date.textContent='1999년 12월 28일';dom.time.textContent='낮 12:10';
    dom.background.className='background past weather-field';
    $('#endingKicker').textContent='2편 · 안개 속에서 돌아온 대답';
    $('#endingTitle').textContent='내일, 창가의 빈자리';
    $('#endingMessage').textContent='찾으러 와 줘서 고마워. 그런데 지금 뒤돌아보지는 마.';
    dom.endingSummary.textContent='운동장에서 주운 수첩에 없던 글씨가 생기기 시작했다. 어제 사진과 뒷면의 메모를 따라 관측실까지 온 아이들은 촬영 기록을 대조해 하나의 목소리가 남은 영상을 찾았다. 재생을 멈춘 빈 교실 화면에서 의자가 움직였다. 수첩에는 새로운 문장이 남았다. “찾으러 와 줘서 고마워. 그런데 지금 뒤돌아보지는 마.”';
    dom.endingBadges.textContent='두 번째 단서 · 녹음과 사진에 남은 시간의 어긋남';
    $('#btnChapter1').textContent='2편 다시 살펴보기';
    $('#endingNote').textContent='다음 이야기: 밤의 학교 방송 · 3편은 아직 제작 중';
  }
  playFoley('paper');
}

function addLog(speaker, text) {
  state.log.push({ speaker, text });
  if (state.log.length > 80) state.log.shift();
}

function openLog() {
  const chapter2Log=state.flags['chapter2-v3']?.history;
  const entries=[...state.log,...(Array.isArray(chapter2Log)?chapter2Log:[])].slice(-80);
  dom.logList.innerHTML = entries.reverse().map((item) => `<div class="log-entry"><b>${escapeHtml(item.speaker)}</b><br>${escapeHtml(item.text)}</div>`).join("") || "<p>아직 기록이 없습니다.</p>";
  dom.logPanel.classList.remove("hidden");
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function triggerGlitch() {
  dom.glitch.classList.remove("on");
  void dom.glitch.offsetWidth;
  dom.glitch.classList.add("on");
  if (scenes[state.scene]?.mode === 'video') playFoley('tape');
}

let toastTimer;
function toast(message) {
  clearTimeout(toastTimer);
  dom.toast.textContent = message;
  dom.toast.classList.add("on");
  toastTimer = setTimeout(() => dom.toast.classList.remove("on"), 1800);
}

function saveGame() {
  if(previewSession)return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); }
  catch { return null; }
}

function resetGame() {
  if(previewSession){location.reload();return;}
  localStorage.removeItem(SAVE_KEY);
  state = initialState();
  location.reload();
}

function toggleSound() {
  state.sound = !state.sound;
  musicPlayer.setEnabled(state.sound);
  $("#btnSound").textContent = state.sound ? "소리 켬" : "소리 끔";
  if (state.sound) { initAudio(); playFoley('paper'); }
  saveGame();
}

function initAudio() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
}

function playFoley(kind) {
  if (!state.sound) return;
  try {
    initAudio();
    window.Foley.play(audioContext, kind, soundLevels.effects);
  } catch { /* Sound is optional. */ }
}

init();
