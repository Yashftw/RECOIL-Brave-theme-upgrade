/* LUX Sidebar v1 — Editorial Design */
(function(){
  'use strict';
  if(document.getElementById('lux-root')) return;

  const Store={
    get:k=>new Promise(r=>chrome.storage.local.get(k,r)),
    set:o=>new Promise(r=>chrome.storage.local.set(o,r)),
  };

  const PANELS=[
    {id:'feed',   label:'Feed',     num:'01'},
    {id:'todo',   label:'To-Do',    num:'02'},
    {id:'journal',label:'Journal',  num:'03'},
    {id:'agents', label:'AI',       num:'04'},
    {id:'comms',  label:'Comms',    num:'05'},
    {id:'sites',  label:'Sites',    num:'06'},
    {id:'system', label:'System',   num:'07'},
  ];

  /* BUILD DOM */
  const root=document.createElement('div');
  root.id='lux-root';
  root.innerHTML=`
    <div id="lux-header">
      <div id="lux-wordmark"><em>R</em>ECOIL</div>
      <div id="lux-sub">Liminal · Unbounded</div>
      <button id="lux-toggle" title="Toggle">◀</button>
    </div>
    <div id="lux-nav">
      ${PANELS.map((p,i)=>`
        <button class="lux-nav-item${i===0?' active':''}" data-panel="${p.id}">
          ${p.label}
          ${p.id==='todo'?'<span class="lux-badge" id="lux-todo-badge">0</span>':''}
          <span class="lux-nav-num">${p.num}</span>
        </button>
      `).join('')}
    </div>
    <div id="lux-panels">
      ${PANELS.map((p,i)=>`
        <div class="lux-panel${i===0?' active':''}" id="lux-panel-${p.id}">
          <div class="lux-panel-head">
            <div class="lux-panel-title">${p.label}</div>
            <div class="lux-panel-label">— ${p.num}</div>
          </div>
          <div class="lux-scroll" id="lux-scroll-${p.id}"></div>
        </div>
      `).join('')}
    </div>
    <div id="lux-statusbar">
      <div class="lux-dot"></div>
      <span id="lux-todo-stat" style="font-family:var(--lux-mono);font-size:8px;color:var(--lux-gray);letter-spacing:.06em"></span>
      <div id="lux-clock">--:--</div>
    </div>
  `;
  document.body.appendChild(root);

  /* TOGGLE */
  let visible=true;
  root.querySelector('#lux-toggle').addEventListener('click',()=>{
    visible=!visible;
    root.classList.toggle('lux-hidden',!visible);
    document.body.classList.toggle('lux-pushed',visible);
    root.querySelector('#lux-toggle').textContent=visible?'◀':'▶';
    Store.set({lux_sidebar:visible});
  });

  /* NAV */
  let active='feed';
  function switchPanel(id){
    active=id;
    root.querySelectorAll('.lux-nav-item').forEach(b=>b.classList.toggle('active',b.dataset.panel===id));
    root.querySelectorAll('.lux-panel').forEach(p=>p.classList.toggle('active',p.id==='lux-panel-'+id));
    
  }
  root.querySelector('#lux-nav').addEventListener('click',e=>{
    const btn=e.target.closest('.lux-nav-item');
    if(btn) switchPanel(btn.dataset.panel);
  });

  /* CLOCK */
  function pad(n){return String(n).padStart(2,'0');}
  function tickClock(){
    const d=new Date();
    setText('lux-clock',`${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }
  tickClock(); setInterval(tickClock,1000);

  /* UTILS */
  function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function shortUrl(u){try{return new URL(u).hostname;}catch{return u;}}

  /* ── FEED ── */
  const FEED=[
    {mark:'SYS',handle:'lux.system',body:'RECOIL — Dark v2. Editorial interface, persistent data, all panels functional.',time:'now'},
    {mark:'DEV',handle:'null.pointer',body:'git blame util: which lines you wrote got deleted most. Mine: premature abstractions.',time:'2h'},
    {mark:'IDX',handle:'phosphor',body:'Black on white. The original contrast. Every color palette since is negotiation.',time:'5h'},
    {mark:'WRD',handle:'wren.bytes',body:'Write the ugly draft. Say exactly what you mean with no elegance. Then rewrite.',time:'1d'},
  ];
  function initFeed(){
    const el=document.getElementById('lux-scroll-feed');
    el.innerHTML=FEED.map(p=>`
      <div class="lux-post">
        <div class="lux-post-handle"><span>${p.mark}</span> — ${esc(p.handle)}</div>
        <div class="lux-post-body">${esc(p.body)}</div>
        <div class="lux-post-meta"><span>${p.time} ago</span></div>
      </div>
    `).join('');
  }

  /* ── TODO ── */
  async function renderTodo(){
    const {rcl_todos:todos=[]}=await Store.get('rcl_todos');
    const el=document.getElementById('lux-scroll-todo');
    const done=todos.filter(t=>t.done).length, total=todos.length;
    const pct=total>0?Math.round(done/total*100):0;
    const pending=todos.filter(t=>!t.done).length;
    const badge=document.getElementById('lux-todo-badge');
    if(badge){badge.textContent=pending;badge.style.display=pending>0?'inline':'none';}

    el.innerHTML=`
      <div class="lux-input-row">
        <input class="lux-input" id="lux-todo-in" placeholder="Add task..." autocomplete="off">
        <button class="lux-btn" id="lux-todo-add">Add</button>
      </div>
      <div class="lux-progress">
        <div class="lux-progress-bar"><div class="lux-progress-fill" style="width:${pct}%"></div></div>
        <div class="lux-progress-text">${done}/${total}</div>
      </div>
      <div id="lux-todo-list">
        ${todos.length===0?'<div class="lux-empty">No tasks yet.</div>':
          todos.map((t,i)=>`
            <div class="lux-todo${t.done?' done':''}">
              <div class="lux-todo-check" data-act="toggle" data-i="${i}">${t.done?'✓':''}</div>
              <div class="lux-todo-text">${esc(t.text)}</div>
              <button class="lux-todo-del" data-act="del" data-i="${i}">×</button>
            </div>
          `).join('')}
      </div>
    `;

    const input=el.querySelector('#lux-todo-in');
    async function add(){
      const v=input.value.trim(); if(!v) return;
      const {rcl_todos:cur=[]}=await Store.get('rcl_todos');
      cur.unshift({id:Date.now(),text:v,done:false});
      await Store.set({rcl_todos:cur});
      input.value=''; renderTodo();
    }
    input.addEventListener('keydown',e=>{if(e.key==='Enter')add();});
    el.querySelector('#lux-todo-add').addEventListener('click',add);
    el.querySelector('#lux-todo-list').addEventListener('click',async e=>{
      const act=e.target.dataset.act, idx=parseInt(e.target.dataset.i,10);
      if(!act||isNaN(idx)) return;
      const {rcl_todos:cur=[]}=await Store.get('rcl_todos');
      if(act==='toggle') cur[idx].done=!cur[idx].done;
      if(act==='del') cur.splice(idx,1);
      await Store.set({rcl_todos:cur}); renderTodo();
    });
  }

  /* ── JOURNAL ── */
  let jDate=new Date().toISOString().slice(0,10), jTimer=null;
  const MONTHS_S=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  function fmtD(k){const[y,m,d]=k.split('-');return`${d} ${MONTHS_S[+m-1]} ${y}`;}
  function todayK(){return new Date().toISOString().slice(0,10);}

  async function renderJournal(){
    const {rcl_journal:j={}}=await Store.get('rcl_journal');
    const el=document.getElementById('lux-scroll-journal');
    const all=Object.keys(j).sort();
    el.innerHTML=`
      <div class="lux-j-nav">
        <button class="lux-btn ghost" id="lux-j-prev" ${all.indexOf(jDate)<=0?'disabled':''}>◀</button>
        <div class="lux-j-date">${fmtD(jDate)}</div>
        <button class="lux-btn ghost" id="lux-j-next" ${jDate>=todayK()?'disabled':''}>▶</button>
        <button class="lux-btn" id="lux-j-today">Now</button>
      </div>
      <textarea class="lux-textarea" id="lux-j-body" placeholder="Write...">${esc(j[jDate]||'')}</textarea>
      <div class="lux-j-status" id="lux-j-status"></div>
      ${all.length>0?`
        <div style="margin-top:16px;font-size:8px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--lux-gray);margin-bottom:10px;padding-top:14px;border-top:1px solid var(--lux-line)">History</div>
        ${all.slice().reverse().slice(0,6).map(k=>`
          <div class="lux-j-hist-item" data-jdate="${k}">
            <span class="lux-j-hist-date">${fmtD(k)}</span>
            <span class="lux-j-hist-preview">${esc((j[k]||'').slice(0,36))}…</span>
          </div>
        `).join('')}
      `:''}
    `;
    const ta=el.querySelector('#lux-j-body');
    ta.addEventListener('input',()=>{
      clearTimeout(jTimer);
      setText('lux-j-status','saving…');
      jTimer=setTimeout(async()=>{
        const {rcl_journal:jj={}}=await Store.get('rcl_journal');
        jj[jDate]=ta.value;
        await Store.set({rcl_journal:jj});
        const s=el.querySelector('#lux-j-status');
        if(s){s.textContent='saved';setTimeout(()=>{if(s)s.textContent='';},2000);}
        renderJournal();
      },700);
    });
    el.querySelector('#lux-j-prev')?.addEventListener('click',()=>{
      const idx=all.indexOf(jDate);
      if(idx>0) jDate=all[idx-1];
      else{const d=new Date(jDate);d.setDate(d.getDate()-1);jDate=d.toISOString().slice(0,10);}
      renderJournal();
    });
    el.querySelector('#lux-j-next')?.addEventListener('click',()=>{
      const d=new Date(jDate);d.setDate(d.getDate()+1);
      const n=d.toISOString().slice(0,10);
      if(n<=todayK()){jDate=n;renderJournal();}
    });
    el.querySelector('#lux-j-today')?.addEventListener('click',()=>{jDate=todayK();renderJournal();});
    el.querySelectorAll('.lux-j-hist-item').forEach(item=>
      item.addEventListener('click',()=>{jDate=item.dataset.jdate;renderJournal();})
    );
  }

  /* ── AGENTS ── */
  const DEF_AGENTS=[
    {id:1,label:'ChatGPT',url:'https://chat.openai.com',mark:'GPT'},
    {id:2,label:'Claude',url:'https://claude.ai',mark:'CLD'},
    {id:3,label:'Gemini',url:'https://gemini.google.com',mark:'GEM'},
    {id:4,label:'Perplexity',url:'https://perplexity.ai',mark:'PPX'},
  ];
  async function getAgents(){
    const {rcl_agents:a}=await Store.get('rcl_agents');
    return a&&a.length?a:DEF_AGENTS;
  }
  async function renderAgents(){
    const links=await getAgents();
    const el=document.getElementById('lux-scroll-agents');
    el.innerHTML=`
      <div class="lux-agent-grid">
        ${links.map((lnk,i)=>`
          <a class="lux-agent" href="${esc(lnk.url)}" target="_blank">
            <div class="lux-agent-mark">${esc(lnk.mark||'—')}</div>
            <div class="lux-agent-label">${esc(lnk.label)}</div>
            <div class="lux-agent-url">${shortUrl(lnk.url)}</div>
            <button class="lux-agent-del" data-i="${i}">×</button>
          </a>
        `).join('')}
      </div>
      <div class="lux-add-label">Add Agent</div>
      <div class="lux-input-row" style="margin-bottom:8px">
        <input class="lux-input" id="lux-ag-name" placeholder="Name" autocomplete="off">
        <input class="lux-input" id="lux-ag-mark" placeholder="Mark" style="max-width:68px" autocomplete="off">
      </div>
      <div class="lux-input-row">
        <input class="lux-input" id="lux-ag-url" placeholder="https://..." autocomplete="off">
      </div>
      <button class="lux-btn" id="lux-ag-add" style="width:100%;margin-top:4px">Add</button>
    `;
    el.querySelector('.lux-agent-grid').addEventListener('click',async e=>{
      const btn=e.target.closest('.lux-agent-del');
      if(!btn) return;
      e.preventDefault();e.stopPropagation();
      const cur=await getAgents();
      cur.splice(+btn.dataset.i,1);
      await Store.set({rcl_agents:cur}); renderAgents();
    });
    el.querySelector('#lux-ag-add').addEventListener('click',async()=>{
      const label=el.querySelector('#lux-ag-name').value.trim();
      const url=el.querySelector('#lux-ag-url').value.trim();
      const mark=el.querySelector('#lux-ag-mark').value.trim().slice(0,4).toUpperCase()||'---';
      if(!label||!url) return;
      const cur=await getAgents();
      cur.push({id:Date.now(),label,url,mark});
      await Store.set({rcl_agents:cur});
      ['#lux-ag-name','#lux-ag-url','#lux-ag-mark'].forEach(s=>{const e2=el.querySelector(s);if(e2)e2.value='';});
      renderAgents();
    });
  }

  /* ── COMMS ── */
  const COMMS=[
    {mark:'DSC',label:'Discord',   sub:'discord.com',      url:'https://discord.com/app'},
    {mark:'WHA',label:'WhatsApp',  sub:'web.whatsapp.com', url:'https://web.whatsapp.com'},
    {mark:'TLG',label:'Telegram',  sub:'web.telegram.org', url:'https://web.telegram.org'},
    {mark:'GML',label:'Gmail',     sub:'mail.google.com',  url:'https://mail.google.com'},
    {mark:'OTL',label:'Outlook',   sub:'outlook.live.com', url:'https://outlook.live.com'},
    {mark:'GHB',label:'GitHub',    sub:'github.com',       url:'https://github.com'},
    {mark:'NTN',label:'Notion',    sub:'notion.so',        url:'https://notion.so'},
    {mark:'LNR',label:'Linear',    sub:'linear.app',       url:'https://linear.app'},
  ];
  function initComms(){
    const el=document.getElementById('lux-scroll-comms');
    el.innerHTML=COMMS.map(c=>`
      <a class="lux-comm" href="${c.url}" target="_blank">
        <div class="lux-comm-mark">${c.mark}</div>
        <div class="lux-comm-info">
          <div class="lux-comm-label">${c.label}</div>
          <div class="lux-comm-sub">${c.sub}</div>
        </div>
        <div class="lux-comm-arr">→</div>
      </a>
    `).join('');
  }

  /* ── TOP SITES ── */
  function initSites(){
    const el=document.getElementById('lux-scroll-sites');
    el.innerHTML='<div class="lux-empty">Loading…</div>';
    try{
      chrome.topSites.get(sites=>{
        if(!sites||!sites.length){el.innerHTML='<div class="lux-empty">Browse the web to populate.</div>';return;}
        el.innerHTML=sites.slice(0,14).map(s=>{
          const host=shortUrl(s.url);
          return`<a class="lux-site" href="${esc(s.url)}" target="_blank">
            <div class="lux-site-fav"><img src="https://www.google.com/s2/favicons?domain=${host}&sz=32" loading="lazy" onerror="this.parentElement.textContent='○'"></div>
            <div class="lux-site-info">
              <div class="lux-site-name">${esc((s.title||host).slice(0,20))}</div>
              <div class="lux-site-host">${host}</div>
            </div>
          </a>`;
        }).join('');
      });
    }catch{el.innerHTML='<div class="lux-empty">API unavailable.</div>';}
  }

  /* ── SYSTEM ── */
  function initSystem(){
    const el=document.getElementById('lux-scroll-system');
    const DAYS=['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const MO=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    el.innerHTML=`
      <div class="lux-stat"><span class="lux-stat-k">Time</span><span class="lux-stat-v" id="lux-sys-time">--</span></div>
      <div class="lux-stat"><span class="lux-stat-k">Date</span><span class="lux-stat-v" id="lux-sys-date">--</span></div>
      <div class="lux-stat"><span class="lux-stat-k">Tabs</span><span class="lux-stat-v" id="lux-sys-tabs">--</span></div>
      <div class="lux-stat"><span class="lux-stat-k">Online</span><span class="lux-stat-v" id="lux-sys-online">--</span></div>
      <div class="lux-stat"><span class="lux-stat-k">Network</span><span class="lux-stat-v" id="lux-sys-conn">--</span></div>
      <div style="padding-top:14px;border-top:1px solid var(--lux-line);margin-top:6px">
        <div class="lux-stat"><span class="lux-stat-k">JS Heap</span><span class="lux-stat-v" id="lux-sys-heap">--</span></div>
        <div class="lux-stat-bar"><div class="lux-stat-fill" id="lux-sys-heap-bar" style="width:0%"></div></div>
        <div class="lux-stat"><span class="lux-stat-k">Limit</span><span class="lux-stat-v" id="lux-sys-heap-lim">--</span></div>
      </div>
    `;
    function update(){
      const n=new Date();
      setText('lux-sys-time',[n.getHours(),n.getMinutes(),n.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':'));
      setText('lux-sys-date',`${DAYS[n.getDay()]} ${n.getDate()} ${MO[n.getMonth()]} ${n.getFullYear()}`);
      setText('lux-sys-online',navigator.onLine?'Online':'Offline');
      const cn=navigator.connection;
      setText('lux-sys-conn',cn?(cn.effectiveType||cn.type||'—').toUpperCase():'—');
      if(performance.memory){
        const u=(performance.memory.usedJSHeapSize/1048576).toFixed(1);
        const lim=(performance.memory.jsHeapSizeLimit/1048576).toFixed(0);
        const pct=Math.round(performance.memory.usedJSHeapSize/performance.memory.jsHeapSizeLimit*100);
        setText('lux-sys-heap',u+' MB');
        setText('lux-sys-heap-lim',lim+' MB');
        const b=document.getElementById('lux-sys-heap-bar');
        if(b)b.style.width=pct+'%';
      }
      try{chrome.runtime.sendMessage({action:'get-tab-count'},r=>{if(r)setText('lux-sys-tabs',r.count);});}catch{}
    }
    update(); setInterval(update,4000);
  }

  /* INIT */
  initFeed();
  renderTodo();
  renderJournal();
  renderAgents();
  initComms();
  initSites();
  initSystem();

  // Live todo sync from newtab
  window.addEventListener('rcl-todos-changed', () => renderTodo());
  // Also poll storage for cross-tab updates
  setInterval(async () => {
    const {rcl_todos:t=[]} = await Store.get('rcl_todos');
    const pending = t.filter(x=>!x.done).length;
    const total   = t.length;
    const stat = document.getElementById('lux-todo-stat');
    if(stat){
      if(pending>0) stat.textContent=pending+' pending';
      else if(total>0) stat.textContent='done ✓';
      else stat.textContent='no tasks';
    }
    const badge = document.getElementById('lux-todo-badge');
    if(badge){ badge.textContent=pending; badge.style.display=pending>0?'flex':'none'; }
  }, 10000);
})();
