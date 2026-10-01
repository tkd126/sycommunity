const musicPlayer = BGM.create();
let soundLevels = {music:.18,effects:1};
try {
  const saved=JSON.parse(localStorage.getItem('storyscience-audio'));
  for(const key of ['music','effects']) if(saved && Number.isFinite(saved[key])) soundLevels[key]=Math.max(0,Math.min(1,saved[key]));
} catch { /* Private browsing can disable storage. */ }
musicPlayer.setVolume(soundLevels.music);
document.addEventListener('visibilitychange',()=>musicPlayer.setHidden(document.hidden));
document.addEventListener('pointerdown',()=>musicPlayer.unlock());
document.addEventListener('keydown',()=>musicPlayer.unlock());
document.querySelectorAll('[data-music-settings]').forEach(button=>button.addEventListener('click',()=>document.querySelector('#musicSettings').showModal()));
document.querySelector('#closeMusic').addEventListener('click',()=>document.querySelector('#musicSettings').close());
for(const key of ['music','effects']) {
  const input=document.querySelector('#volume-'+key);
  const output=document.querySelector('#level-'+key);
  input.value=Math.round(soundLevels[key]*100);output.value=input.value+'%';
  input.addEventListener('input',()=>{
    soundLevels[key]=Number(input.value)/100;output.value=input.value+'%';
    musicPlayer.setVolume(soundLevels.music);
    try {localStorage.setItem('storyscience-audio',JSON.stringify(soundLevels));} catch {}
  });
}
