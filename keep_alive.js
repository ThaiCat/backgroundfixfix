// keep_alive.js
let keepAliveInterval = null;
const INTERVAL_MS = 20 * 1000; // Выполнять каждые 20 секунд

function activateKeepAlive() {
    if (keepAliveInterval) {
        console.log("[KeepAlive] Интервал уже запущен.");
        return;
    }

    keepAliveInterval = setInterval(() => {
        // Выполняем очень легкое, но регулярное действие, чтобы "разбудить" JS-движок
        // и сигнализировать браузеру об активности.
        // Можно менять заголовок, делать легкие DOM-манипуляции,
        // или просто выполнять console.log (Firefox может использовать логирование как сигнал активности)
        console.log(`[KeepAlive] Активность имитируется во вкладке. Timestamp: ${new Date().toLocaleTimeString()}`);

        // Дополнительные (опциональные) действия для имитации активности:
        // document.title = document.title; // Изменение заголовка на самого себя
        // document.body.setAttribute('data-last-activity', Date.now()); // Добавить/обновить атрибут на <body>

        // Можно попытаться вызвать событие, если это помогает, но часто не требуется
        // const event = new Event('mousemove');
        // document.dispatchEvent(event);

    }, INTERVAL_MS);

    console.log(`[KeepAlive] Интервал запущен каждые ${INTERVAL_MS / 1000} секунд.`);
}

function deactivateKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
        console.log("[KeepAlive] Интервал остановлен.");
    }
}

// Слушаем сообщения из фонового скрипта, чтобы управлять интервалом
browser.runtime.onMessage.addListener((message) => {
    if (message.type === "START_KEEP_ALIVE") {
        activateKeepAlive();
    } else if (message.type === "STOP_KEEP_ALIVE") {
        deactivateKeepAlive();
    }
});

// Если контент-скрипт инжектирован, сразу начинаем имитацию активности
// (Это нужно, если скрипт инжектируется без явной команды START_KEEP_ALIVE,
// например, если вы решите всегда инжектировать его при загрузке страницы)
// Однако, лучше дождаться команды START_KEEP_ALIVE из background.js,
// чтобы избежать ненужного выполнения, если вкладка неактивна.
// Поэтому этот вызов закомментирован, и мы полагаемся на сообщения.
// activateKeepAlive();