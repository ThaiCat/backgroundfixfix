// worker.js
function getRandomInt(aMin, aMax) {
  return Math.floor(Math.random() * (aMax - aMin)) + aMin;
}

console.log('Worker запущен!'); // Не сработает, Worker не имеет доступа к консоли страницы
self.addEventListener('message', () => {
  function ping() {
    self.postMessage({ type: 'ping' });
    setTimeout(ping, getRandomInt(12000, 18000));
  }
  ping();
});