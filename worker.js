
function getRandomInt(aMin, aMax) {
  return Math.floor(Math.random() * (aMax - aMin)) + aMin;
}

self.addEventListener('message', () => {
  // Пингуем вкладку с рандомным интервалом
  function ping() {
      
    console.log(`ping`);
    self.postMessage('keepAlive');
    setTimeout(ping, getRandomInt(12000, 18000)); // 12-18 сек
  }
  simulateActivity();
  ping();
});

function simulateActivity() {
  // 1. Имитация кликов
  document.dispatchEvent(new MouseEvent('mousemove', {
    clientX: Math.random() * 100,
    clientY: Math.random() * 100
  }));

  console.log(`simulateActivity`);
}