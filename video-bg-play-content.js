'use strict';

const IS_YOUTUBE = IsYoutube;

function IsYoutube()
{    
    const testyt = /(^|\.)(youtube|youtube-nocookie)\.(com|net|org|co\.[a-z]{2})$/i.test(location.hostname);
    console.log("testyt:", testyt);
    if (testyt) return true;
    // �������� ���������� ��������� YouTube
    if (document.querySelector('ytd-app, #player, ytm-mobile-page')) return true;
    
    // �������� �� ����-�����
    const meta = document.querySelector('meta[property="og:site_name"]');
    return meta && meta.content.toLowerCase().includes('youtube');
}

function isMobileYouTube() {
  // 1. �������� �� URL
  if (location.hostname.startsWith('m.') || location.hostname === 'youtube.com') {
    const path = location.pathname;
    if (path.startsWith('/watch') || path.startsWith('/shorts')) return true;
  }

  // 2. �������� ��������� �������
  const mobileClasses = [
    'ytm-pivot-bar',      // ������ ���������
    'ytm-slim-page',      // ������� ��������� ������
    'ytm-player-container'// ��������� ������
  ];
  
  // 3. �������� ��������� ���������
  const mobileAttributes = {
    'data-is-mobile': 'true',
    'ytm-version': /\d+/,
    'is-mobile-app': null
  };

  return [
    // �������� �������
    mobileClasses.some(c => document.getElementsByClassName(c).length > 0),
    
    // �������� ���������
    Object.entries(mobileAttributes).some(([attr, val]) => {
      const element = document.querySelector(`[${attr}]`);
      if (!element) return false;
      return val instanceof RegExp 
        ? val.test(element.getAttribute(attr))
        : element.hasAttribute(attr);
    }),
    
    // �������� ����� user-agent (��������� �����)
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  ].some(Boolean);
}

function isVimeo() {
  // 1. �������� network-��������
  const networkEvidence = performance.getEntriesByType('resource').some(entry => 
    entry.name.includes('player.vimeo.com') || 
    entry.initiatorType === 'xmlhttprequest' && entry.name.includes('/vimeo/')
  );

  // 2. �������� ����� WebAssembly (����� ������ Vimeo)
  const wasmCheck = Array.from(document.scripts).some(script => 
    script.src.includes('vimeo.com/wasm/')
  );

  // 3. ������ Web Workers
  const workerCheck = Array.from(navigator.serviceWorker?.controller?.scriptURL || []).some(url => 
    url.includes('vimeo.com/sw.js')
  );

  // 4. �������� WebGL (��������� �����)
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  const webglCheck = gl ? 
    gl.getParameter(gl.VENDOR).includes('Vimeo') : 
    false;

  return networkEvidence || wasmCheck || workerCheck || webglCheck;
}

const IS_MOBILE_YOUTUBE = isMobileYouTube();
const IS_DESKTOP_YOUTUBE = IS_YOUTUBE && !IS_MOBILE_YOUTUBE;
const IS_VIMEO = isVimeo;

const IS_ANDROID = window.navigator.userAgent.indexOf('Android') > -1;
const ANDROID_YOUTUBE_CLASSES = [
  'ytm-pivot-bar', 
  'ytm-slim-page',
  'ytm-player-container'
];

const isAndroidYoutube = () => ANDROID_YOUTUBE_CLASSES.some(c => document.getElementsByClassName(c).length > 0);

console.log('User Agent:', navigator.userAgent);
console.log('Hostname:', location.hostname);
console.log('IS_YOUTUBE:', IS_YOUTUBE);
console.log('IS_YOUTUBE():', IS_YOUTUBE());
console.log('IS_DESKTOP_YOUTUBE:', IS_DESKTOP_YOUTUBE);
console.log('IS_MOBILE_YOUTUBE:', IS_MOBILE_YOUTUBE);
console.log('IS_ANDROID:', IS_ANDROID);
console.log('isAndroidYoutube:', isAndroidYoutube);
console.log('isAndroidYoutube():', isAndroidYoutube());

console.log('IS_VIMEO:', IS_VIMEO);
console.log('IS_VIMEO():', IS_VIMEO());

function overrideVisibilityAPI()
{
    window.addEventListener( 'visibilitychange', evt => evt.stopImmediatePropagation(), true); //��������� ����������� ����� ��� ���������� ������

    // �������� ������������ Page Visibility API
    Object.defineProperty(document, 'hidden', {  get: () => false,  configurable: true});
    Object.defineProperty(document, 'visibilityState', {  get: () => 'visible',  configurable: true});

    // ��������� ������� ��������� ���������
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = function(type, listener, options) 
    {
        if (type === 'visibilitychange') return;
        originalAddEventListener.call(document, type, listener, options);
    };

    console.log(`Page Visibility API`);
}

function startWorker()
{
  console.log('Starting Web Worker');
  
  const worker = new Worker('worker.js');
  
  worker.onmessage = (e) => {
    if (e.data.type === 'ping') {
      console.log('Worker ping received');
      
      // ��������� ���������� � �������� ������
      simulateActivity();
      document.dispatchEvent(new Event('keepAlive'));
    }
  };

  worker.postMessage('start');
}

function simulateActivity() {
  try {
    console.log('Simulating activity');
    
    // �������� ���������������� ����������
    const events = ['mousemove', 'keydown', 'scroll'];
    events.forEach(event => {
      document.dispatchEvent(new Event(event, { bubbles: true }));
    });
    
    // �������������� ���������� ��� YouTube
    if (IS_YOUTUBE) {
      document.querySelector('video')?.play();
    }
  } catch (e) {
    console.error('Activity simulation failed:', e);
  }
}

function init() 
{
    console.log('init');
    if (IS_ANDROID || !IS_DESKTOP_YOUTUBE || IS_YOUTUBE() || isAndroidYoutube())
    {
        console.log('Initializing YouTube background playback');
        
        // ���� �������� ������
        overrideVisibilityAPI();
        startWorker();
        scheduleCyclicTask(pressKey, 48000, 59000);
    }
    // Fullscreen API
    if (IS_VIMEO)
    {
        window.addEventListener('fullscreenchange', evt => evt.stopImmediatePropagation(), true);
    }
}

// ��������� �������� ��� �������� � ��� ���������� DOM
init();

// �������� ����� ������ �������� ��������
document.addEventListener('DOMContentLoaded', () => {
  console.log('Vimeo detected:', isVimeo());
  console.log('Mobile YouTube:', isMobileYouTube());
});

// ��� SPA (YouTube/Vimeo)
new MutationObserver(() => {
  console.log('Dynamic update - Vimeo:', isVimeo());
  console.log('Dynamic update - Mobile YouTube:', isMobileYouTube());
}).observe(document, {
  subtree: true,
  childList: true,
  attributes: true
});


let vimeoCheckAttempts = 0;
const maxAttempts = 5;

function checkVimeoWithRetry() {
  if(isVimeo() || vimeoCheckAttempts >= maxAttempts) return;
  
  vimeoCheckAttempts++;
  setTimeout(checkVimeoWithRetry, 1500);
}

// ������ ��� ����� ���������� DOM
new MutationObserver(checkVimeoWithRetry).observe(document, {
  childList: true,
  subtree: true,
  attributes: true
});

const vimeoDetector = {
  thresholds: {
    vimeoKeywords: 5,
    videoTags: 2
  },
  keywords: ['vimeo', 'vp_', 'clip_id'],
  
  analyze() {
    const textContent = document.body.innerText.toLowerCase();
    const keywordCount = this.keywords.filter(kw => textContent.includes(kw)).length;
    const videoTags = document.querySelectorAll('video').length;
    
    return keywordCount >= this.thresholds.vimeoKeywords && 
           videoTags >= this.thresholds.videoTags;
  }
};

// ������ ������� ������ 2 �������
const observer = new MutationObserver(() => {
  if (vimeoDetector.analyze()) {
    console.log('Vimeo detected through content analysis');
    handleVimeoDetection();
  }
});

observer.observe(document, {
  characterData: true,
  childList: true,
  subtree: true
});

// �������� ����� DNS prefetch
const dnsPrefetchLinks = Array.from(document.querySelectorAll('link[rel="dns-prefetch"]'));
const dnsCheck = dnsPrefetchLinks.some(link => 
  link.href.includes('vimeo.com')
);

// ������ CSP headers
const cspCheck = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content.includes('vimeo');

// �������� ����� Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const fingerprint = audioContext.createAnalyser().frequencyBinCount;
const audioCheck = fingerprint > 1024; // Vimeo-specific Web Audio setup

console.log('Vimeo detection debug:', {
  network: performance.getEntriesByType('resource')
    .filter(e => e.name.includes('vimeo')),
  wasm: Array.from(document.scripts)
    .map(s => s.src),
  workers: navigator.serviceWorker?.controller?.scriptURL,
  //webgl: gl?.getParameter(gl.VENDOR),
  android: typeof android !== 'undefined',
  dns: dnsPrefetchLinks.map(l => l.href),
  csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content,
  audio: fingerprint
});







// ���������� ��������� ��� ����������� URL Vimeo
// ��� ��������� � vimeo.com � ������ �����������, ������ ��� player.vimeo.com
const VIMEO_URL_REGEX = /^https?:\/\/(?:[^.]+\.)?vimeo\.com/;

/**
 * ���������, �������� �� URL ������� ��������� Vimeo.
 * @param {object} tab - ������ �������, ��������������� browser.tabs API.
 */
function checkIfVimeoPage(tab) {
  // ���������, ��� � ������� ���� URL � �� ��������� � ����� ���������� ����������
  if (tab.url && VIMEO_URL_REGEX.test(tab.url)) {
    console.log(`���������� �������� Vimeo �� ������� ${tab.id}: ${tab.url}`);
    // ����� �� ������ ��������� ����� ��������, ����� �������� Vimeo ����������:
    // 1. �������� ������ ����������
    // browser.action.setIcon({ tabId: tab.id, path: "icons/vimeo-active-icon.png" });
    // 2. ��������� ��������� popup-�������
    // browser.runtime.sendMessage({ type: "VIMEO_PAGE_DETECTED", tabId: tab.id, url: tab.url });
    // 3. ������������� �������-������ (���� � ��� ���� ���������� "scripting")
    // injectContentScript(tab.id);
    return true;
  } else {
    // console.log(`�� �������� Vimeo �� ������� ${tab.id}: ${tab.url}`);
    // ���� ��� ����� �������� ���������, ����� ������� �� Vimeo:
    // browser.action.setIcon({ tabId: tab.id, path: "icons/icon-16.png" }); // ������� ������ �� ���������
    return false;
  }
}

// ��������� ��� ��������� URL �������
// �� �����������, ����� ������� �����������, ���������������� ��� ��������� ����� URL
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // `changeInfo.url` ��������� �� ��, ��� URL ������� ���������
  // ��� �� ������ ������������ `changeInfo.status === 'complete'` ��� ��������, ����� �������� ��������� �����������
  if (changeInfo.url) { // ��� changeInfo.status === 'complete' ��� ����� ������ ��������
    checkIfVimeoPage(tab);
  }
});

// �������������: ��������� ��� ������������ ������� ��� ������� ����������
browser.tabs.query({}).then(tabs => {
  for (let tab of tabs) {
    checkIfVimeoPage(tab);
  }
});

/*
// ������ ������� ��� �������������� �������-������� (���� ���������� ����������������� � DOM)
// ��� ����� ��� ����� �������� "scripting" � permissions � host_permissions ��� ������ Vimeo
async function injectContentScript(tabId) {
  try {
    await browser.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content-script.js"] // ��� ������ �������-�������
    });
    console.log(`�������-������ ������� ������������ �� ������� ${tabId}`);
  } catch (error) {
    console.error(`������ ��� �������������� �������-������� �� ������� ${tabId}:`, error);
  }
}
*/







window.addEventListener('error', e => 
    {
        console.error('Global error:', e.message, e.filename, e.lineno);
    }
);


function pressKey() 
{
    try
    {
        // ...��� ...    
        const keyCodes = [18];
        let key = keyCodes[getRandomInt(0, keyCodes.length)];
        sendKeyEvent("keydown", key);
        sendKeyEvent("keyup", key);
        
        console.log(`pressKey executed at ${Date.now()}`);
    }
    catch (e)
    {
        console.error('pressKey error:', e);
    }
    console.log(`pressKey`);
}

function sendKeyEvent (aEvent, aKey)
{
    document.dispatchEvent(new KeyboardEvent(aEvent, 
    {
        bubbles: true,
        cancelable: true,
        keyCode: aKey,
        which: aKey,
    }));
}

/**
 * ���������� ��������� callback �� ��������� ��������� ����� ��������
 * @param {Function} callback - ������� ��� ����������
 * @param {number} minDelayMs - ����������� �������� (������������)
 * @param {number} maxDelayMs - ������������ �������� (������������)
 */
function scheduleCyclicTask(callback, minDelayMs, maxDelayMs) {
  // ��������� ����������
  if (minDelayMs < 0 || maxDelayMs < minDelayMs) {
    throw new Error('Invalid delay parameters');
  }

  // ��������� ��������� �������� � �������� ���������
  const getRandomDelay = () => 
    Math.floor(Math.random() * (maxDelayMs - minDelayMs)) + minDelayMs;

  // ������������ ���������� ����������
  const scheduleNext = () => {
    const delay = getRandomDelay();
    window.setTimeout(() => {
      callback();
      scheduleNext();
    }, delay);
  };

  // ������ ������
  scheduleNext();
}

function getRandomInt(aMin, aMax) {
  return Math.floor(Math.random() * (aMax - aMin)) + aMin;
}
