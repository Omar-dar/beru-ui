/**
 * Generate a Workbox service worker after CRA build (PWA offline shell).
 */
const { generateSW } = require('workbox-build')
const path = require('path')

const buildDir = path.join(__dirname, '..', 'build')

generateSW({
  globDirectory: buildDir,
  globPatterns: ['**/*.{html,js,css,png,ico,json,svg,woff2}'],
  swDest: path.join(buildDir, 'service-worker.js'),
  skipWaiting: true,
  clientsClaim: true,
  navigateFallback: 'index.html',
  navigateFallbackDenylist: [/^\/_/],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
})
  .then(({ count, size }) => {
    console.log(`[PWA] service-worker.js — precached ${count} files (${size} bytes)`)
  })
  .catch(err => {
    console.error('[PWA] Failed to generate service worker:', err)
    process.exit(1)
  })
