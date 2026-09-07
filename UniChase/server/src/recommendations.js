function contains(value, query) {
  return String(value || "").toLowerCase().includes(String(query || "").toLowerCase())
}

export function scoreUniversities(universities, preferences, now = new Date()) {
  return universities.map((university) => {
    const reasons = []
    const disadvantages = []
    let earned = 0
    let possible = 0
    function criterion(requested, points, known, matched, success, failure, unknown) {
      if (!requested) return
      possible += points
      if (known && matched) { earned += points; reasons.push(success) }
      else disadvantages.push(known ? failure : unknown)
    }
    criterion(preferences.preferredMajor, 30, university.programs?.length, university.programs?.some((value) => contains(value, preferences.preferredMajor)), "Matches your preferred major", "Preferred major is not listed", "Program information needs verification")
    criterion(preferences.preferredCity, 18, university.city, contains(university.city, preferences.preferredCity), `Located in ${university.city}`, "Outside your preferred city", "Location information needs verification")
    const hasBudget = preferences.tuitionMin != null || preferences.tuitionMax != null
    const min = university.tuitionMin ?? university.tuitionMax
    const max = university.tuitionMax ?? university.tuitionMin
    const budgetMatches = (preferences.tuitionMax == null || min <= preferences.tuitionMax) && (preferences.tuitionMin == null || max >= preferences.tuitionMin)
    criterion(hasBudget, 18, min != null && university.tuitionCurrency === "KRW", budgetMatches, "Published tuition overlaps your KRW budget", "Tuition is outside your budget", "Tuition needs verification before a budget comparison")
    const language = preferences.language || (preferences.englishRequired ? "English" : null)
    criterion(language, 16, university.languagesOfInstruction?.length, university.languagesOfInstruction?.some((value) => contains(value, language)), `Lists ${language}-taught programs`, "Preferred instruction language is not listed", "Instruction language needs verification")
    criterion(preferences.dormitoryRequired, 12, university.hasDormitory != null, university.hasDormitory, "Dormitory or housing support is available", "Dormitory is unavailable", "Housing data is missing")
    criterion(preferences.scholarshipPreferred, 10, university.hasScholarships != null, university.hasScholarships, "Scholarship information is available", "Scholarships are not listed", "Scholarship information needs verification")
    criterion(preferences.rankingMin != null || preferences.rankingMax != null, 10, university.qsRanking != null, (preferences.rankingMin == null || university.qsRanking >= preferences.rankingMin) && (preferences.rankingMax == null || university.qsRanking <= preferences.rankingMax), "Fits your preferred QS ranking range", "Outside your preferred QS ranking range", "QS ranking needs verification")
    criterion(preferences.level, 10, university.studyLevels?.length, university.studyLevels?.some((value) => contains(value, preferences.level)), `Offers ${preferences.level} study options`, "Preferred degree level is not listed", "Degree level information needs verification")
    if (university.applicationDeadline) {
      const deadline = new Date(university.applicationDeadline)
      if (deadline < now) disadvantages.push("Published application deadline has passed")
      else if (university.applicationOpenDate && new Date(university.applicationOpenDate) > now) disadvantages.push("Applications have not opened yet")
      else { reasons.push("Published application window is open"); if (deadline - now <= 45 * 86400000) disadvantages.push("Application deadline is approaching") }
    }
    if (!reasons.length) reasons.push(possible ? "Review the missing or unmatched information below" : "Add preferences to calculate a personal match")
    return { university, score: possible ? Math.round(100 * earned / possible) : 0, reasons, disadvantages }
  }).sort((a, b) => b.score - a.score || (a.university.qsRanking ?? 99999) - (b.university.qsRanking ?? 99999)).slice(0, 6)
}
