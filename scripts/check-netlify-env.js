/**
 * Fail Netlify production builds if REACT_APP_API_URL is missing or localhost.
 * CRA only reads env vars at build time — a wrong deploy still shows localhost on phones.
 */
const isNetlify = process.env.NETLIFY === 'true'
if (!isNetlify) {
  process.exit(0)
}

const url = (process.env.REACT_APP_API_URL || '').trim().replace(/\/$/, '')

if (!url) {
  console.error(
    '\n[Netlify build] REACT_APP_API_URL is not set.\n' +
      '  Site configuration → Environment variables → add:\n' +
      '    Key:   REACT_APP_API_URL\n' +
      '    Value: https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app  (HTTPS for phone + Netlify)\n' +
      '  Scopes: enable Production (and Builds).\n' +
      '  Then: Deploys → Trigger deploy → Clear cache and deploy.\n',
  )
  process.exit(1)
}

if (url.includes('localhost') || url.includes('127.0.0.1')) {
  console.error(
    `\n[Netlify build] REACT_APP_API_URL must not be localhost (got ${url}).\n` +
      '  Phones cannot reach localhost. Use your Mac tunnel HTTPS URL instead.\n',
  )
  process.exit(1)
}

const siteHttps =
  (process.env.URL || '').startsWith('https://') ||
  (process.env.DEPLOY_PRIME_URL || '').startsWith('https://')

if (siteHttps && url.startsWith('http://')) {
  console.error(
    `\n[Netlify build] Site is HTTPS but REACT_APP_API_URL is HTTP (${url}).\n` +
      '  iPhone Safari blocks mixed content (https page → http API).\n' +
      '  Use an HTTPS tunnel, e.g. ngrok http 8000 → set REACT_APP_API_URL to the https URL.\n',
  )
  process.exit(1)
}

console.log(`[Netlify build] REACT_APP_API_URL ok (${url})`)
