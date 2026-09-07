import { fetchManagedContent, saveManagedContent, type ManagedContentKind } from './api'
import { getModeratorSession } from './moderatorAuth'
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

const cache = new Map<string, unknown>()
let pending: Promise<void> | null = null
export function refreshManagedContent() {
  if (!pending) pending = Promise.all((['news', 'forum', 'qa', 'members'] as const).map(async kind => {
    const data = await fetchManagedContent(kind)
    if (data !== null) cache.set(`unichase.content.${kind}`, data)
  })).then(() => notifyContentChange()).finally(() => { pending = null })
  return pending
}
function readJson<T>(key: string, fallback: T): T { return (cache.get(key) as T) ?? fallback }
async function writeJson(key: string, value: unknown[]) {
  const session = getModeratorSession()
  if (!session) throw new Error('Please sign in to publish content.')
  await saveManagedContent(session.token, key.split('.').pop() as ManagedContentKind, value)
  cache.set(key, value)
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

export async function setManagedNews(items: NewsArticle[]) {
  await writeJson(newsKey, byNewestId(items))
}

export async function resetManagedNews() {
  await writeJson(newsKey, news)
}

export function getManagedForumPosts() {
  return byNewestId(readJson<ForumPost[]>(forumKey, forumPosts))
}

export async function setManagedForumPosts(items: ForumPost[]) {
  await writeJson(forumKey, byNewestId(items))
}

export async function resetManagedForumPosts() {
  await writeJson(forumKey, forumPosts)
}

export function getManagedQaPosts() {
  return byNewestId(readJson<QAPost[]>(qaKey, qaPosts))
}

export async function setManagedQaPosts(items: QAPost[]) {
  await writeJson(qaKey, byNewestId(items))
}

export async function resetManagedQaPosts() {
  await writeJson(qaKey, qaPosts)
}

export function getManagedMembers() {
  return byNewestId(readJson<SocietyMember[]>(membersKey, defaultMembers))
}

export async function setManagedMembers(items: SocietyMember[]) {
  await writeJson(membersKey, byNewestId(items))
}

export async function resetManagedMembers() {
  await writeJson(membersKey, defaultMembers)
}
