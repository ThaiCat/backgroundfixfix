'use strict';

const IS_ANDROID = window.navigator.userAgent.indexOf('Android') > -1;
let IS_YOUTUBE = false;

console.log('User Agent:', navigator.userAgent);
console.log('Hostname:', location.hostname);
console.log('IS_ANDROID:', IS_ANDROID);


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

// ���������� ��������� ��� ����������� URL Vimeo
const VIMEO_URL_REGEX = /^https?:\/\/(?:[^.]+\.)?vimeo\.com/;

// ���������� ��������� ��� ����������� URL YouTube (�������� ��������� ���� m.youtube.com, music.youtube.com � �.�.)
// � ����� �������� ����� youtube.com
const YOUTUBE_URL_REGEX = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)?(?:youtube\.com|youtu\.be)/;

/**
 * ����������� �������, ������� ���������� true, ���� ������� �������� ������� �������� ��������� Vimeo,
 * ����� ���������� false.
 *
 * ��������� ��������� ���������� � ������� - ��� ����������� ��������, ��� ������� ������ ���� async
 * � ����� ���������� Promise, ������� ���������� � boolean (true/false).
 *
 * @returns {Promise<boolean>} ������, ������� ����������� � true, ���� ������� �������� ������� - Vimeo, ����� false.
 */
async function isCurrentTabVimeo() {
  try {
    // ����������� �������� ������� � ������� ����
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });

    // ���� ����� �������� �������
    if (tabs && tabs.length > 0) {
      const currentTab = tabs[0];
      _currentTab = currentTab;
      // ��������� URL ���� �������
      return currentTab.url && VIMEO_URL_REGEX.test(currentTab.url);
    }
  } catch (e) {
    console.log("[isCurrentTabVimeo] exception ignored");
    // � ������ ������ ������������, ��� ��� �� Vimeo
    return false;
  }
  // ���� ������� �� ������� ��� ���-�� ����� �� ���
  return false;
}


function logTabs(tabs)
{  // tabs[0].url requires the `tabs` permission or a matching host permission.
    console.log("tabs:", tabs);
}
function onError(error)
{
    console.error(`Error: ${error}`);
}

function isCurrentTabYouTube() 
{
    return browser.tabs.query({ active: true, currentWindow: true }).then(tabs => 
    {
        console.log("tabs:", tabs);
        if (tabs && tabs.length > 0)
        {
            console.log('Tabs found:', tabs); // ��� ��� �������
            const currentTab = tabs[0];
            _currentTab = currentTab;
            console.log('_currentTab set to:', _currentTab); // ��� ������������
            
            console.log("currentTab.url && YOUTUBE_URL_REGEX.test(currentTab.url) ", currentTab.url && YOUTUBE_URL_REGEX.test(currentTab.url));
            return currentTab.url && YOUTUBE_URL_REGEX.test(currentTab.url);
        }
        return false;
    })
    .catch(error =>
    {
        console.log("[isCurrentTabYouTube] 1e", error);
        return false;
    });
}


let _currentTab = null;
let _tabId = null;




const originalClose = window.close;

window.close = function() {
  // ���������, ���� �� �������� �����/�����
  const mediaElements = document.querySelectorAll('video, audio');
  const isMediaPlaying = [...mediaElements].some(media => !media.paused);

  // �������� ��������, ���� ����� ������
  if (isMediaPlaying) {
    console.log("Blocked automatic tab closure.");
    return;
  }

  // �������� ������������ �����
  originalClose.apply(this, arguments);
};

// ���������� ��������������� ��� �������� �����
window.addEventListener("beforeunload", (e) => {
  const mediaElements = document.querySelectorAll('video, audio');
  const isMediaPlaying = [...mediaElements].some(media => !media.paused);
  
  if (isMediaPlaying && !e.isTrusted) { // isTrusted: false ��� ����������� �������
    e.preventDefault();
    e.returnValue = "";
  }
}, { capture: true });



// ��������� ��������� �������� ����� 500-1000 ��
const getShortDelay = () => Math.floor(Math.random() * 500) + 500;

// ��������� ��������� �������� ����� 20-30 ������
const getMainDelay = () => Math.floor(Math.random() * 10001) + 20000;

async function simulateActivityCycle()
{
    console.log(`[KeepAlive] Simulate activity. Timestamp: ${_tabId} ${new Date().toLocaleTimeString()}`);
    // 1. Mousemove
    document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: Math.random() * window.innerWidth,
        clientY: Math.random() * window.innerHeight
    }));
    await new Promise(r => setTimeout(r, getShortDelay()));
    
    // 2. Keydown + Keyup
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
    await new Promise(r => setTimeout(r, Math.random() * 150 + 50));
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }));
    await new Promise(r => setTimeout(r, getShortDelay()));
    
    // 3. Scroll
    window.scrollBy(0, Math.random() * 10 - 5); // ����������� ���������
    await new Promise(r => setTimeout(r, getShortDelay()));
        
    // �������������� ���������� ��� YouTube
    if (IS_YOUTUBE)
    {
        document.querySelector('video')?.play();
    }
    // ��������� ���� ����� 20-30 ���
    setTimeout(simulateActivityCycle, getMainDelay());
}

// ������ ������
//setTimeout(simulateActivityCycle, getMainDelay());
function startWorker()
{
  console.log('Starting Web Worker');
  
  const worker = new Worker('worker.js');
  
  worker.onmessage = (e) =>
  {
      // "debug: Worker �������"
      console.log("worker message: ", e.data);
  };

  worker.postMessage('start');
}
/*
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
*/



// --- ������� ������������� ����� ������� ---

// ������� ��� ��������� ��������� ������� ������� (Vimeo/YouTube/Other)
async function handleTabStatusChange() {
  //  const isVimeo = await isCurrentTabVimeo();
   // const isYouTube = await isCurrentTabYouTube();
    
    /*
    console.log("isVimeo", isVimeo);
    console.log("isYouTube", isYouTube);*/
}


// 1. ��������� ��� ������������ �������
browser.tabs.onActivated.addListener(async (activeInfo) => {
    _tabId = activeInfo.tabId;
  console.log(`[Event: onActivated] Tab ${activeInfo.tabId} activated.`);
  await handleTabStatusChange();
});

// 2. ��������� ��� ���������� �������
//browser.tabs.onUpdated.addListener(() => {init();});

// 2. ��������� ��� ���������� �������
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) {
    console.log(`[Event: onUpdated] CurrentTab ${tabId} updated.`);
    await handleTabStatusChange();
  }
});

/*
// 3. ��������� �������� ��� ������� ����������
(async () => {
  console.log("[Initial Check]");
  await handleTabStatusChange();
})();
*/






window.addEventListener('error', e => 
    {
        console.error('Global error:', e.message, e.filename, e.lineno);
    }
);


function getRandomInt(aMin, aMax) 
{
  return Math.floor(Math.random() * (aMax - aMin)) + aMin;
}

// ���������� Set ��� ������������ tabId, � ������� ������� keep_alive ������.
// ��� ������� �������� ���������� �������������� � ��������� ����������.
const activeKeepAliveTabs = new Set();
/**
 * ����������� keep_alive.js � ��������� ������� � ���������� ������� START_KEEP_ALIVE.
 * @param {number} tabId
 */
async function startKeepingTabAlive(tabId) {
    if (activeKeepAliveTabs.has(tabId)) {
        console.log(`[Background] Keep-alive ��� ������� ��� ������� ${tabId}. ���������� ��������� �������.`);
        // ���������� ������� ��� ���, �� ������ ���� �������-������ ��� �������� ��� ��� ��������� ����������.
        browser.tabs.sendMessage(tabId, { type: "START_KEEP_ALIVE" }).catch(e => console.warn(`[Background] ������ �������� START ��� ${tabId}:`, e));
        return;
    }

    try {
        // ����������� ������. ���� �� ��� ������������, Firefox ��� ����������.
        // `executeScript` ����� ���������� ���������, �� ��� �� ����� �� �����.
        await browser.scripting.executeScript({
            target: { tabId: tabId },
            files: ["keep_alive.js"]
        });
        console.log(`[Background] �������-������ keep_alive.js ������������ �� ������� ${tabId}.`);

        // ���������� ��������� �������-�������, ����� �� ����� ���� ������
        await browser.tabs.sendMessage(tabId, { type: "START_KEEP_ALIVE" });
        activeKeepAliveTabs.add(tabId);
        console.log(`[Background] ���������� ������� START_KEEP_ALIVE ��� ������� ${tabId}.`);
    } catch (error) {
        console.error(`[Background] ������ ��� ��������������/������� keep-alive ��� ������� ${tabId}:`, error);
    }
}

/**
 * ���������� ������� STOP_KEEP_ALIVE �������-������� � ��������� �������.
 * @param {number} tabId
 */
async function stopKeepingTabAlive(tabId) {
    if (!activeKeepAliveTabs.has(tabId)) {
        console.log(`[Background] Keep-alive ��������� ��� ������� ${tabId}, ��� ������������� �������������.`);
        return;
    }

    try {
        // ���������� ��������� �������-�������, ����� �� ��������� ���� ������
        await browser.tabs.sendMessage(tabId, { type: "STOP_KEEP_ALIVE" });
        activeKeepAliveTabs.delete(tabId);
        console.log(`[Background] ���������� ������� STOP_KEEP_ALIVE ��� ������� ${tabId}.`);
    } catch (error) {
        // ���� �������-������ ��� ��������� (��������, ������� ���� ���������/�������),
        // sendMessage ����� ��������� ������. ��� ���������.
        console.warn(`[Background] ������ �������� STOP_KEEP_ALIVE ��� ������� ${tabId} (��������, ��� ���������):`, error);
        activeKeepAliveTabs.delete(tabId); // ������� �� ������ ������ �� ������ ������
    }
}






function init()
{
    console.log("init");

    isCurrentTabYouTube().then(isYouTube => 
    {    
        IS_YOUTUBE = isYouTube;
        console.log("Check for youtube");
        if(IS_YOUTUBE || IS_ANDROID)
        {
            console.log("IS_YOUTUBE:",IS_YOUTUBE, ", IS_ANDROID:",IS_ANDROID);
            overrideVisibilityAPI();
            startWorker();

            console.log("_tabId", _tabId , "_currentTab",_currentTab );

            //startKeepingTabAlive(_currentTab.id);
            
            // ������ ������
            setTimeout(simulateActivityCycle, getMainDelay());
        }
    });
    
    isCurrentTabVimeo().then(isVimeo =>
    {    
        console.log("Check for vimeo");        
        if(isVimeo)
        {
            console.log("isVimeo:",isVimeo);
            window.addEventListener('fullscreenchange', evt => evt.stopImmediatePropagation(), true);
        }  
    });
}

init();

