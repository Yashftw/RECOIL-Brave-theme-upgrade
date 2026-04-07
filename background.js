'use strict';
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    rcl_sidebar: true,
    rcl_todos: [],
    rcl_journal: {},
    rcl_agents: [
      {id:1,label:'ChatGPT',   url:'https://chat.openai.com',   mark:'GPT'},
      {id:2,label:'Claude',    url:'https://claude.ai',          mark:'CLD'},
      {id:3,label:'Gemini',    url:'https://gemini.google.com',  mark:'GEM'},
      {id:4,label:'Perplexity',url:'https://perplexity.ai',      mark:'PPX'},
    ],
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Sum memory across all tabs (estimated via tab count × avg)
  if (msg.action === 'get-system-stats') {
    chrome.tabs.query({}, tabs => {
      // processMemory is not available in MV3 bg; we return tab count
      // and let the page use performance.memory for its own heap
      sendResponse({ tabCount: tabs.length });
    });
    return true;
  }
  if (msg.action === 'get-bookmarks') {
    chrome.bookmarks.getTree(tree => {
      // Flatten all bookmark nodes (not folders)
      function flatten(nodes, result=[]) {
        for (const n of nodes) {
          if (n.url) result.push({ title: n.title, url: n.url, id: n.id });
          if (n.children) flatten(n.children, result);
        }
        return result;
      }
      sendResponse({ bookmarks: flatten(tree) });
    });
    return true;
  }
});
