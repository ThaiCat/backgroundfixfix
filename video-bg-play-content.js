'use strict';

//const IS_YOUTUBE = window.location.hostname.search(/(?:^|.+\.)youtube\.com/) > -1 ||
//                   window.location.hostname.search(/(?:^|.+\.)youtube-nocookie\.com/) > -1;
//const IS_YOUTUBE = /^(www|m|music)\.youtube\.com$/.test(location.hostname);
//const IS_YOUTUBE = /(^|\.)(youtube|youtube-nocookie)\.(com|net|org|co\.[a-z]{2})$/i.test(location.hostname);

const IS_YOUTUBE = () => {
  // �������� ���������� ��������� YouTube
  if (document.querySelector('ytd-app, #player, ytm-mobile-page')) return true;
  
  // �������� �� ����-�����
  const meta = document.querySelector('meta[property="og:site_name"]');
  return meta && meta.content.toLowerCase().includes('youtube');
};


const IS_MOBILE_YOUTUBE = window.location.hostname == 'm.youtube.com';
const IS_DESKTOP_YOUTUBE = IS_YOUTUBE && !IS_MOBILE_YOUTUBE;
const IS_VIMEO = window.location.hostname.search(/(?:^|.+\.)vimeo\.com/) > -1;

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
console.log('IS_VIMEO:', IS_VIMEO);
console.log('IS_ANDROID:', IS_ANDROID);
console.log('isAndroidYoutube:', isAndroidYoutube);

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
}

// ��������� �������� ��� �������� � ��� ���������� DOM
init();
new MutationObserver(init).observe(document, {  childList: true,  subtree: true});

window.addEventListener('error', e => 
    {
        console.error('Global error:', e.message, e.filename, e.lineno);
    }
);


// Fullscreen API
if (IS_VIMEO)
{
    window.addEventListener('fullscreenchange', evt => evt.stopImmediatePropagation(), true);
}

// User activity tracking
if (IS_YOUTUBE) 
{
    console.log(`IS_YOUTUBE`);
    //cheduleCyclicTask(pressKey, 48000, 59000); // every minute +/- 5 seconds
}



function pressKey() 
{
    try
    {
        // ... ��� ��� ...    
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
