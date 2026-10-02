// Read-only smoke check: node scripts/check-deployment.mjs https://api.example.com/api https://student.example.com https://owner.example.com
const [base, ...origins] = process.argv.slice(2)
if (!base || !origins.length) throw new Error('Supply the API URL ending in /api, then both frontend origins.')
const api = new URL(base)
if (api.protocol !== 'https:' || api.username || api.password || api.search || api.hash || !api.pathname.replace(/\/$/, '').endsWith('/api')) throw new Error('Supply a public HTTPS API URL ending in /api, without credentials or query parameters.')
const apiBase = api.href.replace(/\/$/, '')
const get = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(30000) })
let failed = false
async function check(label, run) {
  try { await run(); console.log(`PASS ${label}`) }
  catch (error) { failed = true; console.error(`FAIL ${label}: ${error.message}`) }
}
await check('API and database health', async () => {
  const response = await get(`${apiBase}/health`)
  if (!response.ok || (await response.json()).data?.status !== 'ok') throw new Error(`Health endpoint returned ${response.status}; check API startup and MongoDB access.`)
})
for (const value of origins) {
  const origin = new URL(value).origin
  await check(`Credentialed CORS for ${origin}`, async () => {
    const response = await get(`${apiBase}/auth/login`, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,x-requested-with' } })
    if (!response.ok || response.headers.get('access-control-allow-origin') !== origin || response.headers.get('access-control-allow-credentials') !== 'true') throw new Error('Include the exact frontend origin in CLIENT_URL on the API host.')
    const headers = response.headers.get('access-control-allow-headers')?.toLowerCase() || ''
    if (!headers.includes('content-type') || !headers.includes('x-requested-with')) throw new Error('Required request headers are not permitted.')
  })
  await check(`SPA deep links for ${origin}`, async () => {
    const response = await get(`${origin}/profile`)
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error(`Profile URL returned ${response.status}; verify the Vercel root is client and its rewrites are deployed.`)
  })
  await check(`Built API URL for ${origin}`, async () => {
    const response = await get(origin)
    if (!response.ok) throw new Error(`Homepage returned ${response.status}.`)
    const html = await response.text()
    const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(match => new URL(match[1], origin))
    let matched = false
    for (const script of scripts) {
      if (script.origin !== origin) continue
      const source = await get(script)
      if (source.ok && (await source.text()).includes(apiBase)) matched = true
    }
    if (!matched) throw new Error('Expected API URL not found in entry bundle. Set VITE_API_URL and rebuild the frontend.')
  })
}
process.exitCode = failed ? 1 : 0
