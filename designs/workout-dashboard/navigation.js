(() => {
 'use strict';
 const names={overview:'Toàn cảnh',workout:'Buổi tập',schedule:'Lịch tuần',progress:'Tiến độ',music:'Âm nhạc'};
 const aliases={main:'workout',exercises:'workout','timer-card':'workout',nutrition:'progress','training-tools':'music'};
 let current='';
 try{if(localStorage.getItem('nhip-tap-motion-v1')==='off')document.body.dataset.motion='off';}catch{}
 function show(hash,{scroll=true,focus=false}={}){
  const target=String(hash||'overview').replace(/^#/,''); const view=names[target]?target:aliases[target]||'overview'; const changed=current!==view; current=view;
  document.body.dataset.roomMode=view==='overview'?'overview':'panel'; document.body.dataset.currentView=view;
  document.querySelectorAll('[data-view]').forEach(panel=>{const active=panel.dataset.view===view;panel.hidden=!active;panel.inert=!active;
   if(active&&changed&&document.body.dataset.motion!=='off'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)panel.animate([{opacity:0,transform:'perspective(1400px) translate3d(110px,30px,-350px) rotateY(-18deg)'},{opacity:1,transform:'perspective(1400px) translate3d(0,0,0) rotateY(0)'}],{duration:740,easing:'cubic-bezier(.16,1,.3,1)'});
   if(active&&scroll&&changed)panel.scrollTop=0;
  });
  document.querySelectorAll('[data-view-link]').forEach(link=>{const active=link.dataset.viewLink===view;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  document.getElementById('room-lobby').hidden=view!=='overview';document.getElementById('station-toolbar').hidden=view==='overview';
  document.getElementById('view-breadcrumb').textContent=names[view];document.getElementById('station-title').textContent=names[view];
  document.body.classList.remove('panel-expanded');document.getElementById('expand-station').setAttribute('aria-pressed','false');document.getElementById('expand-station').textContent='Mở rộng';
  document.dispatchEvent(new CustomEvent('nhipview:change',{detail:{view}}));
  if(scroll&&aliases[target])document.getElementById(target)?.scrollIntoView({block:'start',behavior:'instant'});
  if(focus){const heading=view==='overview'?document.querySelector('#room-lobby h1'):document.querySelector(`[data-view="${view}"] h1`);if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
 }
 function open(target,options){const hash='#'+target.replace(/^#/,'');if(location.hash!==hash)history.pushState(null,'',hash);show(hash,options);}
 document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const target=link.getAttribute('href').slice(1);if(!names[target]&&!aliases[target])return;event.preventDefault();open(target,{focus:true});});
 document.getElementById('expand-station').addEventListener('click',event=>{const expanded=document.body.classList.toggle('panel-expanded');event.currentTarget.setAttribute('aria-pressed',String(expanded));event.currentTarget.textContent=expanded?'Thu gọn':'Mở rộng';});
 window.addEventListener('hashchange',()=>show(location.hash));window.addEventListener('popstate',()=>show(location.hash));
 window.NhipView={open,getState:()=>current};show(location.hash,{scroll:false});
 document.addEventListener('DOMContentLoaded',()=>{if(aliases[location.hash.slice(1)])show(location.hash);},{once:true});
})();
