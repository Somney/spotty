// Turns the exported web build in dist/ into an installable home-screen app:
// adds a manifest, icons, and the meta tags iOS Safari reads for "Add to Home Screen".
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const base = (process.env.WEB_BASE || '').replace(/\/$/, '');

fs.copyFileSync(path.join(__dirname, '..', 'assets', 'icon.png'), path.join(dist, 'icon.png'));

fs.writeFileSync(
  path.join(dist, 'manifest.json'),
  JSON.stringify(
    {
      name: 'Spotty',
      short_name: 'Spotty',
      description: 'Ad-free music: new releases and century-old records.',
      start_url: `${base}/`,
      scope: `${base}/`,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#0B0B12',
      theme_color: '#0B0B12',
      icons: [{ src: `${base}/icon.png`, sizes: '1024x1024', type: 'image/png', purpose: 'any' }],
    },
    null,
    2
  )
);

const tags = `
    <link rel="manifest" href="${base}/manifest.json" />
    <link rel="apple-touch-icon" href="${base}/icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Spotty" />
    <style>html, body { background: #0B0B12; overscroll-behavior: none; }</style>
  `;

const file = path.join(dist, 'index.html');
let html = fs.readFileSync(file, 'utf8');
if (!html.includes('rel="manifest"')) {
  // viewport-fit=cover lets the app draw under the iPhone notch and home indicator.
  html = html.replace(/(<meta name="viewport" content="[^"]*)"/, '$1, viewport-fit=cover"').replace('</head>', `${tags}</head>`);
  fs.writeFileSync(file, html);
}
// GitHub Pages serves 404.html for unknown paths; reuse the app shell.
fs.copyFileSync(file, path.join(dist, '404.html'));
console.log(`PWA files written (base "${base || '/'}")`);
