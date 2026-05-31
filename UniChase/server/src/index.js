import { assertRequiredEnv, getPort } from "./config.js"
import { createApp } from "./app.js"
import { prisma } from "./db.js"

assertRequiredEnv()

const port = getPort()
const app = createApp({ prisma })

const server = app.listen(port, () => {
  console.log(`UniChase API listening on http://localhost:${port}`)
})

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
