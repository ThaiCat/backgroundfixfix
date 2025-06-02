'use strict';

//const IS_YOUTUBE = window.location.hostname.search(/(?:^|.+\.)youtube\.com/) > -1 ||
//                   window.location.hostname.search(/(?:^|.+\.)youtube-nocookie\.com/) > -1;
//const IS_YOUTUBE = /^(www|m|music)\.youtube\.com$/.test(location.hostname);
//const IS_YOUTUBE = /(^|\.)(youtube|youtube-nocookie)\.(com|net|org|co\.[a-z]{2})$/i.test(location.hostname);

const IS_YOUTUBE = () => {
  // Проверка уникальных элементов YouTube
  if (document.querySelector('ytd-app, #player, ytm-mobile-page')) return true;
  
  // Проверка по мета-тегам
  const meta = document.querySelector('meta[property="og:site_name"]');
  return meta && meta.content.toLowerCase().includes('youtube');
};


const IS_MOBILE_YOUTUBE = window.location.hostname == 'm.youtube.com';
const IS_DESKTOP_YOUTUBE = IS_YOUTUBE && !IS_MOBILE_YOUTUBE;
const IS_VIMEO = window.location.hostname.search(/(?:^|.+\.)vimeo\.com/) > -1;

const IS_ANDROID = window.navigator.userAgent.indexOf('Android') > -1;

console.log('User Agent:', navigator.userAgent);
console.log('Hostname:', location.hostname);
console.log('IS_YOUTUBE:', IS_YOUTUBE);
console.log('IS_MOBILE_YOUTUBE:', IS_MOBILE_YOUTUBE);
console.log('IS_VIMEO:', IS_VIMEO);
console.log('IS_ANDROID:', IS_ANDROID);

// Page Visibility API
if (IS_ANDROID || !IS_DESKTOP_YOUTUBE) {
 // Object.defineProperties(document.wrappedJSObject,
 //   { 'hidden': {value: false}, 'visibilityState': {value: 'visible'} });



    // Заменяем оригинальный Page Visibility API
Object.defineProperty(document, 'hidden', {
  get: () => false,
  configurable: true
});

Object.defineProperty(document, 'visibilityState', {
  get: () => 'visible',
  configurable: true
});

// Блокируем события изменения видимости
const originalAddEventListener = document.addEventListener;
document.addEventListener = function(type, listener, options) {
  if (type === 'visibilitychange') return;
  originalAddEventListener.call(document, type, listener, options);
};

console.log(`Page Visibility API`);


}

window.addEventListener('error', e => {
  console.error('Global error:', e.message, e.filename, e.lineno);
});

window.addEventListener(
  'visibilitychange', evt => evt.stopImmediatePropagation(), true);

// Fullscreen API
if (IS_VIMEO) {
  window.addEventListener(
    'fullscreenchange', evt => evt.stopImmediatePropagation(), true);
}

// User activity tracking
if (IS_YOUTUBE) {
    console.log(`IS_YOUTUBE`);
  scheduleCyclicTask(pressKey, 48000, 59000); // every minute +/- 5 seconds
}

// Запуск Web Worker
const worker = new Worker('worker.js');
worker.onmessage = () => {
  // Держите вкладку активной
  document.dispatchEvent(new Event('keepAlive'));
  console.log(`workerdispatchEvent`);
};

function pressKey() {

    try 
    {
        // ... ваш код ...    
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

function sendKeyEvent (aEvent, aKey) {
  document.dispatchEvent(new KeyboardEvent(aEvent, {
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
