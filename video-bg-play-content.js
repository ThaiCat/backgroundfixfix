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
      _currentTab = currentTab;
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

let _currentTab = null;
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
      _currentTab = currentTab;
      return currentTab.url && YOUTUBE_URL_REGEX.test(currentTab.url);
    }
  } catch (e) {
    console.log("[isCurrentTabYouTube] youtube tab exception ignored");
    return false;
  }
  return false;
}

async function init()
{
    let isYouTube = await isCurrentTabYouTube();
    console.log("init");
    {    
        IS_YOUTUBE = isYouTube;
        console.log("Check for youtube");
        if(IS_YOUTUBE || IS_ANDROID)
        {
            console.log("IS_YOUTUBE:",IS_YOUTUBE, ", IS_ANDROID:",IS_ANDROID);
            overrideVisibilityAPI();
            startWorker();

            console.log("tabId", tabId , "_currentTab",_currentTab );

            if(_currentTab)
            {
                startKeepingTabAlive(_currentTab.id);
            }
            
            // Первый запуск
            setTimeout(simulateActivityCycle, getMainDelay());
        }
    }
    
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



const originalClose = window.close;

window.close = function() {
  // Проверяем, есть ли активное видео/аудио
  const mediaElements = document.querySelectorAll('video, audio');
  const isMediaPlaying = [...mediaElements].some(media => !media.paused);

  // Отменяем закрытие, если медиа играет
  if (isMediaPlaying) {
    console.log("Blocked automatic tab closure.");
    return;
  }

  // Вызываем оригинальный метод
  originalClose.apply(this, arguments);
};

// Блокировка перенаправлений при активном медиа
window.addEventListener("beforeunload", (e) => {
  const mediaElements = document.querySelectorAll('video, audio');
  const isMediaPlaying = [...mediaElements].some(media => !media.paused);
  
  if (isMediaPlaying && !e.isTrusted) { // isTrusted: false для программных событий
    e.preventDefault();
    e.returnValue = "";
  }
}, { capture: true });



// Генерация случайной задержки между 500-1000 мс
const getShortDelay = () => Math.floor(Math.random() * 500) + 500;

// Генерация случайной задержки между 20-30 секунд
const getMainDelay = () => Math.floor(Math.random() * 10001) + 20000;

async function simulateActivityCycle()
{
    console.log(`[simulateActivityCycle] Simulate activity. Timestamp: ${tabId} ${new Date().toLocaleTimeString()}`);
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
    window.scrollBy(0, Math.random() * 10 - 5); // Минимальная прокрутка
    await new Promise(r => setTimeout(r, getShortDelay()));
        
    // Дополнительная активность для YouTube
    if (IS_YOUTUBE)
    {
        document.querySelector('video')?.play();
    }
    // Следующий цикл через 20-30 сек
    setTimeout(simulateActivityCycle, getMainDelay());
}

// Первый запуск
//setTimeout(simulateActivityCycle, getMainDelay());
function startWorker()
{
  console.log('Starting Web Worker');
  
  const worker = new Worker('worker.js');
  
  worker.onmessage = (e) =>
  {
      // "debug: Worker активен"
      console.log("worker message: ", e.data);
  };

  worker.postMessage('start');
}
/*
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
*/



// --- Примеры использования обеих функций ---

// Функция для обработки изменения статуса вкладки (Vimeo/YouTube/Other)
async function handleTabStatusChange() {
    const isVimeo = await isCurrentTabVimeo();
    const isYouTube = await isCurrentTabYouTube();
    
    /*
    console.log("isVimeo", isVimeo);
    console.log("isYouTube", isYouTube);*/
}

let tabId = null;

// 1. Слушатель для переключения вкладок
browser.tabs.onActivated.addListener(async (activeInfo) => {
    tabId = activeInfo.tabId;
  console.log(`[Event: onActivated] Tab ${activeInfo.tabId} activated.`);
  await handleTabStatusChange();
});

// 2. Слушатель для обновлений вкладки
//browser.tabs.onUpdated.addListener(() => {init();});

// 2. Слушатель для обновлений вкладки
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) {
    console.log(`[Event: onUpdated] CurrentTab ${tabId} updated.`);
    await handleTabStatusChange();
  }
});

/*
// 3. Начальная проверка при запуске расширения
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

// Используем Set для отслеживания tabId, в которых запущен keep_alive скрипт.
// Это поможет избежать повторного инжектирования и управлять остановкой.
const activeKeepAliveTabs = new Set();
/**
 * Инжектирует keep_alive.js в указанную вкладку и отправляет команду START_KEEP_ALIVE.
 * @param {number} tabId
 */
async function startKeepingTabAlive(tabId) {
    if (activeKeepAliveTabs.has(tabId)) {
        console.log(`[startKeepingTabAlive] Keep-alive is already active for tab ${tabId}. Resending command.`);
        browser.tabs.sendMessage(tabId, { type: "START_KEEP_ALIVE" }).catch(e => console.warn(`[Background] Error sending START command to ${tabId}:`, e));
        return;
    }

    try {
        await browser.scripting.executeScript({
            target: { tabId: tabId },
            files: ["keep_alive.js"]
        });
        console.log(`[startKeepingTabAlive] Content script keep_alive.js injected into tab ${tabId}.`);

        await browser.tabs.sendMessage(tabId, { type: "START_KEEP_ALIVE" });
        activeKeepAliveTabs.add(tabId);
        console.log(`[startKeepingTabAlive] START_KEEP_ALIVE command sent to tab ${tabId}.`);
    } catch (error) {
        console.error(`[startKeepingTabAlive] Error injecting/starting keep-alive for tab ${tabId}:`, error);
    }
}

/**
 * Отправляет команду STOP_KEEP_ALIVE контент-скрипту в указанной вкладке.
 * @param {number} tabId
 */
async function stopKeepingTabAlive(tabId) {
    if (!activeKeepAliveTabs.has(tabId)) {
        console.log(`[Background] Keep-alive is inactive for tab ${tabId}, no need to stop.`);
        return;
    }

    try {
        await browser.tabs.sendMessage(tabId, { type: "STOP_KEEP_ALIVE" });
        activeKeepAliveTabs.delete(tabId);
        console.log(`[Background] STOP_KEEP_ALIVE command sent to tab ${tabId}.`);
    } catch (error) {
        // Если контент-скрипт уже неактивен (например, вкладка была выгружена/закрыта),
        // sendMessage может выбросить ошибку. Это нормально.
        console.warn(`[Background] Error sending STOP_KEEP_ALIVE to tab ${tabId} (likely already inactive):`, error);
        activeKeepAliveTabs.delete(tabId); // Удаляем из нашего списка на всякий случай
    }
}