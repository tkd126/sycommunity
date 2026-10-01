(function(root){
 'use strict';
 const pages={
  roster:['출석부','<h3>5학년 3반 · 출석부</h3><p>6번 박민수　○<br>7번 강은호　○<br>8번 <span class="faded-name">잉크가 번진 자리</span>　○<br>9번 이수진　○</p><p>소미: 이름은 읽을 수 없는데, 오늘 출석 표시는 남아 있어.</p>'],
  duty:['당번표','<h3>이번 주 방송 당번</h3><table class="duty-categories"><tbody><tr><th scope="row">촬영조<br><small>참여한 사람</small></th><td><span>박민수</span><span>강은호</span><span>윤하나</span><span>이수진</span></td></tr><tr><th scope="row">역할<br><small>맡은 일</small></th><td><span>조명</span><span>그림 들기</span><span>사진 찍기</span><span>원고 읽기</span></td></tr></tbody></table><p class="duty-rule">한 사람당 한 가지 역할 · 위아래 순서는 짝을 뜻하지 않음</p><p>수진은 녹음실에서 원고를 읽었다.<br>민수는 그림도 카메라도 맡지 않았다.</p>'],
  photo:['사진 뒷면','<h3>소품 촬영 사진 · 뒷면</h3><p>“사진 속 두 아이의 출석 번호를 더하면 13.<br>그림을 든 아이의 번호가 조명을 든 아이보다 크다.”</p><p>그날 카메라 앞에는 조명 담당과 그림 담당만 섰다. 녹음실에는 한 명이 있었다. 이 사진을 찍은 사람은 누구일까?</p>']
 };
 function check(kind,seen,answer){return kind==='roster'&&Object.keys(pages).every(k=>seen.includes(k))&&String(answer).trim()==='윤하나';}
 function mount(host,onComplete){
  const seen=new Set();let page='roster',reply='소미: 이상해. 이름만 지워졌는데, 이 아이가 남긴 일은 그대로야.',solved=false;
  function render(){
   seen.add(page);
   host.innerHTML='<div class="clue-book"><span class="mission-kicker">교실 · 사라진 8번</span><h2>사진에 없는 촬영자</h2><nav>'+Object.entries(pages).map(([id,p])=>'<button data-page="'+id+'" aria-pressed="'+(page===id)+'">'+p[0]+(seen.has(id)?' ✓':'')+'</button>').join('')+'</nav><article class="clue-paper">'+pages[page][1]+'</article><p role="status">'+reply+'</p>'+(solved?'<button data-finish class="primary-btn">은호에게 이름을 확인한다</button>':'<form><label for="missingName">8번 칸에서 사라진 이름은?</label><input id="missingName" autocomplete="off" maxlength="20"><button type="submit">기록을 맞춰 보기</button></form>')+'</div>';
   host.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=b.dataset.page;render();});
   const form=host.querySelector('form');if(form)form.onsubmit=e=>{e.preventDefault();const answer=host.querySelector('input').value;if(check('roster',[...seen],answer)){solved=true;reply='소미: 민수는 조명, 은호는 그림. 남은 촬영자이자 8번은 윤하나. 이름을 찾았어. 그런데 은호는 왜 아무 말도 없지?';}else reply=seen.size<3?'소미: 아직 확인하지 않은 종이가 있어. 추측만으로 이름을 적어도 될까?':'소미: 수진과 민수가 맡은 일부터 생각해 보자. 사진 속 두 사람의 번호도 맞추면, 남은 역할이 누구의 일인지 알 수 있겠어.';render();};
   const finish=host.querySelector('[data-finish]');if(finish)finish.onclick=onComplete;
  }
  render();return ()=>{};
 }
 const api={check,mount};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ClueBook=api;
})(typeof window==='undefined'?globalThis:window);
