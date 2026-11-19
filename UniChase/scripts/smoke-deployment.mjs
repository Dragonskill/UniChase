const origin = process.argv[2]
if (!origin || !/^https?:\/\//.test(origin)) throw new Error("Usage: node scripts/smoke-deployment.mjs https://your-domain")

for (const path of ["/", "/university", "/api/health", "/api/ready", "/api/universities?limit=1"]) {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
  if (path.startsWith("/api/")) {
    if (!response.headers.get("content-type")?.includes("application/json")) throw new Error(`${path}: expected API JSON, received frontend fallback`)
    const payload = await response.json()
    if (path.includes("universities") && (!Array.isArray(payload.data) || !payload.data.length)) throw new Error("University catalog is empty; run the seed")
  } else if (!(await response.text()).includes('id="root"')) {
    throw new Error(`${path}: missing application root`)
  }
  console.log(`PASS ${path}`)
}

const missing = await fetch(new URL("/api/not-a-real-route", origin), { signal: AbortSignal.timeout(15_000) })
if (missing.status !== 404 || !missing.headers.get("content-type")?.includes("application/json")) throw new Error("Unknown API routes must return JSON 404, not the SPA")
console.log("PASS API 404 boundary")
