(function(root){
  'use strict';
  function choose(flags={},chapter=false){
    if(chapter){
      if(flags.heldHands)return '친구와 이름을 함께 지킨 동료';
      if(flags.tookTape)return '기록을 지킨 시간 탐사자';
      if(flags.toldSchoolName)return '시간의 금기를 건드린 전학생';
      if(flags.watchedCarefully)return '지워진 흔적을 찾아낸 관찰자';
      return '하나의 이름을 남긴 전학생';
    }
    if(flags.heldHands)return '끝까지 손을 놓지 않은 아이';
    if(flags.tookTape)return '시간의 테이프를 지킨 아이';
    if(flags.toldSchoolName)return '시간을 먼저 믿은 전학생';
    if(flags.watchedCarefully)return '낡은 기록을 읽은 관찰자';
    return '네 번째 종을 건넌 전학생';
  }
  const api={choose};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EpisodeTitle=api;
})(typeof window==='undefined'?globalThis:window);
