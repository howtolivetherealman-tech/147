/**
 * NETI BHARATHAM (నేటి భారతం) - PM2 Ecosystem Configuration for Hostinger VPS / Cloud
 * Usage on Hostinger VPS/SSH:
 *   npm install
 *   npm run build
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 */

module.exports = {
  apps: [
    {
      name: 'neti-bharatham-portal',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        APP_URL: 'https://netibhaaratham.com',
      },
    },
  ],
};
