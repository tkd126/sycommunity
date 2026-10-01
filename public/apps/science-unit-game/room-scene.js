(function(root){
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(action,label)=>`<button type="button" data-room-action="${esc(action)}">${esc(label)}</button>`;
  // Shared chapter-one composition. Spots are trusted game-authored markup;
  // all prose and asset paths are escaped here, including resumed dialogue.
  function render({place,goal,art,alt,spots='',peek=false,selected='',speaker,line,showBag=true,showLook=true}){
    return `<div class="room-toolbar"><div><span>${esc(place)}</span><strong>${esc(goal)}</strong></div>${showLook?button('peek',peek?'표시 숨기기':'둘러보기'):''}</div><div class="room-stage"><div class="room-picture"><img src="${esc(art)}" alt="${esc(alt)}">${spots}</div></div>${showBag?`<div class="room-bag" aria-label="소지품">${button('bag','가방 열기')}<strong>${esc(selected||'물건을 사용하려면 가방을 여세요')}</strong></div>`:''}<div class="room-speech" role="status"><b>${esc(speaker)}</b><p>${esc(line)}</p></div>`;
  }
  const api={render,button,esc};
  if(typeof module!=='undefined')module.exports=api;
  root.RoomScene=api;
})(typeof window==='undefined'?globalThis:window);
