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
  try {
    // 1. Проверка для мобильных PWA/AMP версий
    const mobileSelectors = [
      'div[data-testid="player-container"]', // Новый мобильный контейнер
      'iframe[src*="vimeo.com/ws/player"]',  // Мобильный iframe
      'meta[name="vimeo:player"]'            // Мета-тег мобильной версии
    ];

    // 2. Проверка через API (важно для Android WebView)
    const apiChecks = [
      typeof window.Vimeo?.Player !== 'undefined',
      window.location.pathname.startsWith('/mobile/'),
      document.documentElement.hasAttribute('data-vimeo-pwa')
    ];

    // 3. Проверка URL для SPA и глубоких ссылок
    const urlChecks = [
      /\/\/vimeo\.com\/(mo\/|mobile\/)/.test(window.location.href),
      window.performance?.getEntries().some(e => e.name.includes('vimeo.com/ws'))
    ];

    // 4. Расширенное логирование для отладки
    console.table({
      mobileElements: mobileSelectors.map(s => document.querySelector(s)),
      apiResults: apiChecks,
      urlMatches: urlChecks
    });

    return mobileSelectors.some(s => document.querySelector(s)) 
      || apiChecks.some(Boolean)
      || urlChecks.some(Boolean);

  } catch(e) {
    console.error('Vimeo detection failed:', e);
    return false;
  }
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
