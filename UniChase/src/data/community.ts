export interface ForumPost {
  id: number
  tag: string
  title: string
  author: string
  replies: number
  date: string
  isNew?: boolean
}

export interface QAPost {
  id: number
  title: string
  author: string
  answers: number
  solved: boolean
  date: string
}

export const forumPosts: ForumPost[] = [
  { id: 1, tag: 'Promotion', title: 'Recruitment Notice for the 2026 Daegu Chimac Festival 99 Cheers Challenge', author: 'FestivalTeam', replies: 12, date: '20 May', isNew: true },
  { id: 2, tag: 'Promotion', title: '2026 Daegu Chimac Festival Global Chimac Friends Recruitment', author: 'EventOrg', replies: 5, date: '20 May' },
  { id: 3, tag: 'Career', title: 'CJ ChaeilJedang Global Internship Interview experience', author: 'Sarah_K', replies: 23, date: '18 May' },
  { id: 4, tag: 'Discussion', title: 'Best neighborhoods for international students in Seoul?', author: 'Mike_T', replies: 41, date: '16 May' },
  { id: 5, tag: 'Promotion', title: 'A Meditative Concert in Between <Sai... Sori... Sum...>', author: 'ArtsClub', replies: 3, date: '12 May' },
]

export const qaPosts: QAPost[] = [
  { id: 1, title: 'How do I extend my D-2 student visa?', author: 'Anna_L', answers: 7, solved: true, date: '21 May' },
  { id: 2, title: 'Can I work part-time on a student visa?', author: 'David_M', answers: 4, solved: true, date: '19 May' },
  { id: 3, title: 'Best bank for international students to open an account?', author: 'Sofia_R', answers: 12, solved: false, date: '17 May' },
  { id: 4, title: 'How to find off-campus housing near my university?', author: 'James_K', answers: 6, solved: false, date: '14 May' },
]