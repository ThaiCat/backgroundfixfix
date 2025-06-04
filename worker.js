// worker.js
function getRandomInt(aMin, aMax) 
{
    return Math.floor(Math.random() * (aMax - aMin)) + aMin;
}

console.log('Worker running!'); // Ќе сработает, Worker не имеет доступа к консоли страницы
self.addEventListener('message', () => 
{
    function ping() 
    {
        self.postMessage({ type: 'ping' });
        setTimeout(ping, getRandomInt(12000, 18000));
    }

    ping();
});