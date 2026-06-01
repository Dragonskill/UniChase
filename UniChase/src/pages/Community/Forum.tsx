import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import GlowLetters from "@/components/ui/GlowLetters"
import {
  createCommunityPost,
  fetchCommunityCategories,
  fetchCommunityPosts,
  fetchUniversities,
  toggleCommunityPostLike,
  toggleCommunityPostSave,
  type CommunityPost,
} from "@/lib/api"
import { applySeo } from "@/lib/seo"
import { getToken } from "@/lib/storage"
import type { University } from "@/data/universities"

const inputClass = "bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"

export default function Forum() {
  const token = getToken()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [filters, setFilters] = useState({ search: "", category: "", universityId: "" })
  const [formOpen, setFormOpen] = useState(false)
  const [status, setStatus] = useState("")
  const [form, setForm] = useState({ title: "", content: "", category: "General Questions", universityId: "", tags: "" })

  const selectedUniversity = useMemo(
    () => universities.find((university) => String(university.id) === filters.universityId),
    [filters.universityId, universities],
  )

  const refresh = () => {
    fetchCommunityPosts({
      search: filters.search,
      category: filters.category,
      universityId: filters.universityId || undefined,
    }, token)
      .then((response) => setPosts(response.data))
      .catch(() => setStatus("Could not load community posts."))
  }

  useEffect(() => {
    applySeo({
      title: "Community | UniChase",
      description: "Ask questions, share answers, and join university-specific student discussions.",
      canonicalPath: "/community",
    })
    fetchCommunityCategories().then(setCategories).catch(() => undefined)
    fetchUniversities().then(setUniversities).catch(() => undefined)
  }, [])

  useEffect(() => {
    fetchCommunityPosts({
      search: filters.search,
      category: filters.category,
      universityId: filters.universityId || undefined,
    }, token)
      .then((response) => setPosts(response.data))
      .catch(() => setStatus("Could not load community posts."))
  }, [filters.category, filters.search, filters.universityId, token])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) {
      setStatus("Login is required to post.")
      return
    }

    createCommunityPost(token, {
      title: form.title,
      content: form.content,
      category: form.category,
      universityId: form.universityId ? Number(form.universityId) : null,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    })
      .then(() => {
        setForm({ title: "", content: "", category: "General Questions", universityId: "", tags: "" })
        setFormOpen(false)
        refresh()
      })
      .catch(() => setStatus("Could not create post."))
  }

  const toggleLike = (post: CommunityPost) => {
    if (!token) {
      setStatus("Login is required to upvote.")
      return
    }
    toggleCommunityPostLike(token, post.id).then((result) => {
      setPosts((items) => items.map((item) => (item.id === post.id ? { ...item, liked: result.liked, likes: result.likes } : item)))
    }).catch(() => setStatus("Could not update upvote."))
  }

  const toggleSave = (post: CommunityPost) => {
    if (!token) {
      setStatus("Login is required to save posts.")
      return
    }
    toggleCommunityPostSave(token, post.id).then((result) => {
      setPosts((items) => items.map((item) => (item.id === post.id ? { ...item, saved: result.saved } : item)))
    }).catch(() => setStatus("Could not save post."))
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-5 sm:px-6 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <GlowLetters as="h1" text="Community" variant="title" className="text-3xl font-bold text-navy mb-2" />
          <p className="text-muted">Ask questions, compare experiences, and follow university-specific discussions.</p>
        </div>
        <button onClick={() => setFormOpen((current) => !current)} className="rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-light">
          {formOpen ? "Close" : "Create post"}
        </button>
      </div>

      {status && <p className="mb-4 rounded-lg bg-teal/10 px-4 py-3 text-sm text-teal">{status}</p>}

      <section className="mb-6 bg-surface rounded-2xl shadow-sm p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_240px_auto]">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted">Search</span>
            <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} onKeyDown={(event) => event.key === "Enter" && refresh()} className={inputClass} placeholder="Search posts, tags, questions" />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted">Category</span>
            <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} className={inputClass}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-muted">University</span>
            <select value={filters.universityId} onChange={(event) => setFilters({ ...filters, universityId: event.target.value })} className={inputClass}>
              <option value="">All universities</option>
              {universities.map((university) => <option key={university.id} value={university.id}>{university.name}</option>)}
            </select>
          </label>
          <button onClick={refresh} className="self-end rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light">Apply</button>
        </div>
        {selectedUniversity && <p className="mt-3 text-sm text-muted">Viewing discussions related to <strong>{selectedUniversity.name}</strong>.</p>}
      </section>

      {formOpen && (
        <form onSubmit={submit} className="mb-6 grid gap-3 bg-surface rounded-2xl shadow-sm p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-muted">Title</span>
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} required />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-muted">Category</span>
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
          </div>
          <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={5} className={`${inputClass} resize-y`} placeholder="Write your question or discussion..." required />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select value={form.universityId} onChange={(event) => setForm({ ...form, universityId: event.target.value })} className={inputClass}>
              <option value="">No related university</option>
              {universities.map((university) => <option key={university.id} value={university.id}>{university.name}</option>)}
            </select>
            <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} className={inputClass} placeholder="Tags separated by commas" />
          </div>
          <button className="w-fit rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-light">Publish</button>
        </form>
      )}

      <div className="space-y-3">
        {posts.length === 0 && <section className="bg-surface rounded-2xl shadow-sm p-6 text-sm text-muted">No community posts match these filters.</section>}
        {posts.map((post) => (
          <article key={post.id} className="bg-surface rounded-2xl shadow-sm p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {post.pinned && <span className="rounded-full bg-teal/10 px-2 py-0.5 text-xs font-semibold text-teal">Pinned</span>}
                  <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-muted">{post.category}</span>
                  {post.university && <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-muted">{post.university.name}</span>}
                  {post.officialAnswer && <span className="rounded-full bg-teal/10 px-2 py-0.5 text-xs font-semibold text-teal">Official answer</span>}
                </div>
                <Link to={`/community/${post.id}`} className="text-lg font-bold text-navy hover:text-teal">{post.title}</Link>
                <p className="mt-2 line-clamp-2 text-sm text-gray-700">{post.content}</p>
                <p className="mt-3 text-xs text-muted">By {post.author?.name || "Student"} - {new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 text-sm text-muted">
                <button onClick={() => toggleLike(post)} className={`rounded-full px-3 py-1 ${post.liked ? "bg-teal text-white" : "bg-cream hover:text-teal"}`}>{post.likes} upvotes</button>
                <button onClick={() => toggleSave(post)} className={`rounded-full px-3 py-1 ${post.saved ? "bg-navy text-white" : "bg-cream hover:text-teal"}`}>{post.saved ? "Saved" : "Save"}</button>
                <span>{post.comments} replies</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
