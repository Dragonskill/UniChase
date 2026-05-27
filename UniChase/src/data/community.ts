export interface ForumPost {
  id: number
  tag: string
  title: string
  author: string
  replies: number
  date: string
  isNew?: boolean
  content: string
}

export interface QAPost {
  id: number
  title: string
  author: string
  answers: number
  solved: boolean
  date: string
  content: string
}

export const forumPosts: ForumPost[] = [
  { id: 1, tag: 'Promotion', title: 'Recruitment Notice for the 2026 Daegu Chimac Festival 99 Cheers Challenge', author: 'FestivalTeam', replies: 12, date: '20 May', isNew: true, content: 'We are looking for enthusiastic volunteers to join the 2026 Daegu Chimac Festival!\n\nThis is a great chance to gain experience and meet new people. Apply through the link in our bio.' },
  { id: 2, tag: 'Promotion', title: '2026 Daegu Chimac Festival Global Chimac Friends Recruitment', author: 'EventOrg', replies: 5, date: '20 May', content: 'Join our Global Chimac Friends program!\n\nOpen to all international students. No experience needed.' },
  { id: 3, tag: 'Career', title: 'CJ ChaeilJedang Global Internship Interview experience', author: 'Sarah_K', replies: 23, date: '18 May', content: 'I recently went through the CJ internship interview process and wanted to share my experience.\n\nThe interview had three rounds. Here is what to expect and how to prepare.' },
  { id: 4, tag: 'Discussion', title: 'Best neighborhoods for international students in Seoul?', author: 'Mike_T', replies: 41, date: '16 May', content: 'I am moving to Seoul next semester and trying to figure out where to live.\n\nWhat neighborhoods do you recommend for international students? Budget-friendly options preferred!' },
  { id: 5, tag: 'Promotion', title: 'A Meditative Concert in Between <Sai... Sori... Sum...>', author: 'ArtsClub', replies: 3, date: '12 May', content: 'Join us for an evening of meditation and music.\n\nFree entry for students. Limited seats available.' },
]

export const qaPosts: QAPost[] = [
  { id: 1, title: 'How do I extend my D-2 student visa?', author: 'Anna_L', answers: 7, solved: true, date: '21 May', content: 'My D-2 visa expires soon and I need to extend it. What documents do I need and where do I go?' },
  { id: 2, title: 'Can I work part-time on a student visa?', author: 'David_M', answers: 4, solved: true, date: '19 May', content: 'I want to work part-time to support myself. Is this allowed on a D-2 student visa? What are the rules?' },
  { id: 3, title: 'Best bank for international students to open an account?', author: 'Sofia_R', answers: 12, solved: false, date: '17 May', content: 'Which Korean bank is easiest for international students to open an account with? Looking for one with English support.' },
  { id: 4, title: 'How to find off-campus housing near my university?', author: 'James_K', answers: 6, solved: false, date: '14 May', content: 'My dorm contract is ending and I need to find off-campus housing. Any tips on finding affordable places near campus?' },
]