// worker.js
function getRandomInt(aMin, aMax) {
  return Math.floor(Math.random() * (aMax - aMin)) + aMin;
}

self.addEventListener('message', () => {
  function ping() {
    self.postMessage({ type: 'ping' });
    setTimeout(ping, getRandomInt(12000, 18000));
  }
  ping();
});