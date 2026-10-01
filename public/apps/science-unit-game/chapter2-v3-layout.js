(function(root){
 'use strict';
 const spot=(id,label,path,soft=false)=>({id,label,path,soft});
 // Coordinates traced against the 1672×941 source, shared by art and hit paths.
 const yard={art:'assets/chapter2-v3/playground.png',spots:[
  spot('sky','높은 하늘','M220 20H1440V175Q1180 130 980 205Q620 140 220 190Z',true),
  spot('fog','골대 앞 안개','M1040 406Q1190 370 1446 414L1480 498Q1240 528 1010 480Z',true),
  spot('school','학교 창문','M363 267H457V299H363Z M467 267H551V299H467Z M556 267H642V299H556Z'),
  spot('bench','장비를 놓던 벤치','M211 479H584L590 541H578V557L621 570V584H600L607 658H589L580 586H214L202 661H183L186 586H175V572L210 558H216V541H207Z'),
  spot('weather-record','백엽상 옆 관측 기록','M157 311L210 302L247 311V318H241L240 385L246 450H236L231 404L211 437V451H201V436L176 405L170 451H158L166 386V320H157Z M178 389L200 425V389Z M215 389V424L233 389Z'),
  spot('leaves','물방울이 맺힌 잎','M63 465Q50 448 58 438Q76 442 88 461Q86 435 99 424Q114 437 109 459Q126 443 139 454Q140 469 115 484Q133 482 139 499Q118 516 102 496Q99 520 85 523Q73 508 81 488Q56 495 51 481Z'),
  spot('camera','필름 카메라','M281 539L287 534H302L308 527H324L330 534H339L341 545Q347 553 340 565L321 569H281Z'),
  spot('cloth','장비 덮는 천','M447 551Q452 544 463 546L519 543L540 552V562L532 568H475L468 575L462 570L449 565Z'),
  spot('flag','오른쪽으로 펄럭이는 깃발','M1537 103Q1564 117 1597 126L1605 164Q1570 156 1538 140Z'),
  spot('door','방송 준비실 문','M1547 350L1606 343V520L1548 514Z')
 ]};
 const prep={art:'assets/chapter2-v3/prep-room.png',openArt:'assets/chapter2-v3/prep-room-open.png',spots:[
  spot('door','닫힌 출입문','M43 0H350V644L43 662Z'),
  spot('ribbon','환기창에 묶인 천','M659 49Q679 41 698 61Q721 57 748 75Q790 72 841 87L826 102Q790 91 757 88Q731 93 694 68L692 91L680 80L675 61L665 62Z'),
  spot('shelf','낮은 선반','M1149 374H1476L1492 393V668H1477V637H1186V669H1165V421H1149Z'),
  spot('bag','촬영 장비 가방','M886 347L901 310Q911 294 953 294L979 288H1027L1035 298L1084 303Q1098 308 1096 330L1108 380L1095 392L1004 399L915 389L879 375Z'),
  spot('recorder','카세트 녹음기','M492 333L510 325H561L581 320L663 319L678 341L674 390L662 395H496Z'),
  spot('tape','녹음기 옆 테이프','M779 366L837 370V392L826 399L763 392V382Z'),
  spot('strap','손잡이에 걸린 끈','M306 333L325 333L353 496L355 518L317 589Q298 608 275 590L273 560L285 458Z M313 376L299 492L287 554L295 570L337 504Z'),
  spot('paper','선반 밑 메모','M1191 644L1240 636L1276 647L1226 664Z'),
  spot('ruler','긴 자','M1483 192L1501 191L1526 567L1510 568Z'),
  spot('broom','빗자루','M1572 128L1583 126L1566 499L1575 537L1598 664L1575 669L1504 653L1529 544L1547 502Z'),
  spot('clip','종이 집게','M1298 351V334Q1298 321 1309 321H1335Q1346 321 1346 334V351L1355 389H1289Z'),
  spot('flashlight','손전등','M1387 134L1406 138L1403 197L1410 233Q1400 251 1376 242L1375 230L1386 192Z')
 ]};
 const archive={art:'assets/chapter2-v3/archive.png',spots:[
  spot('albums','사진 앨범 서가','M4 0H388V636L4 805Z'),
  spot('window','자료실 창문','M502 0H963V378H502Z'),
  spot('map','벽에 걸린 운동장 사진','M1084 113H1343V291H1084Z'),
  spot('speaker','방송 스피커','M1383 9H1462V92H1383Z'),
  spot('archiveDoor','복도 쪽 문','M1553 83L1671 37V683L1544 614Z'),
  spot('logbook','촬영 일지','M452 517L527 446Q583 429 635 447Q690 440 754 454L747 519Z'),
  spot('photos','사진 봉투','M808 517L817 456H956L974 517Z'),
  spot('photo-back','사진 뒷면','M1019 465L1111 454L1144 496L1040 504Z'),
  spot('photo-detail','자료실이 찍힌 사진','M1179 476L1251 476L1274 516L1191 514Z')
 ]};
 const weather={art:'assets/chapter2-v3/weather-room.png',spots:[
  spot('high-chart','일기도 왼쪽 기록','M234 46H428V314H238Z'),
  spot('low-chart','일기도 오른쪽 기록','M431 46H624V314H431Z'),
  spot('air-balance','저울과 공기 비교 기록','M512 348L681 350L672 366H605V390H674V414H516V397H585V366H522Z M748 410V334Q749 313 777 311V283H794V310Q818 316 818 340V411Z M901 411V334Q904 314 929 311V283H945V311Q970 316 970 340V411Z'),
  spot('coded-note','접힌 쪽지','M1096 399L1161 394L1183 412L1146 417L1101 414Z'),
  spot('room-speaker','관측실 스피커','M1222 8H1323V82L1255 94L1222 83Z'),
  spot('weather-door','복도로 이어지는 문','M19 34L115 78V568L19 594Z')
 ]};
 const coast={art:'assets/chapter2-v3/coast-room.png',spots:[
  spot('day-coast','낮 해안 관측 사진과 영상','M345 9H736V299H345Z M176 241L202 236L467 250V449L190 466L166 451Z'),
  spot('night-coast','밤 해안 관측 사진','M768 10H1149V299H768Z'),
  spot('valley-poster','골짜기 관측 사진 · 더 알아보기','M1227 49H1461V336H1227Z'),
  spot('last-recording','편집실 녹음기','M615 374L833 367L852 374V443H613Z'),
  spot('blue-notebook','파란 강수 노트 · 더 알아보기','M1264 384L1352 383L1360 394L1272 399L1264 394Z'),
  spot('white-notebook','흰 강수 노트 · 더 알아보기','M1366 384L1454 386L1459 400H1363Z'),
  spot('coast-door','편집실 출입문','M1542 0H1672V677L1533 620Z')
 ]};
 const api={yard,prep,archive,weather,coast};if(typeof module!=='undefined')module.exports=api;root.Chapter2V3Layout=api;
})(typeof window==='undefined'?globalThis:window);
