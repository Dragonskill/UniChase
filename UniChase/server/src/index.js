import { assertRequiredEnv, getPort } from "./config.js"
import { createApp } from "./app.js"
import { prisma } from "./db.js"
import { startStudentReminderWorker } from "./services/studentReminders.js"

assertRequiredEnv()

const port = getPort()
const app = createApp({ prisma })
const stopReminders = startStudentReminderWorker(prisma)

const server = app.listen(port, () => {
  console.log(`UniChase API listening on http://localhost:${port}`)
})

let shuttingDown = false
function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  stopReminders()
  const deadline = setTimeout(() => process.exit(1), 30_000)
  deadline.unref()
  server.close(async () => {
    try {
      await prisma.$disconnect()
      clearTimeout(deadline)
      process.exit(0)
    } catch {
      process.exit(1)
    }
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
