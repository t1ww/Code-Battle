// kill-ports.config.js
import kill from 'kill-port';
import detect from 'detect-port';

const ports = [5000, 5001, 3001, 5173];

(async () => {
    console.log('|----------   Cleaning up ports.   ----------|');
    for (const port of ports) {
        const availablePort = await detect(port);
        if (availablePort !== port) {
            await kill(port);
            console.log(`Port ${port} was busy and has been killed`);
        }
    }
    console.log('|---------- Port cleanup finished. ----------|');
})();
