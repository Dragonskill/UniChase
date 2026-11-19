// Materialize owned planning dates into one calendar, retaining stable ICS UIDs.
export async function syncCalendarSources(prisma, userId) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "StudentUser" WHERE id = ${userId} FOR UPDATE`
    const sources = []
    const add = (sourceKey, title, eventType, startDate, status = 'upcoming', links = {}) => {
      if (startDate) sources.push({ sourceKey: `auto:${sourceKey}`, title, eventType, startDate, status, allDay: true, ...links })
    }
    const steps = await tx.roadmapStep.findMany({ where: { roadmap: { userId }, dueDate: { not: null } }, include: { roadmap: true } })
    steps.forEach(step => add(`roadmap:${step.id}`, step.title, 'roadmap_task', step.dueDate, step.completed ? 'completed' : 'upcoming', { roadmapStepId: String(step.id), universityId: step.roadmap.universityId }))
    const visa = await tx.visaChecklistItem.findMany({ where: { userId, dueDate: { not: null } } })
    visa.forEach(item => add(`visa:${item.id}`, item.title, 'visa_deadline', item.dueDate, item.completed ? 'completed' : 'upcoming'))
    const documents = await tx.userDocument.findMany({ where: { userId, expirationDate: { not: null } } })
    documents.forEach(item => add(`document:${item.id}`, `${item.title}: expiration`, 'document_deadline', item.expirationDate, 'upcoming', { applicationId: item.applicationId }))
    const applications = await tx.userApplication.findMany({
      where: { userId, OR: [{ applicationDeadline: { not: null } }, { resultDate: { not: null } }] },
      include: { university: true },
    })
    applications.forEach(item => {
      add(
        `application:${item.id}:deadline`,
        `${item.university.name}: application deadline`,
        'application_deadline',
        item.applicationDeadline,
        ['Applied', 'Waiting for Result', 'Interview Scheduled', 'Accepted', 'Rejected', 'Deferred', 'Enrolled', 'Withdrawn'].includes(item.status) ? 'completed' : 'upcoming',
        { applicationId: item.id, universityId: item.universityId },
      )
      add(
        `application:${item.id}:result`,
        `${item.university.name}: application result`,
        'custom',
        item.resultDate,
        ['Accepted', 'Rejected', 'Enrolled'].includes(item.status) ? 'completed' : 'upcoming',
        { applicationId: item.id, universityId: item.universityId },
      )
    })
    const checklists = await tx.checklistItem.findMany({ where: { userId, dueDate: { not: null } } })
    checklists.forEach(item => add(`checklist:${item.id}`, item.title, 'document_deadline', item.dueDate, item.completed ? 'completed' : 'upcoming', { checklistItemId: item.id }))
    const followed = await tx.followedUniversity.findMany({ where: { userId }, include: { university: true } })
    const deadlines = await tx.userDeadline.findMany({ where: { userId }, include: { university: true } })
    const fields = { application: 'applicationDeadline', document: 'documentDeadline', scholarship: 'scholarshipDeadline' }
    followed.forEach(({ university }) => Object.entries(fields).forEach(([kind, field]) => add(`university:${university.id}:${kind}`, `${university.name}: ${kind} deadline`, kind === 'document' ? 'document_deadline' : 'application_deadline', university[field], 'upcoming', { universityId: university.id })))
    deadlines.forEach(({ university, deadlineType }) => add(`university:${university.id}:${deadlineType}`, `${university.name}: ${deadlineType} deadline`, deadlineType === 'document' ? 'document_deadline' : 'application_deadline', university[fields[deadlineType]], 'upcoming', { universityId: university.id }))
    const reminders = await tx.scheduledReminder.findMany({ where: { userId, status: { in: ['scheduled', 'failed', 'sent'] } }, take: 500 })
    reminders.forEach(item => add(`reminder:${item.id}`, item.title, 'reminder', item.sendAt, item.status === 'sent' ? 'completed' : 'upcoming'))
    for (const data of new Map(sources.map(source => [source.sourceKey, source])).values()) {
      const existing = await tx.calendarEvent.findUnique({ where: { userId_sourceKey: { userId, sourceKey: data.sourceKey } } })
      await tx.calendarEvent.upsert({
        where: { userId_sourceKey: { userId, sourceKey: data.sourceKey } },
        create: { userId, ...data },
        update: { ...data, status: existing?.status === 'cancelled' ? 'cancelled' : data.status },
      })
    }
    await tx.calendarEvent.deleteMany({ where: { userId, sourceKey: { startsWith: 'auto:', notIn: sources.map(source => source.sourceKey) } } })
  }, { timeout: 15000 })
}
