(function(root){
 'use strict';
 const criteria={wind:'풍향과 깃발의 관계',time:'두 자료를 연결하고 다른 시각을 배제',water:'물방울의 위치와 생성 설명',safety:'변한 날씨를 근거로 안전한 계획'};
 function initial(value){const s=value||{},ratings={};for(const key of Object.keys(criteria))ratings[key]=['확인','다시 설명','미확인'].includes(s.ratings?.[key])?s.ratings[key]:'미확인';return {mode:s.mode==='oral'?'oral':'written',spoken:s.spoken===true,ratings,notes:String(s.notes||'').slice(0,3000)};}
 function ready(s){return s.mode==='oral'?s.spoken===true:['explanation','fogExplanation','safetyPlan'].every(k=>typeof s[k]==='string'&&!!s[k].trim());}
 const api={initial,ready,criteria};if(typeof module!=='undefined')module.exports=api;root.LearningRecord=api;
})(typeof window==='undefined'?globalThis:window);
