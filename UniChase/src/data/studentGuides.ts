const studyInKoreaVisaUrl = "https://studyinkorea.go.kr/ko/plan/visaAndStay.do"
const koreaVisaPortalUrl = "https://visa.go.kr/openPage.do?MENU_ID=1020502"

export const visaGuideSteps = [
  { title: "Confirm your visa category", detail: "The Korean government describes D-2 for degree study and D-4 for non-degree training, including many language programs. Confirm the exact subtype for your course.", sourceLabel: "Study in Korea: visa and stay", sourceUrl: studyInKoreaVisaUrl },
  { title: "Wait for your admission documents", detail: "Visa preparation follows admission. Your institution supplies admission documentation and may guide you on country-specific requirements.", sourceLabel: "Study in Korea: visa application", sourceUrl: studyInKoreaVisaUrl },
  { title: "Prepare the standard evidence", detail: "Government guidance lists a passport copy, recent photo, admission letter, education evidence and financial evidence among common D-2 documents. Other items can apply by country or circumstance.", sourceLabel: "Study in Korea: required documents", sourceUrl: studyInKoreaVisaUrl },
  { title: "Check your local diplomatic mission", detail: "Submit through the Korean embassy or consulate responsible for your location and follow its current checklist, fees and appointment process.", sourceLabel: "Korea Visa Portal", sourceUrl: koreaVisaPortalUrl },
  { title: "Check stay requirements after arrival", detail: "Use Hi Korea and your university's international office for current residence registration, reporting and extension steps after arrival.", sourceLabel: "Study in Korea: stay guidance", sourceUrl: studyInKoreaVisaUrl },
]

export const faqItems = [
  { category: "Programs", question: "Can I study in South Korea in English?", answer: "Some institutions offer English-taught courses and programs. Check the current program page and admissions guide for the language of instruction and accepted language evidence." },
  { category: "Language", question: "Do I need TOPIK for admission?", answer: "Requirements depend on the program and language track. A Korean-taught program may require TOPIK, while an English-taught program may request different evidence. The official admissions guide controls." },
  { category: "Planning", question: "What belongs in a study budget?", answer: "Include tuition, housing, food, insurance, transport, application charges and arrival costs. Treat calculator defaults as editable planning assumptions." },
  { category: "Documents", question: "When should I prepare documents?", answer: "Work backward from the official deadline and allow time for transcripts, certified translations, apostilles and recommendations where required." },
  { category: "Admissions", question: "Does a readiness score predict admission?", answer: "No. The checker only flags planning gaps from the information you enter. Universities make decisions under their published rules." },
  { category: "Reviews", question: "How are reviews handled?", answer: "Signed-in students can submit reviews. New and edited reviews remain private until a moderator approves them. Use reviews alongside official sources." },
  { category: "Privacy", question: "Where is my tool data stored?", answer: "Signed-in work is stored in your account. Guest drafts and checklists remain in the current browser tab and are not uploaded." },
  { category: "Reminders", question: "Will reminder emails always send?", answer: "Email must be enabled for your account and the service must have email delivery configured. The reminders page shows delivery availability and your schedule." },
]
