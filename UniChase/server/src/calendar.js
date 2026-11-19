function dateTime(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

function dateOnly(value) { return new Date(value).toISOString().slice(0, 10).replaceAll("-", "") }
function escapeText(value = "") {
  return String(value).replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
}

function foldLine(line) {
  const parts = []
  let part = ""
  for (const character of line) {
    if (Buffer.byteLength(part + character, "utf8") > 75) { parts.push(part); part = " " }
    part += character
  }
  parts.push(part)
  return parts.join("\r\n")
}

export function eventsToIcs(events, now = new Date()) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//UniChase//Student Calendar//EN", "CALSCALE:GREGORIAN"]
  for (const event of events) {
    const start = new Date(event.startDate)
    const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 86400000)
    lines.push("BEGIN:VEVENT", `UID:unichase-${event.id}@uni-chase`, `DTSTAMP:${dateTime(now)}`)
    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${dateOnly(start)}`, `DTEND;VALUE=DATE:${dateOnly(end > start ? end : new Date(start.getTime() + 86400000))}`)
    } else {
      lines.push(`DTSTART:${dateTime(start)}`)
      if (event.endDate) lines.push(`DTEND:${dateTime(end)}`)
    }
    lines.push(`SUMMARY:${escapeText(event.title)}`)
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
    lines.push(`CATEGORIES:${escapeText(event.eventType)}`)
    if (event.status === "cancelled") lines.push("STATUS:CANCELLED")
    lines.push("END:VEVENT")
  }
  lines.push("END:VCALENDAR")
  return lines.map(foldLine).join("\r\n") + "\r\n"
}
