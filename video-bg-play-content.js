'use strict';

const IS_YOUTUBE = IsYoutube;

function IsYoutube()
{    
    const testyt = /(^|\.)(youtube|youtube-nocookie)\.(com|net|org|co\.[a-z]{2})$/i.test(location.hostname);
    console.log("testyt:", testyt);
    if (testyt) return true;
    // Проверка уникальных элементов YouTube
    if (document.querySelector('ytd-app, #player, ytm-mobile-page')) return true;
    
    // Проверка по мета-тегам
    const meta = document.querySelector('meta[property="og:site_name"]');
    return meta && meta.content.toLowerCase().includes('youtube');
}

function isMobileYouTube() {
  // 1. Проверка по URL
  if (location.hostname.startsWith('m.') || location.hostname === 'youtube.com') {
    const path = location.pathname;
    if (path.startsWith('/watch') || path.startsWith('/shorts')) return true;
  }

  // 2. Проверка мобильных классов
  const mobileClasses = [
    'ytm-pivot-bar',      // Панель навигации
    'ytm-slim-page',      // Верстка мобильной версии
    'ytm-player-container'// Контейнер плеера
  ];
  
  // 3. Проверка мобильных атрибутов
  const mobileAttributes = {
    'data-is-mobile': 'true',
    'ytm-version': /\d+/,
    'is-mobile-app': null
  };

  return [
    // Проверка классов
    mobileClasses.some(c => document.getElementsByClassName(c).length > 0),
    
    // Проверка атрибутов
    Object.entries(mobileAttributes).some(([attr, val]) => {
      const element = document.querySelector(`[${attr}]`);
      if (!element) return false;
      return val instanceof RegExp 
        ? val.test(element.getAttribute(attr))
        : element.hasAttribute(attr);
    }),
    
    // Проверка через user-agent (резервный метод)
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  ].some(Boolean);
}

function isVimeo() {
  // 1. Проверка network-запросов
  const networkEvidence = performance.getEntriesByType('resource').some(entry => 
    entry.name.includes('player.vimeo.com') || 
    entry.initiatorType === 'xmlhttprequest' && entry.name.includes('/vimeo/')
  );

  // 2. Проверка через WebAssembly (новые плееры Vimeo)
  const wasmCheck = Array.from(document.scripts).some(script => 
    script.src.includes('vimeo.com/wasm/')
  );

  // 3. Анализ Web Workers
  const workerCheck = Array.from(navigator.serviceWorker?.controller?.scriptURL || []).some(url => 
    url.includes('vimeo.com/sw.js')
  );

  // 4. Проверка WebGL (рендеринг видео)
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
    window.addEventListener( 'visibilitychange', evt => evt.stopImmediatePropagation(), true); //отключает многовенную паузу при выключении экрана

    // Заменяем оригинальный Page Visibility API
    Object.defineProperty(document, 'hidden', {  get: () => false,  configurable: true});
    Object.defineProperty(document, 'visibilityState', {  get: () => 'visible',  configurable: true});

    // Блокируем события изменения видимости
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
      
      // Имитируем активность в основном потоке
      simulateActivity();
      document.dispatchEvent(new Event('keepAlive'));
    }
  };

  worker.postMessage('start');
}

function simulateActivity() {
  try {
    console.log('Simulating activity');
    
    // Имитация пользовательской активности
    const events = ['mousemove', 'keydown', 'scroll'];
    events.forEach(event => {
      document.dispatchEvent(new Event(event, { bubbles: true }));
    });
    
    // Дополнительная активность для YouTube
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
        
        // Ваша основная логика
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

// Запускаем проверку при загрузке и при изменениях DOM
init();

// Проверка после полной загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
  console.log('Vimeo detected:', isVimeo());
  console.log('Mobile YouTube:', isMobileYouTube());
});

// Для SPA (YouTube/Vimeo)
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

// Запуск при любых изменениях DOM
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

// Запуск анализа каждые 2 секунды
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

// Проверка через DNS prefetch
const dnsPrefetchLinks = Array.from(document.querySelectorAll('link[rel="dns-prefetch"]'));
const dnsCheck = dnsPrefetchLinks.some(link => 
  link.href.includes('vimeo.com')
);

// Анализ CSP headers
const cspCheck = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content.includes('vimeo');

// Проверка через Web Audio API
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







// Регулярное выражение для определения URL Vimeo
// Оно совпадает с vimeo.com и любыми поддоменами, такими как player.vimeo.com
const VIMEO_URL_REGEX = /^https?:\/\/(?:[^.]+\.)?vimeo\.com/;

/**
 * Проверяет, является ли URL вкладки страницей Vimeo.
 * @param {object} tab - Объект вкладки, предоставленный browser.tabs API.
 */
function checkIfVimeoPage(tab) {
  // Убедитесь, что у вкладки есть URL и он совпадает с нашим регулярным выражением
  if (tab.url && VIMEO_URL_REGEX.test(tab.url)) {
    console.log(`Обнаружена страница Vimeo во вкладке ${tab.id}: ${tab.url}`);
    // Здесь вы можете выполнить любое действие, когда страница Vimeo обнаружена:
    // 1. Изменить иконку расширения
    // browser.action.setIcon({ tabId: tab.id, path: "icons/vimeo-active-icon.png" });
    // 2. Отправить сообщение popup-скрипту
    // browser.runtime.sendMessage({ type: "VIMEO_PAGE_DETECTED", tabId: tab.id, url: tab.url });
    // 3. Инжектировать контент-скрипт (если у вас есть разрешение "scripting")
    // injectContentScript(tab.id);
    return true;
  } else {
    // console.log(`Не страница Vimeo во вкладке ${tab.id}: ${tab.url}`);
    // Если вам нужно сбросить состояние, когда вкладка НЕ Vimeo:
    // browser.action.setIcon({ tabId: tab.id, path: "icons/icon-16.png" }); // Вернуть иконку по умолчанию
    return false;
  }
}

// Слушатель для изменений URL вкладок
// Он срабатывает, когда вкладка обновляется, перенаправляется или загружает новый URL
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // `changeInfo.url` указывает на то, что URL вкладки изменился
  // Или вы можете использовать `changeInfo.status === 'complete'` для проверки, когда страница полностью загрузилась
  if (changeInfo.url) { // Или changeInfo.status === 'complete' для более точной загрузки
    checkIfVimeoPage(tab);
  }
});

// Дополнительно: Проверяем все существующие вкладки при запуске расширения
browser.tabs.query({}).then(tabs => {
  for (let tab of tabs) {
    checkIfVimeoPage(tab);
  }
});

/*
// Пример функции для инжектирования контент-скрипта (если необходимо взаимодействовать с DOM)
// Для этого вам нужно добавить "scripting" в permissions и host_permissions для домена Vimeo
async function injectContentScript(tabId) {
  try {
    await browser.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content-script.js"] // Имя вашего контент-скрипта
    });
    console.log(`Контент-скрипт успешно инжектирован во вкладку ${tabId}`);
  } catch (error) {
    console.error(`Ошибка при инжектировании контент-скрипта во вкладку ${tabId}:`, error);
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
        // ...код ...    
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
 * Циклически выполняет callback со случайной задержкой между вызовами
 * @param {Function} callback - Функция для выполнения
 * @param {number} minDelayMs - Минимальная задержка (миллисекунды)
 * @param {number} maxDelayMs - Максимальная задержка (миллисекунды)
 */
function scheduleCyclicTask(callback, minDelayMs, maxDelayMs) {
  // Валидация параметров
  if (minDelayMs < 0 || maxDelayMs < minDelayMs) {
    throw new Error('Invalid delay parameters');
  }

  // Генерация случайной задержки в заданном диапазоне
  const getRandomDelay = () => 
    Math.floor(Math.random() * (maxDelayMs - minDelayMs)) + minDelayMs;

  // Планирование следующего выполнения
  const scheduleNext = () => {
    const delay = getRandomDelay();
    window.setTimeout(() => {
      callback();
      scheduleNext();
    }, delay);
  };

  // Первый запуск
  scheduleNext();
}

function getRandomInt(aMin, aMax) {
  return Math.floor(Math.random() * (aMax - aMin)) + aMin;
}
