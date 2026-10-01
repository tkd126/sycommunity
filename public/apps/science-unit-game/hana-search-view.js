(function(root){
  'use strict';
  const spots=[
    ['track','운동장 선',28,55,40,17,'M28 57 Q40 58 51 64 Q60 69 68 70 M28 61 Q40 62 50 67 Q58 71 65 72'],
    ['tree','운동장 나무',0,0,28,25,'M0 1 Q8 2 12 8 Q16 2 21 1 M12 8 Q9 15 8 25 M12 8 Q17 12 25 13 M10 12 Q5 14 1 20'],
    ['hedge','벤치 뒤 화단',23,75,13,14,'M23 84 Q24 78 27 80 Q28 75 31 79 Q33 76 35 81 L36 89 L23 89 Z'],
    ['fence','낮은 울타리',0,56,28,12,'M1 62 Q8 61 14 63 Q21 65 28 63 M3 57 V68 M15 59 V68 M27 58 V67'],
    ['school','학교 창문',51,29,20,4,'M 51.376 29.862 L 54.844 29.862 L 54.844 32.094 L 51.376 32.094 Z M 62.739 30.074 L 66.268 30.074 L 66.268 32.306 L 62.739 32.306 Z M 67.703 30.074 L 70.574 30.074 L 70.574 32.306 L 67.703 32.306 Z'],
    ['bench','나무 벤치',0,78,23,15,'M0 84 L22 84 L22 88 L0 88 Z M3 88 L2 93 M19 88 L20 93'],
    ['weatherBox','백엽상',25,34,7,18,'M 26.077 34.750 L 28.888 34.325 L 31.579 34.857 L 31.519 35.600 L 30.921 35.600 L 30.921 42.083 L 30.562 42.189 L 31.100 49.416 L 31.699 49.628 L 31.699 51.328 L 25.478 51.328 L 25.538 49.734 L 26.196 49.416 L 26.675 41.977 L 26.555 41.977 L 26.555 35.600 L 26.077 35.494 Z M 27.153 42.189 L 26.914 46.652 L 28.349 42.189 Z M 27.751 47.078 L 28.828 43.677 L 28.947 48.672 Z M 29.605 42.508 L 30.443 47.184 L 29.785 45.696 Z'],
    ['bucket','창고 옆 양동이',18,47,2.7,4,'M18.2 47.5 Q19.4 47 20.5 47.6 L20 50.7 Q19.2 51 18.7 50.6 Z'],
    ['cart','청소 수레',0.8,46.7,5,7,'M0.96 48.25 L2.03 48.46 Q2.27 46.97 2.75 47 Q3.17 47.08 3.41 48.78 L5.62 48.88 L5.62 49.4 L5.38 49.42 L5.44 51.22 Q5.98 52.23 5.44 53.13 Q4.78 53.92 4.43 52.39 L3.83 52.18 Q3.77 53.45 3.29 53.23 Q2.81 53.02 2.81 51.97 L2.39 51.75 Q2.03 52.34 1.62 51.65 L1.44 50 L1.08 49.2 Z'],
    ['cone','안전 고깔',7.85,46.5,2.9,7,'M9.03 46.88 Q9.24 46.46 9.45 46.97 L10.07 52.34 L10.59 52.65 L10.59 53.07 Q9.21 53.6 7.95 53.02 L7.95 52.65 L8.37 52.33 Z'],
    ['speakerBox','방송 스피커',81,6,6,14,'M85.9 7 Q82 7 81.4 11.5 Q81 16 83.8 19 L86.4 14.5 Q87 10 85.9 7 Z'],
    ['equipmentBox','방송 장비 상자',89,57,11,11,'M89.3 59 L93 57.4 L99.8 59 V67.5 L96 67.8 L89.3 65 Z M89.3 59 L96 61 L99.8 59 M96 61 V67.8'],
    ['cloth','벤치의 천',14.9,80,6.2,10,'M 14.952 82.678 Q 15.311 81.509 16.148 81.296 Q 16.567 80.340 17.404 80.553 Q 18.182 80.659 18.720 81.190 Q 19.737 80.340 20.514 81.084 Q 20.993 81.509 20.694 82.465 Q 20.574 83.103 20.813 84.697 L 20.993 87.991 Q 20.574 88.735 20.036 88.310 Q 19.438 89.054 18.900 88.629 Q 18.062 89.798 17.703 89.267 L 17.584 85.866 Q 17.524 84.166 16.926 83.741 Z'],
    ['radio','방송 장비',80,59,10,8,'M80 65 L82 60 L88 61 L90 66 Z'],
    ['shelter','본부석 의자',82,73,10,14,'M82 74 Q87 72 90 76 L92 86 L84 87 Z'],
    ['camera','벤치 위 카메라',11.5,76,5.5,6.3,'M11.8 78 L12.5 77.5 V76.7 H14.4 L14.8 76.3 H15.7 L16.6 77.5 V81 L13.3 82.2 L11.8 81.6 Z'],
    ['goal','골대 옆',63,36.5,12,9.5,'M63.2 45.5 L64 38 L64.8 37.1 L74.6 37.6 V45.4 M64.8 37.1 V46 L74.6 45.4 M64.8 46 L63.2 45.5'],
    ['ball','축구공',70.5,49.5,2.2,4.1,'M72.4 51.6 C72.4 53.5 70.7 53.5 70.7 51.6 C70.7 49.7 72.4 49.7 72.4 51.6 Z'],
    ['shed','창고 문',10.4,34,6.3,17,'M10.7 34.4 L16.2 35 V50.5 L10.7 51 Z'],
    ['flag','깃발',43.6,10.4,3.2,4.4,'M44 10.8 L46.5 12.7 L44 14.3 Z']
  ];
  function mount(host,onDone,saved,onSave=()=>{},onSound=()=>{}){
    let s=HanaSearch.initial(saved),peek=false,finished=false,wide=false;
    s.selected=''; // Discard legacy held-paper state; exploration no longer uses a bag.
    let typingTimer=null,finishTyping=null;
    const {button}=RoomScene;
    function dispatch(action){
      if(action==='next'&&finishTyping){finishTyping();return;}
      if(action==='peek')peek=!peek;
      else if(action==='field'&&!s.talk)wide=true;
      else if(action==='goal'&&s.found&&!s.talk)wide=false;
      else {
        const previous=s;s=HanaSearch.act(s,action);
        // Finish each conversation before moving, without a separate travel/teacher button.
        if(!s.talk&&!s.detail){
          if(s.escorted)s=HanaSearch.act(s,'finish');
          else if(s.remembered)s=HanaSearch.act(s,'teacher');
          else if(s.heard&&!s.found)s=HanaSearch.act(s,'approach');
        }
        if(s.note&&!previous.note||action==='select-name')onSound('paper');
        onSave(s);
      }
      if(s.complete&&!finished){finished=true;onDone();return;}
      render(action);
    }
    function modal(label,body){return `<section class="room-modal" role="dialog" aria-modal="true" aria-label="${label}"><div class="room-modal-content" tabindex="-1">${body}</div></section>`;}
    function render(lastAction){
      clearInterval(typingTimer);typingTimer=null;finishTyping=null;
      const [speaker,line]=HanaSearch.speech(s);
      const hotspot=([id,name,x,y,w,h,path])=>{const shape=path||'M'+x+' '+y+' H'+(x+w)+' V'+(y+h)+' H'+x+' Z';return `<button type="button" class="room-hotspot ${peek?'revealed':''}" data-room-action="${id}" aria-label="${name} 조사" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"><svg class="room-object-glow" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${shape}"/></svg><span>${name}</span></button>`;};
      host.innerHTML=RoomScene.render({place:'1999 · 운동장 골대 옆',goal:s.found?'다시 이름을 부르다':'약속한 자리에 남은 흔적',art:'assets/playground-field-cartoon-v3.png',alt:'흐린 겨울 운동장. 벤치 위 카메라, 골대와 창고가 보인다.',peek,speaker,line,showBag:false,showLook:false,
        selected:s.selected?`손에 든 물건: ${s.selected==='name'?'이름을 적은 종이':'촬영 쪽지'}`:'',spots:s.found&&!wide?'':spots.map(hotspot).join('')});
      const picture=host.querySelector('.room-picture');
      if(s.found&&!wide&&!s.talk){
        picture.insertAdjacentHTML('beforeend',`<div class="hana-meeting"><button type="button" class="hana-person hana-eunho" data-room-action="eunho" aria-label="은호에게 말하기"><img src="assets/characters/eunho/${s.remembered?'happy':'worried'}.png" alt="하나와 마주 선 은호"><span>강은호</span></button><button type="button" class="hana-person hana-girl ${s.remembered?'':'hana-mystery'}" data-room-action="hana" aria-label="${s.remembered?'하나':'낯선 아이'}에게 말하기"><img src="assets/hana-first-meeting-v1.png" alt="${s.remembered?'겨울 외투를 입고 캠코더를 든 윤하나':'골대 뒤에 서 있는 낯선 아이의 실루엣'}"><span>${s.remembered?'윤하나':'낯선 아이'}</span></button></div>`);
        if(!s.talk)host.querySelector('.room-toolbar').insertAdjacentHTML('beforeend',button('field','주변 다시 살피기'));
      }
      if(s.detail==='wind'){
        picture.insertAdjacentHTML('beforeend',`<div class="hana-wind-choice" style="position:absolute;left:35%;top:55%;display:flex;gap:20px">${button('wind-left','← 이쪽으로 날릴 것 같아')}${button('wind-right','이쪽으로 날릴 것 같아 →')}</div>`);
        host.querySelector('.room-toolbar').insertAdjacentHTML('beforeend',button('close','천 내려놓기'));
      }
      if(s.talk){
        const paragraph=host.querySelector('.room-speech p');
        const chars=Array.from(line);let index=0;
        paragraph.textContent='';
        finishTyping=()=>{
          clearInterval(typingTimer);typingTimer=null;
          paragraph.textContent=line;finishTyping=null;
        };
        typingTimer=setInterval(()=>{
          paragraph.textContent+=chars[index++]||'';
          if(index>=chars.length)finishTyping();
        },18);
        const portraits={'태오':'characters/taeo/normal.png','소미':'characters/somi/normal.png','강은호':'characters/eunho/worried.png','1999년 담임':'characters/teacher/normal.png'};
        const portrait=speaker==='윤하나'&&s.found?'hana-first-meeting-v1.png':portraits[speaker];
        if(portrait)host.insertAdjacentHTML('beforeend',`<div class="room-dialogue-portrait ${speaker==='윤하나'&&!s.remembered?'hana-mystery':''}" aria-hidden="true"><img src="assets/${portrait}" alt=""></div>`);
        host.querySelector('.room-speech').insertAdjacentHTML('beforeend',button('next','계속 ▼'));
        host.querySelector('.room-stage').inert=true;

      }
      if(s.detail==='camera'){host.insertAdjacentHTML('beforeend',modal('벤치 위 카메라',`${button('close','운동장으로 돌아가기')}<h2>벤치 위 카메라</h2><div class="hana-camera-closeup" role="img" aria-label="벤치 위 필름 카메라 확대"></div><p>카메라 끈에 접힌 쪽지가 끼워져 있다.</p><blockquote>골대 옆에서 은호 기다리기.<br>촬영이 끝나면 카메라를 선생님께.</blockquote><p>소미: 골대 옆이래. 그쪽으로 가 보자.</p>`));}
      const overlay=host.querySelector('.room-modal');
      if(overlay){for(const child of host.children)if(child!==overlay)child.inert=true;overlay.querySelector('button').focus();}
      else if(s.talk)host.querySelector('[data-room-action="next"]').focus({preventScroll:true});
      else if(lastAction){const nextAction=lastAction==='take-note'?'camera':lastAction.startsWith('select-')?(s.found?'eunho':'bag'):lastAction==='next'?(s.found?'eunho':s.heard?'approach':'bag'):lastAction;host.querySelector(`[data-room-action="${nextAction}"]`)?.focus({preventScroll:true});}
    }
    function click(e){
      const b=e.target.closest('[data-room-action]');
      if(b&&host.contains(b)){dispatch(b.dataset.roomAction);return;}
      // Inert scenery retargets clicks to the panel while dialogue is playing.
      if(s.talk&&!host.querySelector('.room-modal')&&!e.target.closest('button,input,select,textarea,a'))dispatch('next');
    }
    function keydown(e){
      const modal=host.querySelector('.room-modal');
      if(!modal&&s.talk&&(e.key==='Enter'||e.key===' ')&&!e.target.closest('button')){e.preventDefault();dispatch('next');}
      if(e.key==='Escape'&&modal){e.preventDefault();dispatch('close');}
      if(e.key==='Tab'&&modal){const nodes=[...modal.querySelectorAll('button')];const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    }
    host.classList.add('room-panel','hana-search-panel');host.addEventListener('click',click);host.addEventListener('keydown',keydown);render();
    return ()=>{finished=true;clearInterval(typingTimer);typingTimer=null;finishTyping=null;host.removeEventListener('click',click);host.removeEventListener('keydown',keydown);host.classList.remove('room-panel','hana-search-panel');};
  }
  root.HanaSearchView={mount,spots};
})(typeof window==='undefined'?globalThis:window);
