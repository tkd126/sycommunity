(function(root){
 'use strict';
 const duration=15000;
 const secondsLeft=(until,now)=>Math.max(0,Math.ceil((until-now)/1000));
 function mount(host,key){
  // 연습판은 즉시 재시도. 기존 저장의 대기시간도 적용하지 않는다.
  const enabled=false;
  if(!enabled)return {start(){},dispose(){}};
  const storageKey='science1999-retry-'+key;
  let until=0,timer=null,disposed=false;
  try{until=Number(sessionStorage.getItem(storageKey))||0;}catch{}
  const original=new Map();
  function save(){try{sessionStorage.setItem(storageKey,String(until));}catch{}}
  function update(){
   if(disposed)return;
   const left=secondsLeft(until,Date.now());
   let notice=host.querySelector('.answer-delay');
   if(left){
    if(!notice){notice=document.createElement('p');notice.className='answer-delay';notice.setAttribute('role','status');host.prepend(notice);}
    const message='오답 확인 · '+left+'초 뒤 다시 선택할 수 있어요. 친구의 설명을 읽어 보세요.';
    if(notice.textContent!==message)notice.textContent=message;
    host.querySelectorAll('button,input,select,textarea').forEach(el=>{if(!original.has(el))original.set(el,el.disabled);if(!el.disabled)el.disabled=true;});
   }else{
    if(notice)notice.remove();
    original.forEach((wasDisabled,el)=>{el.disabled=wasDisabled;});original.clear();
    if(timer){clearInterval(timer);timer=null;}
   }
  }
  function block(event){if(secondsLeft(until,Date.now())&&event.target.closest('button,input,select,textarea,canvas,form')){event.preventDefault();event.stopImmediatePropagation();}}
  for(const event of ['click','submit','pointerdown','pointermove','keydown'])host.addEventListener(event,block,true);
  const observer=new MutationObserver(()=>{if(secondsLeft(until,Date.now()))update();});
  observer.observe(host,{childList:true,subtree:true});
  function start(){until=Date.now()+duration;save();update();if(!timer)timer=setInterval(update,250);}
  if(secondsLeft(until,Date.now())){update();timer=setInterval(update,250);}
  return {start,dispose(){disposed=true;observer.disconnect();if(timer)clearInterval(timer);for(const event of ['click','submit','pointerdown','pointermove','keydown'])host.removeEventListener(event,block,true);original.clear();}};
 }
 const api={duration,secondsLeft,mount};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AnswerDelay=api;
})(typeof window==='undefined'?globalThis:window);
