import { forumPosts, qaPosts, type ForumPost, type QAPost } from '@/data/community'
import { news, type NewsArticle } from '@/data/news'

export type SocietyMember = {
  id: number
  name: string
  role: string
  country: string
  university: string
  bio: string
  image: string
}

const newsKey = 'unichase.content.news'
const forumKey = 'unichase.content.forum'
const qaKey = 'unichase.content.qa'
const membersKey = 'unichase.content.members'

export const contentChangeEvent = 'unichase:content-change'

export const defaultMembers: SocietyMember[] = [
  {
    id: 1,
    name: 'Maria S.',
    role: 'Student mentor',
    country: 'Spain',
    university: 'Yonsei University',
    bio: 'Helps new students understand campus life, dorms, and arrival basics.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80',
  },
  {
    id: 2,
    name: 'James K.',
    role: 'Community guide',
    country: 'United States',
    university: 'Korea University',
    bio: 'Shares study tips, scholarship notes, and neighborhood recommendations.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
  },
  {
    id: 3,
    name: 'Sofia R.',
    role: 'Career buddy',
    country: 'Uzbekistan',
    university: 'Hanyang University',
    bio: 'Supports students preparing for part-time jobs, internships, and interviews.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80',
  },
]

function notifyContentChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(contentChangeEvent))
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
  notifyContentChange()
}

function byNewestId<T extends { id: number }>(items: T[]) {
  return [...items].sort((a, b) => b.id - a.id)
}

export function createNextId(items: { id: number }[]) {
  return Math.max(0, ...items.map((item) => item.id)) + 1
}

export function getManagedNews() {
  return byNewestId(readJson<NewsArticle[]>(newsKey, news))
}

export function setManagedNews(items: NewsArticle[]) {
  writeJson(newsKey, byNewestId(items))
}

export function resetManagedNews() {
  localStorage.removeItem(newsKey)
  notifyContentChange()
}

export function getManagedForumPosts() {
  return byNewestId(readJson<ForumPost[]>(forumKey, forumPosts))
}

export function setManagedForumPosts(items: ForumPost[]) {
  writeJson(forumKey, byNewestId(items))
}

export function resetManagedForumPosts() {
  localStorage.removeItem(forumKey)
  notifyContentChange()
}

export function getManagedQaPosts() {
  return byNewestId(readJson<QAPost[]>(qaKey, qaPosts))
}

export function setManagedQaPosts(items: QAPost[]) {
  writeJson(qaKey, byNewestId(items))
}

export function resetManagedQaPosts() {
  localStorage.removeItem(qaKey)
  notifyContentChange()
}

export function getManagedMembers() {
  return byNewestId(readJson<SocietyMember[]>(membersKey, defaultMembers))
}

export function setManagedMembers(items: SocietyMember[]) {
  writeJson(membersKey, byNewestId(items))
}

export function resetManagedMembers() {
  localStorage.removeItem(membersKey)
  notifyContentChange()
}
