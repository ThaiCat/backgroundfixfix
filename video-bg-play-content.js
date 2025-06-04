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


/**
 * ����������� �������, ������� ���������� true, ���� ������� �������� ������� �������� ��������� YouTube (��� ��������� YouTube),
 * ����� ���������� false.
 * @returns {Promise<boolean>} ������, ������� ����������� � true, ���� ������� �������� ������� - YouTube, ����� false.
 */
async function isCurrentTabYouTube() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
      const currentTab = tabs[0];
      return currentTab.url && YOUTUBE_URL_REGEX.test(currentTab.url);
    }
  } catch (e) {
    console.log("[isCurrentTabYouTube] youtube tab exception ignored");
    return false;
  }
  return false;
}

function init()
{
    isCurrentTabYouTube().then(isYouTube =>
    {    
        IS_YOUTUBE = true;
        console.log("Check for youtube");
        if(IS_ANDROID)
        {
            console.log("YouTube android");
            overrideVisibilityAPI();
            setTimeout(simulateActivityCycle, getMainDelay());
            //preventClose();
            //startWorker();
            //scheduleCyclicTask(pressKey, 25000, 30000);
        }    
    });
    
    isCurrentTabVimeo().then(isVimeo =>
    {    
        console.log("Check for vimeo");        
        if(isVimeo)
        {
            window.addEventListener('fullscreenchange', evt => evt.stopImmediatePropagation(), true);
        }  
    });
}

init();



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

async function simulateActivityCycle() {
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

  // ��������� ���� ����� 20-30 ���
  setTimeout(simulateActivityCycle, getMainDelay());
}

// ������ ������
setTimeout(simulateActivityCycle, getMainDelay());





// --- ������� ������������� ����� ������� ---

// ������� ��� ��������� ��������� ������� ������� (Vimeo/YouTube/Other)
async function handleTabStatusChange() {
    const isVimeo = await isCurrentTabVimeo();
    const isYouTube = await isCurrentTabYouTube();
    
    console.log("isVimeo", isVimeo);
    console.log("isYouTube", isYouTube);
}


// 1. ��������� ��� ������������ �������
browser.tabs.onActivated.addListener(async (activeInfo) => {
  console.log(`[Event: onActivated] Tab ${activeInfo.tabId} activated.`);
  await handleTabStatusChange();
});

// 2. ��������� ��� ���������� �������
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) {
    console.log(`[Event: onUpdated] CurrentTab ${tabId} updated.`);
    await handleTabStatusChange();
  }
});

// 3. ��������� �������� ��� ������� ����������
(async () => {
  console.log("[Initial Check]");
  await handleTabStatusChange();
})();







window.addEventListener('error', e => 
    {
        console.error('Global error:', e.message, e.filename, e.lineno);
    }
);


function getRandomInt(aMin, aMax) 
{
  return Math.floor(Math.random() * (aMax - aMin)) + aMin;
}
