import { afterEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../src/app.js"
import { getTrustProxyHops } from "../src/config.js"

afterEach(() => vi.unstubAllEnvs())

async function withServer(prisma, run) {
  const app = createApp({ prisma })
  const express = (await import("express")).default
  const outer = express()
  outer.set("trust proxy", app.get("trust proxy"))
  outer.get("/test-client-ip", (req, res) => res.json({ ip: req.ip }))
  outer.use(app)
  const server = await new Promise(resolve => {
    const instance = outer.listen(0, "127.0.0.1", () => resolve(instance))
  })
  try { await run(`http://127.0.0.1:${server.address().port}`) }
  finally { await new Promise(resolve => server.close(resolve)) }
}

describe("deployment readiness and proxy boundaries", () => {
  it("keeps liveness available when the database is unavailable and does not expose database errors", async () => {
    const query = vi.fn().mockRejectedValue(new Error("database secret details"))
    await withServer({ $queryRaw: query }, async base => {
      expect((await fetch(`${base}/api/health`)).status).toBe(200)
      expect(query).not.toHaveBeenCalled()
      const readiness = await fetch(`${base}/api/ready`)
      expect(readiness.status).toBe(503)
      expect(readiness.headers.get("cache-control")).toBe("no-store")
      expect(await readiness.text()).not.toContain("secret")
    })
  })

  it("reports readiness after a successful database probe", async () => {
    await withServer({ $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]) }, async base => {
      const response = await fetch(`${base}/api/ready`)
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ data: { status: "ready" } })
    })
  })

  it("ignores forwarded addresses by default", async () => {
    vi.stubEnv("TRUST_PROXY_HOPS", "0")
    await withServer({}, async base => {
      const response = await fetch(`${base}/test-client-ip`, { headers: { "X-Forwarded-For": "198.51.100.1" } })
      expect((await response.json()).ip).toBe("127.0.0.1")
    })
  })

  it("trusts only the nearest forwarded address in the private Docker network", async () => {
    vi.stubEnv("TRUST_PROXY_HOPS", "1")
    await withServer({}, async base => {
      const response = await fetch(`${base}/test-client-ip`, { headers: { "X-Forwarded-For": "198.51.100.1, 203.0.113.2" } })
      expect((await response.json()).ip).toBe("203.0.113.2")
    })
  })

  it("rejects unrestricted or invalid proxy settings", () => {
    for (const value of ["true", "2", "-1", "0.5"]) {
      vi.stubEnv("TRUST_PROXY_HOPS", value)
      expect(getTrustProxyHops).toThrow()
    }
  })
})
