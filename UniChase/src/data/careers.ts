export interface Career {
  id: number
  logo: string
  title: string
  company: string
  type: string
  daysLeft: number
  location: string
  description: string
}

export const careers: Career[] = [
  { id: 1, logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&q=80', title: '[MAMF] Korea Migrant Song Festival Applications', company: 'Migrants Arirang Multicultural Festival Committee', type: 'Extracurricular', daysLeft: 66, location: 'Seoul', description: 'Join the organizing team for this year\'s festival.\n\nGreat opportunity to gain event experience.' },
  { id: 2, logo: 'https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=100&q=80', title: 'Recruiting the 18th Jin Ramyun JIN&JINY "Go-To Jin!"', company: 'Otoki', type: 'Extracurricular', daysLeft: 24, location: 'Seoul', description: 'Become a brand ambassador for Otoki.\n\nFlexible hours, great perks.' },
  { id: 3, logo: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=100&q=80', title: '[Busan International Film Festival] Recruitment for Planning Team', company: 'Busan International Film Festival', type: 'Full time', daysLeft: 10, location: 'Busan', description: 'Work on one of Asia\'s biggest film festivals.\n\nFull-time position with competitive salary.' },
  { id: 4, logo: 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=100&q=80', title: '[DAEHAKNAEIL] Zetplanet-K member recruitment', company: 'DAEHAKNAEIL', type: 'Extracurricular', daysLeft: 10, location: 'Online', description: 'Join our student content creation team.\n\nRemote work available.' },
  { id: 5, logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&q=80', title: '[HanmiGlobal] Recruitment for International Applicants', company: 'HanmiGlobal', type: 'Full time', daysLeft: 8, location: 'Seoul', description: 'Construction management firm seeking international talent.\n\nVisa sponsorship available.' },
  { id: 6, logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&q=80', title: 'Samsung Global Internship Program 2026', company: 'Samsung', type: 'Internship', daysLeft: 30, location: 'Suwon', description: 'Summer internship for international students.\n\nLeading tech company experience.' },
  { id: 7, logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&q=80', title: 'LG Marketing Intern', company: 'LG', type: 'Internship', daysLeft: 15, location: 'Seoul', description: 'Join the marketing team as an intern.\n\nHands-on experience guaranteed.' },
]