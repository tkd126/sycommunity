(function(root) {
  const tracks = {calm:'assets/music/touching-moments-higher.mp3', mystery:'assets/music/measured-paces.mp3'};
  function cue(id, scene={}) {
    if(['video','blackout'].includes(scene.mode) || ['blackout','bells','lesson-bell','broadcast-call'].includes(id)) return null;
    if(scene.music==='mystery')return 'mystery';
    return /roster|forgets|empty-desk|pager|name-copy|room-finale|broadcast-empty/.test(id) ? 'mystery' : 'calm';
  }
  function create({makeAudio=src=>{const audio=new Audio(src);audio.hidden=true;document.body.append(audio);return audio;},schedule=fn=>setInterval(fn,50)}={}) {
    const media = new Map();
    let selected=null, unlocked=false, enabled=true, hidden=false, volume=.18, timer;
    function active(){return unlocked && enabled && !hidden && volume>0;}
    function reconcile() {
      if(!active()) {
        media.forEach(a=>{a.volume=0;a.pause();});
        return;
      }
      if(selected && !media.has(selected)) {
        const a=makeAudio(tracks[selected]);a.loop=true;a.preload='none';a.volume=0;
        media.set(selected,a);
      }
      const a=media.get(selected);
      if(a && a.paused && !a.pending) {
        a.pending=true;
        try { Promise.resolve(a.play()).catch(()=>{}).finally(()=>{
          a.pending=false;
          if(!active() || media.get(selected)!==a){a.volume=0;a.pause();}
        }); } catch {a.pending=false;}
      }
      if(timer===undefined) timer=schedule(()=>{
        media.forEach((a,key)=>{
          const target=active() && key===selected ? volume : 0;
          const delta=target-a.volume;
          a.volume=Math.abs(delta)<.009 ? target : Math.max(0,Math.min(1,a.volume+Math.sign(delta)*.009));
          if(a.volume===0 && target===0)a.pause();
        });
      });
    }
    return {
      select(key){selected=Object.hasOwn(tracks,key)?key:null;reconcile();},
      unlock(){unlocked=true;reconcile();},
      setEnabled(value){enabled=Boolean(value);reconcile();},
      setHidden(value){hidden=Boolean(value);reconcile();},
      setVolume(value){volume=Number.isFinite(Number(value))?Math.max(0,Math.min(1,Number(value))):.18;reconcile();}
    };
  }
  const api={create,cue};
  if(typeof module!=='undefined') module.exports=api;
  root.BGM=api;
})(typeof window!=='undefined'?window:globalThis);
