const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');

// Upstream server
const target = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.milememory.com, https://milememory.com');
  res.end('ok');
});
target.listen(3000, () => {
    // Proxy server
    const app = express();
    app.use((req, res, next) => {
        const origin = req.headers.origin || '*';
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        next();
    });

    app.use('/', createProxyMiddleware({
        target: 'http://localhost:3000',
        changeOrigin: true,
        onProxyRes(proxyRes, req, res) {
            const reqOrigin = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-origin'] = reqOrigin;
            // Maybe we just need to use res.setHeader directly?
            res.setHeader('access-control-allow-origin', reqOrigin);
        }
    }));
    const server = app.listen(3001, () => {
        require('http').get({
            hostname: 'localhost',
            port: 3001,
            path: '/',
            headers: {
                'Origin': 'http://localhost:5175'
            }
        }, (res) => {
            console.log(res.headers);
            target.close();
            server.close();
        });
    });
});
