/* RECOIL — newtab.js v2  (MV3 external script) */
'use strict';

const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function pad(n)     { return String(n).padStart(2,'0'); }
function setText(id,v){ const e=document.getElementById(id); if(e) e.textContent=v; }
function esc(s)     { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function shortUrl(u){ try{ return new URL(u).hostname; } catch{ return u; } }

const Store = {
  get: k => new Promise(r => chrome.storage.local.get(k, r)),
  set: o => new Promise(r => chrome.storage.local.set(o, r)),
};

/* ══════════════════════════════════════════
   CLOCK
══════════════════════════════════════════ */
function tickClock(){
  const n = new Date();
  setText('clock',     `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`);
  setText('clockDate', `${DAYS[n.getDay()]} ${n.getDate()} ${MONTHS[n.getMonth()]} ${n.getFullYear()}`);
  setText('sysTime',   `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`);
  setText('sysDate',   `${DAYS[n.getDay()]} ${n.getDate()} ${MONTHS[n.getMonth()]} ${n.getFullYear()}`);
}
tickClock();
setInterval(tickClock, 1000);

/* ══════════════════════════════════════════
   NAVIGATION
   Search view → hides topbar
   Any other view → shows topbar
══════════════════════════════════════════ */
let activeView = 'feed';
const loaded   = new Set(['feed']);
const topbar   = document.getElementById('topbar');

function switchView(id){
  const el = document.getElementById('view-'+id);
  if(!el) return;
  activeView = id;

  // Hide topbar on search, restore otherwise
  topbar.classList.toggle('hidden', id === 'search');

  // Update nav buttons
  document.querySelectorAll('.nav-btn[data-view]').forEach(b =>
    b.classList.toggle('active', b.dataset.view === id)
  );
  // Switch views
  document.querySelectorAll('.view').forEach(v =>
    v.classList.toggle('active', v.id === 'view-'+id)
  );

  // Lazy init
  if(!loaded.has(id)){
    loaded.add(id);
    if(id === 'comms')     renderComms();
    if(id === 'sites')     loadSites();
    if(id === 'bookmarks') loadBookmarks();
    if(id === 'system')    { renderSystem(); setInterval(renderSystem, 5000); }
    if(id === 'agents')    renderAgents();
  }

  // Auto-focus big search when switching to search view
  if(id === 'search'){
    setTimeout(() => document.getElementById('bigSearch')?.focus(), 60);
  }
}

document.querySelector('.sidebar').addEventListener('click', e => {
  const btn = e.target.closest('.nav-btn[data-view]');
  if(btn){ e.preventDefault(); switchView(btn.dataset.view); }
});

/* ══════════════════════════════════════════
   SEARCH — opens results in new tab
══════════════════════════════════════════ */
const ENGINES = {
  google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  ddg:    q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  bing:   q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  brave:  q => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
};
let engine = 'google';

document.querySelectorAll('.engine-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    engine = btn.dataset.engine;
    document.querySelectorAll('.engine-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.engine === engine)
    );
  })
);

function doSearch(raw){
  const q = raw.trim(); if(!q) return;
  let url = null;
  try{
    const proto = /^https?:\/\//i.test(q) ? q : 'https://'+q;
    const u = new URL(proto);
    if(u.hostname.includes('.') && !q.includes(' ')) url = u.href;
  } catch{}
  window.open(url || ENGINES[engine](q), '_blank');
}

// Top search bar (visible on non-search views)
document.getElementById('topSearch').addEventListener('keydown', e => {
  if(e.key === 'Enter')  doSearch(e.target.value);
  if(e.key === 'Escape'){ e.target.value=''; e.target.blur(); }
});

// Big search in search view
document.getElementById('bigSearch').addEventListener('keydown', e => {
  if(e.key === 'Enter')  { doSearch(e.target.value); e.target.value=''; }
  if(e.key === 'Escape') { e.target.value=''; e.target.blur(); }
});

/* ══════════════════════════════════════════
   FEED — two-column editorial
══════════════════════════════════════════ */
const FEED_POSTS = [
  { mark:'SYS', handle:'recoil.system',  title:'RECOIL Dark.',       body:'Dark editorial dashboard. Bookmarks synced from browser. System panel shows tab memory estimates. Search takes priority — topbar hides when active.' },
  { mark:'DEV', handle:'null.ptr',        title:'git blame audit.',   body:'Shipped a bash util watching git blame — shows which lines you wrote got deleted most. Mine: premature abstractions.' },
  { mark:'IDX', handle:'phosphor',        title:'Dark on dark.',      body:'High contrast without colour. The negative space does the work. Every unnecessary element removed is clarity gained.' },
  { mark:'WRD', handle:'wren.bytes',      title:'Write ugly first.',  body:'Write the draft where you say exactly what you mean with zero elegance. Then rewrite until meaning stays.' },
  { mark:'OPS', handle:'cascade',         title:'BGP resolved.',      body:'Route flap stabilised. p99 thresholds updated. All systems nominal. RCA pending final review.' },
];

let feedFocused = 0;

function renderFeedHero(i){
  feedFocused = Math.max(0, Math.min(i, FEED_POSTS.length-1));
  const p = FEED_POSTS[feedFocused];
  setText('feed-hero-title', p.title);
  setText('feed-hero-body',  p.body);
  setText('feed-hero-mark2', p.mark);
  const hm = document.querySelector('.feed-hero-mark');
  if(hm) hm.innerHTML = `<span>${p.mark}</span> — ${p.handle}`;
  document.querySelectorAll('.feed-item').forEach((el,j) =>
    el.classList.toggle('selected', j === feedFocused)
  );
}

function initFeed(){
  const list = document.getElementById('feedList');
  list.innerHTML = FEED_POSTS.map((p,i) => `
    <div class="feed-item${i===0?' selected':''}" data-fi="${i}">
      <div class="feed-item-mark">${p.mark}</div>
      <div class="feed-item-title">${esc(p.title)}</div>
      <div class="feed-item-meta">${p.handle}</div>
    </div>
  `).join('');
  list.addEventListener('click', e => {
    const item = e.target.closest('.feed-item');
    if(item) renderFeedHero(+item.dataset.fi);
  });
}

/* ══════════════════════════════════════════
   TODO
══════════════════════════════════════════ */
async function getTodos(){ const d=await Store.get('rcl_todos'); return d.rcl_todos||[]; }
async function setTodos(arr){ await Store.set({rcl_todos:arr}); }

async function refreshTodo(){
  const todos   = await getTodos();
  const done    = todos.filter(t=>t.done).length;
  const total   = todos.length;
  const pct     = total>0 ? Math.round(done/total*100) : 0;
  const pending = todos.filter(t=>!t.done).length;

  const badge = document.getElementById('todoBadge');
  if(badge){ badge.textContent=pending; badge.style.display=pending>0?'inline':'none'; }
  setText('todoStat',    `${done} / ${total}`);
  setText('todoPercent', `${pct}%`);
  const fill = document.getElementById('todoFill');
  if(fill) fill.style.width = pct+'%';
  // Update statusbar todo hint
  const sbTodo = document.getElementById('sbTodoStatus');
  if(sbTodo){
    if(pending > 0) sbTodo.textContent = pending + ' task' + (pending===1?'':'s') + ' pending';
    else if(total > 0) sbTodo.textContent = 'all done ✓';
    else sbTodo.textContent = '';
  }

  const list = document.getElementById('todoList');
  if(!list) return;
  list.innerHTML = todos.length===0
    ? '<div class="empty-state">No tasks yet.</div>'
    : todos.map((t,i) => `
        <div class="todo-item${t.done?' done':''}">
          <div class="todo-check" data-action="toggle" data-i="${i}">${t.done?'✓':''}</div>
          <div class="todo-text">${esc(t.text)}</div>
          <button class="todo-del" data-action="delete" data-i="${i}">×</button>
        </div>
      `).join('');
}

function initTodo(){
  const input  = document.getElementById('todoInput');
  const addBtn = document.getElementById('todoAddBtn');
  const list   = document.getElementById('todoList');

  async function add(){
    const v = input.value.trim(); if(!v) return;
    const todos = await getTodos();
    todos.unshift({id:Date.now(),text:v,done:false});
    await setTodos(todos); input.value=''; refreshTodo();
  }
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') add(); });
  addBtn.addEventListener('click', add);
  list.addEventListener('click', async e=>{
    const act = e.target.dataset.action;
    const idx = parseInt(e.target.dataset.i, 10);
    if(!act||isNaN(idx)) return;
    const todos = await getTodos();
    if(act==='toggle') todos[idx].done=!todos[idx].done;
    if(act==='delete') todos.splice(idx,1);
    await setTodos(todos); refreshTodo();
  });
  refreshTodo();
}

/* ══════════════════════════════════════════
   JOURNAL
══════════════════════════════════════════ */
let jDate  = new Date().toISOString().slice(0,10);
let jTimer = null;
function todayKey(){ return new Date().toISOString().slice(0,10); }
function fmtDate(k){ const[y,m,d]=k.split('-'); return `${d} ${MONTHS[+m-1]} ${y}`; }
async function getJournal(){ const d=await Store.get('rcl_journal'); return d.rcl_journal||{}; }

async function renderJournal(){
  const j  = await getJournal();
  const ta = document.getElementById('jEditor');
  if(ta) ta.value = j[jDate]||'';
  setText('jDateLabel', fmtDate(jDate));

  const all = Object.keys(j).sort();
  const prevBtn = document.getElementById('jPrev');
  const nextBtn = document.getElementById('jNext');
  if(prevBtn) prevBtn.disabled = all.indexOf(jDate)<=0 && all.length===0;
  if(nextBtn) nextBtn.disabled = jDate>=todayKey();

  const hw = document.getElementById('jHistWrap');
  const hl = document.getElementById('jHistList');
  if(all.length>0 && hw && hl){
    hw.style.display='block';
    hl.innerHTML = all.slice().reverse().slice(0,8).map(k=>`
      <div class="j-hist-item" data-jdate="${k}">
        <span class="j-hist-date">${fmtDate(k)}</span>
        <span class="j-hist-preview">${esc((j[k]||'').slice(0,50))}…</span>
      </div>
    `).join('');
    hl.querySelectorAll('.j-hist-item').forEach(item =>
      item.addEventListener('click',()=>{ jDate=item.dataset.jdate; renderJournal(); })
    );
  } else if(hw) hw.style.display='none';
}

function initJournal(){
  const ta = document.getElementById('jEditor');
  if(ta){
    ta.addEventListener('input',()=>{
      clearTimeout(jTimer);
      setText('jStatus','saving…');
      jTimer = setTimeout(async()=>{
        const j = await getJournal();
        j[jDate] = ta.value;
        await Store.set({rcl_journal:j});
        const s = document.getElementById('jStatus');
        if(s){ s.textContent='saved'; setTimeout(()=>{ if(s) s.textContent=''; },2000); }
        renderJournal();
      },700);
    });
  }
  document.getElementById('jPrev')?.addEventListener('click', async()=>{
    const j=await getJournal(), all=Object.keys(j).sort(), idx=all.indexOf(jDate);
    if(idx>0) jDate=all[idx-1];
    else{ const d=new Date(jDate); d.setDate(d.getDate()-1); jDate=d.toISOString().slice(0,10); }
    renderJournal();
  });
  document.getElementById('jNext')?.addEventListener('click',()=>{
    const d=new Date(jDate); d.setDate(d.getDate()+1);
    const next=d.toISOString().slice(0,10);
    if(next<=todayKey()){ jDate=next; renderJournal(); }
  });
  document.getElementById('jToday')?.addEventListener('click',()=>{ jDate=todayKey(); renderJournal(); });
  renderJournal();
}

/* ══════════════════════════════════════════
   AI AGENTS
══════════════════════════════════════════ */
const DEF_AGENTS = [
  {id:1,label:'ChatGPT',   url:'https://chat.openai.com',   mark:'GPT'},
  {id:2,label:'Claude',    url:'https://claude.ai',          mark:'CLD'},
  {id:3,label:'Gemini',    url:'https://gemini.google.com',  mark:'GEM'},
  {id:4,label:'Perplexity',url:'https://perplexity.ai',      mark:'PPX'},
];
async function getAgents(){ const d=await Store.get('rcl_agents'); return d.rcl_agents&&d.rcl_agents.length?d.rcl_agents:DEF_AGENTS; }

async function renderAgents(){
  const links = await getAgents();
  const grid  = document.getElementById('agentsGrid');
  if(!grid) return;
  grid.innerHTML = links.map((lnk,i)=>`
    <a class="agent-card" href="${esc(lnk.url)}" target="_blank">
      <div class="agent-mark">${esc(lnk.mark||'—')}</div>
      <div class="agent-label">${esc(lnk.label)}</div>
      <div class="agent-url">${shortUrl(lnk.url)}</div>
      <button class="agent-del" data-i="${i}">×</button>
    </a>
  `).join('');
  grid.querySelectorAll('.agent-del').forEach(btn =>
    btn.addEventListener('click', async e=>{
      e.preventDefault(); e.stopPropagation();
      const cur = await getAgents();
      cur.splice(+e.currentTarget.dataset.i, 1);
      await Store.set({rcl_agents:cur}); renderAgents();
    })
  );
}

function initAgents(){
  document.getElementById('agentAdd')?.addEventListener('click', async()=>{
    const label = document.getElementById('agentName')?.value.trim();
    const url   = document.getElementById('agentUrl')?.value.trim();
    const mark  = (document.getElementById('agentMark')?.value.trim()||'').slice(0,4).toUpperCase()||'---';
    if(!label||!url) return;
    const cur = await getAgents();
    cur.push({id:Date.now(),label,url,mark});
    await Store.set({rcl_agents:cur});
    ['agentName','agentUrl','agentMark'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    renderAgents();
  });
  renderAgents();
}

/* ══════════════════════════════════════════
   BOOKMARKS — pulled from chrome.bookmarks API
══════════════════════════════════════════ */
let allBookmarks = [];

function renderBookmarkList(filter=''){
  const list = document.getElementById('bmList');
  if(!list) return;
  const q    = filter.trim().toLowerCase();
  const show = q
    ? allBookmarks.filter(b => (b.title||'').toLowerCase().includes(q) || (b.url||'').toLowerCase().includes(q))
    : allBookmarks;

  setText('bmCount', show.length + ' items');

  if(show.length===0){
    list.innerHTML = '<div class="empty-state">No bookmarks match.</div>';
    return;
  }
  list.innerHTML = show.slice(0,200).map(b => {
    const host = shortUrl(b.url);
    const fav  = `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
    return `
      <a class="bm-item" href="${esc(b.url)}" target="_blank">
        <div class="bm-fav"><img src="${fav}" loading="lazy" alt="" onerror="this.parentElement.textContent='○'"></div>
        <div class="bm-title">${esc(b.title || host)}</div>
        <div class="bm-host">${host}</div>
      </a>
    `;
  }).join('');
}

function loadBookmarks(){
  const list = document.getElementById('bmList');
  if(list) list.innerHTML='<div class="empty-state">Syncing from browser…</div>';

  chrome.runtime.sendMessage({action:'get-bookmarks'}, resp => {
    if(chrome.runtime.lastError || !resp){
      if(list) list.innerHTML='<div class="empty-state">Bookmarks API unavailable.</div>';
      return;
    }
    allBookmarks = resp.bookmarks || [];
    setText('bmCount', allBookmarks.length + ' items');
    renderBookmarkList();
  });
}

// Wired after DOM ready
function initBookmarks(){
  document.getElementById('bmSearch')?.addEventListener('input', e => {
    renderBookmarkList(e.target.value);
  });
  document.getElementById('bmRefresh')?.addEventListener('click', () => {
    loadBookmarks();
  });
}

/* ══════════════════════════════════════════
   COMMS
══════════════════════════════════════════ */
const COMMS = [
  {mark:'DSC',label:'Discord',  sub:'discord.com',      url:'https://discord.com/app'},
  {mark:'WHA',label:'WhatsApp', sub:'web.whatsapp.com', url:'https://web.whatsapp.com'},
  {mark:'TLG',label:'Telegram', sub:'web.telegram.org', url:'https://web.telegram.org'},
  {mark:'GML',label:'Gmail',    sub:'mail.google.com',  url:'https://mail.google.com'},
  {mark:'OTL',label:'Outlook',  sub:'outlook.live.com', url:'https://outlook.live.com'},
  {mark:'GHB',label:'GitHub',   sub:'github.com',       url:'https://github.com'},
  {mark:'NTN',label:'Notion',   sub:'notion.so',        url:'https://notion.so'},
  {mark:'LNR',label:'Linear',   sub:'linear.app',       url:'https://linear.app'},
];
function renderComms(){
  const el = document.getElementById('commsList');
  if(!el) return;
  el.innerHTML = COMMS.map(c=>`
    <a class="comm-link" href="${c.url}" target="_blank">
      <div class="comm-mark">${c.mark}</div>
      <div class="comm-info"><div class="comm-label">${c.label}</div><div class="comm-sub">${c.sub}</div></div>
      <div class="comm-arr">→</div>
    </a>
  `).join('');
}

/* ══════════════════════════════════════════
   TOP SITES
══════════════════════════════════════════ */
function loadSites(){
  const grid = document.getElementById('sitesGrid');
  try{
    chrome.topSites.get(sites=>{
      if(!sites||!sites.length){
        grid.innerHTML='<div class="empty-state">Browse the web to populate.</div>';
        return;
      }
      grid.innerHTML = sites.slice(0,16).map(s=>{
        const host = shortUrl(s.url);
        const fav  = `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
        return `
          <a class="site-card" href="${esc(s.url)}" target="_blank">
            <div class="site-fav"><img src="${fav}" loading="lazy" onerror="this.parentElement.textContent='○'"></div>
            <div>
              <div class="site-name">${esc((s.title||host).slice(0,22))}</div>
              <div class="site-host">${host}</div>
            </div>
          </a>`;
      }).join('');
    });
  } catch{ grid.innerHTML='<div class="empty-state">API unavailable.</div>'; }
}

/* ══════════════════════════════════════════
   SYSTEM — tab memory estimate
   Chrome doesn't expose per-tab memory in MV3 renderer.
   We estimate: tabs × avg heap per tab (empirically ~25 MB).
   Plus this page's own heap from performance.memory.
══════════════════════════════════════════ */
function renderSystem(){
  // Online / connection
  setText('sysOnline', navigator.onLine ? 'Online' : 'Offline');
  setText('sysOnlineCard', navigator.onLine ? 'Online' : 'Offline');
  const cn = navigator.connection;
  const netType = cn ? (cn.effectiveType||cn.type||'—').toUpperCase() : '—';
  setText('sysNet',  netType);
  setText('sysConn', netType);

  // Own heap (this tab)
  if(performance.memory){
    const usedMB  = (performance.memory.usedJSHeapSize  / 1048576).toFixed(1);
    const limitMB = (performance.memory.jsHeapSizeLimit   / 1048576).toFixed(0);
    const pct     = Math.round(performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100);
    setText('sysHeap',    usedMB);
    setText('sysHeapLim', limitMB);
    const bar = document.getElementById('sysHeapBar');
    if(bar) bar.style.width = pct + '%';
  } else {
    setText('sysHeap',    'N/A');
    setText('sysHeapLim', 'N/A');
  }

  // Tab count + estimated memory across all tabs
  chrome.runtime.sendMessage({action:'get-system-stats'}, resp => {
    if(!resp) return;
    const tabCount = resp.tabCount || 0;
    setText('sysTabs', tabCount);

    // Estimate: each tab uses ~25–80 MB depending on content
    // We use a conservative 40 MB average as a heuristic
    // since chrome.processes is not available in MV3
    const estimatedMB = (tabCount * 40).toFixed(0);
    const ownMB = performance.memory
      ? (performance.memory.usedJSHeapSize / 1048576).toFixed(0)
      : 0;
    setText('sysTabMem', `~${estimatedMB} MB estimated (${tabCount} tabs × 40 MB avg)`);
  });
}

/* ══════════════════════════════════════════
   KEYBOARD
══════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  const inInput = ['INPUT','TEXTAREA'].includes(document.activeElement?.tagName);
  if(inInput) return;

  if(e.key === '/'){
    e.preventDefault();
    if(activeView === 'search') document.getElementById('bigSearch')?.focus();
    else document.getElementById('topSearch')?.focus();
  }
  if(activeView === 'feed'){
    if(e.key==='ArrowDown'||e.key==='j'){ e.preventDefault(); renderFeedHero(feedFocused+1); }
    if(e.key==='ArrowUp'  ||e.key==='k'){ e.preventDefault(); renderFeedHero(feedFocused-1); }
  }
});

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
function init(){
  initFeed();
  initTodo();
  initJournal();
  initAgents();
  initBookmarks();
}
init();
