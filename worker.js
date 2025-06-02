
function getRandomInt(aMin, aMax) {
  return Math.floor(Math.random() * (aMax - aMin)) + aMin;
}

self.addEventListener('message', () => {
  // Пингуем вкладку с рандомным интервалом
  function ping() {
    self.postMessage('keepAlive');
    setTimeout(ping, getRandomInt(12000, 18000)); // 12-18 сек
  }
  ping();
});