/* RECOIL — content.js
   Injects: sidebar + dark theme overlay onto visited pages */
'use strict';
(function(){
  if(window.__rclInjected) return;
  window.__rclInjected = true;

  const url = location.href;
  if(url.startsWith('chrome')||url.startsWith('about')||url.startsWith('edge')) return;

  function injectLink(href, id){
    if(document.getElementById(id)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; l.id = id;
    (document.head || document.documentElement).appendChild(l);
  }

  // ── DARK THEME on host page ─────────────────────────────
  function applyPageTheme(enabled){
    if(enabled){
      injectLink(chrome.runtime.getURL('styles/overlay.css'), 'rcl-overlay-css');
      document.documentElement.setAttribute('data-recoil', '1');
    } else {
      document.documentElement.removeAttribute('data-recoil');
    }
  }

  // ── SIDEBAR ─────────────────────────────────────────────
  let S = { rcl_sidebar: true }, mounted = false;

  function applySidebar(){
    if(!S.rcl_sidebar){
      const r = document.getElementById('lux-root');
      if(r) r.classList.add('lux-hidden');
      document.body?.classList.remove('lux-pushed');
      return;
    }
    if(!mounted){
      injectLink(chrome.runtime.getURL('styles/sidebar.css'), 'lux-sidebar-css');
      const sc = document.createElement('script');
      sc.src = chrome.runtime.getURL('sidebar.js');
      sc.onload = () => {
        mounted = true;
        document.body?.classList.add('lux-pushed');
      };
      (document.head || document.documentElement).appendChild(sc);
    } else {
      const r = document.getElementById('lux-root');
      if(r) r.classList.remove('lux-hidden');
      document.body?.classList.add('lux-pushed');
    }
  }

  // ── STORAGE LISTENER ────────────────────────────────────
  chrome.storage.onChanged.addListener((changes, area) => {
    if(area !== 'local') return;
    if('rcl_sidebar' in changes){
      S.rcl_sidebar = changes.rcl_sidebar.newValue;
      applySidebar();
    }
    // Live todo updates forwarded to sidebar
    if('rcl_todos' in changes && mounted){
      window.dispatchEvent(new CustomEvent('rcl-todos-changed'));
    }
  });

  // ── INIT ────────────────────────────────────────────────
  chrome.storage.local.get(['rcl_sidebar'], d => {
    Object.assign(S, d);
    // Apply dark theme immediately on all sites
    applyPageTheme(true);
    // Mount sidebar
    const run = () => applySidebar();
    if(document.body) run();
    else document.addEventListener('DOMContentLoaded', run);
  });
})();
