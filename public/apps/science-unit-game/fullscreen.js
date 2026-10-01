(()=>{
 const stage=document.getElementById('stage');
 const buttons=document.querySelectorAll('[data-fullscreen]');
 function sync(){buttons.forEach(b=>{b.textContent=document.fullscreenElement?'전체화면 해제':'전체화면';b.setAttribute('aria-pressed',String(!!document.fullscreenElement));});}
 buttons.forEach(b=>b.addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}
  catch{stage.classList.toggle('immersive');buttons.forEach(el=>el.textContent=stage.classList.contains('immersive')?'화면 맞춤 해제':'전체화면');}
 }));
 document.addEventListener('fullscreenchange',sync);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&stage.classList.contains('immersive')){stage.classList.remove('immersive');sync();}});
 sync();
})();
