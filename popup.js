'use strict';
const $=id=>document.getElementById(id);
chrome.storage.local.get(['rcl_enabled','rcl_sidebar'],d=>{
  $('togEnabled').checked = d.rcl_enabled!==false;
  $('togSidebar').checked = d.rcl_sidebar!==false;
  setStatus(d.rcl_enabled!==false);
});
$('togEnabled').addEventListener('change',()=>{
  const v=$('togEnabled').checked;
  chrome.storage.local.set({rcl_enabled:v}); setStatus(v);
});
$('masterRow').addEventListener('click',e=>{
  if(e.target.closest('.tog')) return;
  $('togEnabled').checked=!$('togEnabled').checked;
  $('togEnabled').dispatchEvent(new Event('change'));
});
$('togSidebar').addEventListener('change',()=>chrome.storage.local.set({rcl_sidebar:$('togSidebar').checked}));
function setStatus(on){
  const el=$('statusText'); if(!el) return;
  el.textContent=on?'Active':'Off';
  el.style.color=on?'#e8192c':'var(--gray)';
}
