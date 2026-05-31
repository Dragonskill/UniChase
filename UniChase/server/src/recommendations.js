function hasText(value, query) {
  return String(value || "")
    .toLowerCase()
    .includes(String(query || "").toLowerCase())
}

function listHas(values, query) {
  return (values || []).some((value) => hasText(value, query))
}

function addScore(state, points, reason) {
  state.score += points
  state.reasons.push(reason)
}

export function scoreUniversities(universities, preferences) {
  return universities
    .map((university) => {
      const state = { university, score: 0, reasons: [] }

      if (preferences.preferredMajor && listHas(university.programs, preferences.preferredMajor)) {
        addScore(state, 30, "Matches your preferred major")
      }

      if (preferences.preferredCity && hasText(university.city, preferences.preferredCity)) {
        addScore(state, 18, `Located in ${university.city}`)
      }

      const maxBudget = preferences.tuitionMax
      if (maxBudget && (!university.tuitionMin || university.tuitionMin <= maxBudget)) {
        addScore(state, 18, "Within your budget")
      }

      const language = preferences.language || (preferences.englishRequired ? "English" : null)
      if (language && listHas(university.languagesOfInstruction, language)) {
        addScore(state, 16, "Has English-taught programs")
      }

      if (preferences.dormitoryRequired && university.hasDormitory) {
        addScore(state, 12, "Dormitory or housing support is available")
      }

      if (preferences.scholarshipPreferred && university.hasScholarships) {
        addScore(state, 10, "Scholarship information is available")
      }

      if (
        preferences.rankingMax &&
        university.qsRanking &&
        university.qsRanking <= preferences.rankingMax
      ) {
        addScore(state, 10, "Fits your preferred QS ranking range")
      }

      if (preferences.level && listHas(university.studyLevels, preferences.level)) {
        addScore(state, 10, `Offers ${preferences.level} study options`)
      }

      if (
        university.applicationDeadline &&
        university.applicationDeadline >= new Date()
      ) {
        addScore(state, 8, "Deadline is still open")
      }

      if (state.reasons.length === 0) {
        state.reasons.push("Relevant Korean university profile")
      }

      return state
    })
    .sort((a, b) => b.score - a.score || (a.university.qsRanking || 9999) - (b.university.qsRanking || 9999))
    .slice(0, 6)
}
