'use strict';

const IS_ANDROID = window.navigator.userAgent.indexOf('Android') > -1;
let IS_YOUTUBE = false;

console.log('User Agent:', navigator.userAgent);
console.log('Hostname:', location.hostname);
console.log('IS_ANDROID:', IS_ANDROID);


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


// Регулярное выражение для определения URL Vimeo
const VIMEO_URL_REGEX = /^https?:\/\/(?:[^.]+\.)?vimeo\.com/;

// Регулярное выражение для определения URL YouTube (включает поддомены типа m.youtube.com, music.youtube.com и т.д.)
// а также основной домен youtube.com
const YOUTUBE_URL_REGEX = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)?(?:youtube\.com|youtu\.be)/;

/**
 * Асинхронная функция, которая возвращает true, если текущая активная вкладка является страницей Vimeo,
 * иначе возвращает false.
 *
 * Поскольку получение информации о вкладке - это асинхронная операция, эта функция должна быть async
 * и будет возвращать Promise, который разрешится в boolean (true/false).
 *
 * @returns {Promise<boolean>} Промис, который разрешается в true, если текущая активная вкладка - Vimeo, иначе false.
 */
async function isCurrentTabVimeo() {
  try {
    // Запрашиваем активную вкладку в текущем окне
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });

    // Если нашли активную вкладку
    if (tabs && tabs.length > 0) {
      const currentTab = tabs[0];
      // Проверяем URL этой вкладки
      return currentTab.url && VIMEO_URL_REGEX.test(currentTab.url);
    }
  } catch (e) {
    console.log("[isCurrentTabVimeo] exception ignored");
    // В случае ошибки предполагаем, что это не Vimeo
    return false;
  }
  // Если вкладок не найдено или что-то пошло не так
  return false;
}


/**
 * Асинхронная функция, которая возвращает true, если текущая активная вкладка является страницей YouTube (или мобильным YouTube),
 * иначе возвращает false.
 * @returns {Promise<boolean>} Промис, который разрешается в true, если текущая активная вкладка - YouTube, иначе false.
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


// --- Примеры использования обеих функций ---

// Функция для обработки изменения статуса вкладки (Vimeo/YouTube/Other)
async function handleTabStatusChange() {
    const isVimeo = await isCurrentTabVimeo();
    const isYouTube = await isCurrentTabYouTube();
    
    
    if (isYouTube) 
    {
        IS_YOUTUBE = true;
        console.log("CurrentTab: YouTube");
        if(IS_ANDROID)
        {
            overrideVisibilityAPI();
            startWorker();
            scheduleCyclicTask(pressKey, 48000, 59000);
        }
    } 
    else if (isVimeo) 
    {
        console.log("CurrentTab: Vimeo");        
        if(isVimeoPage)
        {
            window.addEventListener('fullscreenchange', evt => evt.stopImmediatePropagation(), true);
        }
        else
        {

        }
    }     
    else 
    {
        console.log("CurrentTab: other");
        // Выполните действия по умолчанию
        // browser.action.setIcon({ path: "icons/default-icon.png" });
    }
}


// 1. Слушатель для переключения вкладок
browser.tabs.onActivated.addListener(async (activeInfo) => {
  console.log(`[Event: onActivated] Tab ${activeInfo.tabId} activated.`);
  await handleTabStatusChange();
});

// 2. Слушатель для обновлений вкладки
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) {
    console.log(`[Event: onUpdated] CurrentTab ${tabId} updated.`);
    await handleTabStatusChange();
  }
});

// 3. Начальная проверка при запуске расширения
(async () => {
  console.log("[Initial Check]");
  await handleTabStatusChange();
})();







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
