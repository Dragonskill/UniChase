import nodemailer from "nodemailer"

const dayMs = 24 * 60 * 60 * 1000

export function reminderDeliveryStatus() {
  const configured = process.env.EMAIL_REMINDERS_ENABLED === "true" && Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM)
  return {
    configured,
    message: configured ? "Email delivery is configured. Reminders use your account email." : "Email delivery is not configured. Your reminder schedule is available here; no email will be sent.",
  }
}

export async function rebuildReminderSchedule(prisma, userId, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "StudentUser" WHERE id = ${userId} FOR UPDATE`
    const preference = await tx.reminderPreference.findUnique({ where: { userId } })
    if (!preference?.emailEnabled) {
      await tx.scheduledReminder.updateMany({ where: { userId, status: { in: ["scheduled", "failed"] } }, data: { status: "cancelled" } })
      return
    }
    const sources = []
    const add = (key, type, title, dueDate, link) => {
      if (dueDate && new Date(dueDate) > now) sources.push({ key, type, title, dueDate: new Date(dueDate), link })
    }
    if (preference.roadmapStep) {
      const steps = await tx.roadmapStep.findMany({ where: { roadmap: { userId }, completed: false, dueDate: { gt: now } } })
      steps.forEach(step => add(`roadmap:${step.id}`, "roadmapStep", step.title, step.dueDate, "/roadmap"))
    }
    if (preference.visaChecklist) {
      const items = await tx.visaChecklistItem.findMany({ where: { userId, completed: false, dueDate: { gt: now } } })
      items.forEach(item => add(`visa:${item.id}`, "visaChecklist", item.title, item.dueDate, "/visa-guide"))
    }
    if (preference.documentChecklist) {
      const checklists = await tx.documentChecklist.findMany({ where: { userId, progress: { lt: 100 }, universityId: { not: null } }, include: { university: true } })
      checklists.forEach(item => add(`documents:${item.id}`, "documentChecklist", `${item.university.name}: complete your documents`, item.university.documentDeadline, "/documents"))
    }
    if (preference.documentChecklist) {
      const documents = await tx.userDocument.findMany({ where: { userId, expirationDate: { gt: now } } })
      documents.forEach(item => add(`vault:${item.id}`, 'documentChecklist', `${item.title}: expiration`, item.expirationDate, '/dashboard'))
    }
    if (preference.savedUniversityDeadline) {
      const followed = await tx.followedUniversity.findMany({ where: { userId }, include: { university: true } })
      followed.forEach(({ university }) => add(`followed:${university.id}`, 'savedUniversityDeadline', `${university.name}: application deadline`, university.applicationDeadline, `/universities/${university.slug || university.id}`))
      const saved = await tx.savedUniversity.findMany({ where: { userId }, include: { university: true } })
      saved.forEach(({ university }) => {
        for (const field of ["applicationDeadline", "documentDeadline", "scholarshipDeadline"]) {
          if (field === "applicationDeadline" && !preference.applicationDeadline) continue
          add(`saved:${university.id}:${field}`, "savedUniversityDeadline", `${university.name}: ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`, university[field], `/universities/${university.slug || university.id}`)
        }
      })
    }
    if (preference.applicationDeadline) {
      const applications = await tx.userApplication.findMany({ where: { userId, applicationDeadline: { gt: now }, status: { notIn: ['Withdrawn', 'Rejected', 'Enrolled'] } }, include: { university: true } })
      applications.forEach(item => add(`application:${item.id}`, 'applicationDeadline', `${item.university.name}: application deadline`, item.applicationDeadline, '/dashboard'))
      const dates = await tx.userDeadline.findMany({ where: { userId }, include: { university: true } })
      dates.forEach(item => {
        const field = { application: "applicationDeadline", scholarship: "scholarshipDeadline", document: "documentDeadline" }[item.deadlineType]
        if (field) add(`deadline:${item.id}`, "applicationDeadline", `${item.university.name}: ${item.deadlineType} deadline`, item.university[field], "/calendar")
      })
    }
    const activeKeys = []
    for (const source of sources) {
      for (const days of [...new Set(preference.reminderDays)]) {
        const sendAt = new Date(source.dueDate.getTime() - days * dayMs)
        // Past offsets are not backfilled, preventing a burst of outdated reminders.
        if (sendAt < now) continue
        const sourceKey = `${source.key}:${source.dueDate.toISOString()}:${days}`
        activeKeys.push(sourceKey)
        const existing = await tx.scheduledReminder.findUnique({ where: { userId_sourceKey: { userId, sourceKey } } })
        if (existing && ["sent", "sending"].includes(existing.status)) continue
        await tx.scheduledReminder.upsert({
          where: { userId_sourceKey: { userId, sourceKey } },
          create: { userId, sourceKey, type: source.type, title: source.title, sendAt, metadata: { dueDate: source.dueDate.toISOString(), link: source.link, days } },
          update: { title: source.title, sendAt, status: "scheduled", lastError: null, metadata: { dueDate: source.dueDate.toISOString(), link: source.link, days } },
        })
      }
    }
    // Due reminders remain dispatchable; cancel only future entries removed by edits.
    await tx.scheduledReminder.updateMany({ where: { userId, sourceKey: { notIn: activeKeys }, sendAt: { gt: now }, status: { in: ["scheduled", "failed"] } }, data: { status: "cancelled" } })
    // Completed, deleted or disabled sources must also suppress already-due entries.
    const pending = await tx.scheduledReminder.findMany({ where: { userId, sendAt: { lte: now }, status: { in: ["scheduled", "failed"] } } })
    const sourcePrefixes = sources.map(source => `${source.key}:${source.dueDate.toISOString()}:`)
    const removed = pending.filter(item => !sourcePrefixes.some(prefix => item.sourceKey?.startsWith(prefix))).map(item => item.id)
    if (removed.length) await tx.scheduledReminder.updateMany({ where: { id: { in: removed } }, data: { status: "cancelled" } })
  })
}

export async function dispatchStudentReminders(prisma, transport, now = new Date()) {
  const due = await prisma.scheduledReminder.findMany({ where: { status: { in: ["scheduled", "failed"] }, sendAt: { lte: now } }, orderBy: { sendAt: "asc" }, take: 100 })
  for (const reminder of due) {
    const preference = await prisma.reminderPreference.findUnique({ where: { userId: reminder.userId } })
    if (!preference?.emailEnabled || !preference[reminder.type]) {
      await prisma.scheduledReminder.updateMany({ where: { id: reminder.id, status: { in: ["scheduled", "failed"] } }, data: { status: "cancelled" } })
      continue
    }
    const claimed = await prisma.scheduledReminder.updateMany({ where: { id: reminder.id, status: { in: ["scheduled", "failed"] } }, data: { status: "sending", lastError: null } })
    if (!claimed.count) continue
    const user = await prisma.studentUser.findUnique({ where: { id: reminder.userId }, select: { email: true } })
    try {
      await transport.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: `UniChase reminder: ${reminder.title.replace(/[\r\n]/g, " ")}`,
        text: `${reminder.title}\n\nDue: ${reminder.metadata?.dueDate || "Check your dashboard"}\nManage reminders in UniChase under Email reminders.\n`,
        messageId: `<student-reminder-${reminder.id}@unichase.local>`,
      })
      await prisma.scheduledReminder.update({ where: { id: reminder.id }, data: { status: "sent", lastError: null } })
    } catch {
      // Transport failures remain retryable; no credentials or message contents are persisted.
      await prisma.scheduledReminder.update({ where: { id: reminder.id }, data: { status: "failed", lastError: "Email delivery failed; the worker will retry." } })
    }
  }
}

export function startStudentReminderWorker(prisma) {
  if (!reminderDeliveryStatus().configured) return () => {}
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    requireTLS: process.env.SMTP_PORT !== "465",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    disableFileAccess: true,
    disableUrlAccess: true,
    connectionTimeout: 10000,
    socketTimeout: 20000,
  })
  let running = false
  const tick = async () => {
    if (running) return
    running = true
    try {
      const preferences = await prisma.reminderPreference.findMany({ where: { emailEnabled: true }, select: { userId: true } })
      for (const { userId } of preferences) await rebuildReminderSchedule(prisma, userId)
      await dispatchStudentReminders(prisma, transport)
    } catch {
      console.error("Student reminder worker could not complete its run")
    } finally {
      running = false
    }
  }
  const interval = setInterval(tick, 60000)
  interval.unref()
  void tick()
  return () => { clearInterval(interval); transport.close() }
}
