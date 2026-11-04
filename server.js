/**
 * NETI BHARATHAM (నేటి భారతం) - Official Hostinger Node.js Startup File (server.js)
 * Domain: https://netibhaaratham.com
 *
 * Hostinger Node.js Web App / Phusion Passenger / Cloud / VPS Entry Point:
 * In Hostinger hPanel -> Advanced -> Node.js:
 * - Application Root: public_html (or your app directory)
 * - Application Startup File: server.js
 * - Node.js Version: 20.x or 22.x
 */

const { createServer } = require('node:http');
const { parse } = require('node:url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error - NETI BHARATHAM');
      }
    }).listen(port, hostname, () => {
      console.log(
        `> NETI BHARATHAM (https://netibhaaratham.com) ready on http://${hostname}:${port}`
      );
    });
  })
  .catch((err) => {
    console.error('Failed to start NETI BHARATHAM server:', err);
    process.exit(1);
  });
