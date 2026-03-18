const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('./proxy-config.json');

// --- File Logger Setup ---
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `proxy-${new Date().toISOString().slice(0, 10)}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(serviceName, message) {
    const timestamp = new Date().toISOString();
    const line = `${timestamp} [${serviceName}] ${message}`;
    console.log(line);
    logStream.write(line + '\n');
}

// --- Proxy Factory ---
function createProxy({ listenPort, target, name }) {
    const app = express();

    // Morgan HTTP logging → console + file
    morgan.token('svc', () => name);
    const morganFormat = ':date[iso] [:svc] :method :url :status :response-time ms - :res[content-length]';
    app.use(morgan(morganFormat));                          // console
    app.use(morgan(morganFormat, { stream: logStream }));   // file

    // CORS override
    app.use((req, res, next) => {
        const origin = req.headers.origin || '*';
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');

        if (req.method === 'OPTIONS') {
            log(name, '✈️  Preflight OPTIONS → 200');
            return res.sendStatus(200);
        }
        next();
    });

    // Proxy with full logging hooks
    app.use('/', createProxyMiddleware({
        target,
        changeOrigin: true,
        on: {
            proxyReq(proxyReq, req) {
                log(name, `→ ${req.method} ${req.originalUrl} → ${target}${proxyReq.path}`);
                log(name, `  Headers: ${JSON.stringify(req.headers)}`);
            },

            proxyRes(proxyRes, req) {
                const emoji = proxyRes.statusCode < 400 ? '✅' : '❌';
                log(name, `← ${emoji} ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
                log(name, `  Response Headers: ${JSON.stringify(proxyRes.headers)}`);

                // Override CORS headers from upstream
                const reqOrigin = req.headers.origin || '*';
                proxyRes.headers['access-control-allow-origin'] = reqOrigin;
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
            delete proxyRes.headers['x-frame-options'];
        },

            onError(err, req, res) {
                log(name, `🔥 ERROR: ${err.message} | ${req.method} ${req.originalUrl} → ${target}`);
                res.status(502).json({
                    error: 'Proxy error',
                    service: name,
                    message: err.message
                });
            }
        }
    }));

    app.listen(listenPort, () => {
        log(name, `🚀 Proxy listening on http://localhost:${listenPort} → ${target}`);
    });
}

// --- Start Everything ---
log('main', '--- Starting proxies ---');
log('main', `Log file: ${logFile}`);
config.forEach(createProxy);
log('main', '------------------------');
