/**
 * Cloudflare Worker — CORS proxy for Zoho Invoice API.
 *
 * Zoho Invoice (www.zohoapis.com/invoice/v3) does not emit CORS headers for
 * browser requests, making direct fetch() calls impossible from a web app.
 * This worker forwards requests to Zoho and adds the required CORS headers.
 *
 * Deployment:
 *   wrangler deploy
 *
 * The ALLOWED_ORIGIN environment variable should be set to the GitHub Pages URL
 * (or "*" for local dev — never use "*" in production).
 */

const ZOHO_BASE = 'https://www.zohoapis.'

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? ''

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204, origin, env)
    }

    const url = new URL(request.url)

    // Strip the leading /proxy/<region>/ prefix, e.g. /proxy/com/invoice/v3/...
    // Path format: /proxy/{region}/{...rest}
    const match = url.pathname.match(/^\/proxy\/([^/]+)\/(.*)$/)
    if (!match) {
      return corsResponse('Bad Request: path must be /proxy/{region}/...', 400, origin, env)
    }

    const [, region, rest] = match
    const targetUrl = `${ZOHO_BASE}${region}/invoice/v3/${rest}${url.search}`

    // Forward the request to Zoho
    const upstream = new Request(targetUrl, {
      method: request.method,
      headers: forwardHeaders(request.headers),
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'follow',
    })

    let zohoRes
    try {
      zohoRes = await fetch(upstream)
    } catch (err) {
      return corsResponse(`Upstream fetch failed: ${err.message}`, 502, origin, env)
    }

    const body = await zohoRes.arrayBuffer()
    return corsResponse(body, zohoRes.status, origin, env, zohoRes.headers.get('Content-Type'))
  },
}

/**
 * Copy headers that Zoho needs, stripping hop-by-hop and Origin (would cause
 * Zoho to see our worker origin, which is fine — but we omit Host so Cloudflare
 * sets it correctly for the upstream request).
 */
function forwardHeaders(incoming) {
  const out = new Headers()
  for (const [key, value] of incoming.entries()) {
    const lower = key.toLowerCase()
    if (['host', 'origin', 'referer', 'cf-connecting-ip', 'cf-ray'].includes(lower)) continue
    out.set(key, value)
  }
  return out
}

function allowedOrigin(origin, env) {
  const allowed = env.ALLOWED_ORIGIN ?? '*'
  if (allowed === '*') return '*'
  // Support comma-separated list for multiple origins
  return allowed.split(',').map((s) => s.trim()).includes(origin) ? origin : null
}

function corsResponse(body, status, origin, env, contentType) {
  const ao = allowedOrigin(origin, env)
  if (!ao) {
    return new Response('Forbidden', { status: 403 })
  }

  const headers = new Headers({
    'Access-Control-Allow-Origin': ao,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  })

  if (contentType) headers.set('Content-Type', contentType)

  if (body === null) {
    return new Response(null, { status, headers })
  }

  return new Response(body, { status, headers })
}
