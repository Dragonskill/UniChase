import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import GlowLetters from "@/components/ui/GlowLetters"
import {
  updateCommunityComment,
  deleteCommunityComment,
  createCommunityComment,
  deleteCommunityPost,
  fetchCommunityPost,
  reportCommunityPost,
  toggleCommunityPostLike,
  toggleCommunityPostSave,
  updateCommunityPost,
  type CommunityComment,
  type CommunityPost,
} from "@/lib/api"
import { applySeo } from "@/lib/seo"
import { getStoredUser, getToken } from "@/lib/storage"

export default function PostDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const token = getToken()
  const user = getStoredUser<{ id: number; name: string }>()
  const [post, setPost] = useState<(CommunityPost & { comments: CommunityComment[] }) | null>(null)
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [editingComment, setEditingComment] = useState<number | null>(null)
  const [commentText, setCommentText] = useState("")
  const [reply, setReply] = useState("")
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: "", content: "" })
  const [status, setStatus] = useState("")

  const refresh = useCallback(() => {
    if (!id) return
    fetchCommunityPost(id, token).then((data) => {
      setPost(data)
      setEditForm({ title: data.title, content: data.content })
    }).catch(() => { setPost(null); setStatus("Could not load this post. It may have been removed, or the connection failed.") })
  }, [id, token])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (post) {
      applySeo({
        title: `${post.title} | UniChase Community`,
        description: post.content.slice(0, 150),
        canonicalPath: `/community/${post.id}`,
      })
    }
  }, [post])

  const submitReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !post || !reply.trim()) {
      setStatus("Login is required to reply.")
      return
    }
    createCommunityComment(token, post.id, { content: reply, parentCommentId: replyTo })
      .then(() => {
        setReply(""); setReplyTo(null)
        refresh()
      })
      .catch(() => setStatus("Could not save reply."))
  }

  const saveEdit = () => {
    if (!token || !post) return
    updateCommunityPost(token, post.id, editForm)
      .then(() => {
        setEditing(false)
        refresh()
      })
      .catch(() => setStatus("Could not update post."))
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link to="/community" className="text-sm text-teal hover:underline">Back to Community</Link>
        <p className="mt-6 text-muted">{status || "Loading post..."}</p>
      </div>
    )
  }

  const ownsPost = user?.id === post.authorId

  return (
    <article className="page-fade max-w-3xl mx-auto px-5 sm:px-6 py-10">
      <Link to="/community" className="text-sm text-teal hover:underline mb-8 inline-block">Back to Community</Link>

      {status && <p className="mb-4 rounded-lg bg-teal/10 px-4 py-3 text-sm text-teal">{status}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs bg-cream-dark text-ink px-3 py-1 rounded-full">{post.category}</span>
        {post.university && <span className="text-xs bg-cream text-muted px-3 py-1 rounded-full">{post.university.name}</span>}
        {post.officialAnswer && <span className="text-xs bg-teal/10 text-teal px-3 py-1 rounded-full">Official answer</span>}
      </div>

      {editing ? (
        <div className="grid gap-3 rounded-2xl bg-surface p-5 shadow-sm">
          <input aria-label="Post title" value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          <textarea aria-label="Post content" value={editForm.content} onChange={(event) => setEditForm({ ...editForm, content: event.target.value })} rows={8} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          <div className="flex gap-2">
            <button onClick={saveEdit} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Save</button>
            <button onClick={() => setEditing(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-muted">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <GlowLetters as="h1" text={post.title} variant="title" className="text-2xl sm:text-3xl font-bold text-navy leading-tight mb-6" />
          <div className="flex items-center justify-between gap-3 pb-6 mb-8 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-teal flex items-center justify-center text-white font-bold">{post.author?.name?.charAt(0) || "U"}</div>
              <div>
                <p className="text-sm font-semibold text-navy">{post.author?.name || "Student"}</p>
                <p className="text-xs text-muted">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
            </div>
            {ownsPost && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className="text-xs text-teal hover:underline">Edit</button>
                <button onClick={() => token && deleteCommunityPost(token, post.id).then(() => navigate("/community")).catch(() => setStatus("Could not delete post."))} className="text-xs text-muted hover:text-teal">Delete</button>
              </div>
            )}
          </div>

          <div className="text-ink leading-relaxed text-base mb-8">
            {post.content.split("\n\n").map((para, index) => <p key={index} className="mb-4">{para}</p>)}
          </div>
        </>
      )}

      {post.officialAnswer && (
        <section className="mb-8 rounded-2xl border border-teal/30 bg-teal/10 p-5">
          <h2 className="font-bold text-navy">Official answer</h2>
          <p className="mt-2 text-sm text-gray-700">{post.officialAnswer}</p>
        </section>
      )}

      <div className="mb-8 flex flex-wrap gap-2">
        <button onClick={() => token ? toggleCommunityPostLike(token, post.id).then(refresh).catch(() => setStatus("Could not update vote.")) : setStatus("Login is required to vote.")} className={`rounded-full px-3 py-1 text-sm ${post.liked ? "bg-teal text-white" : "bg-cream text-muted hover:text-teal"}`}>{post.likes} upvotes</button>
        <button onClick={() => token ? toggleCommunityPostSave(token, post.id).then(refresh).catch(() => setStatus("Could not save post.")) : setStatus("Login is required to save posts.")} className={`rounded-full px-3 py-1 text-sm ${post.saved ? "bg-navy text-white" : "bg-cream text-muted hover:text-teal"}`}>{post.saved ? "Saved" : "Save"}</button>
        <button onClick={() => token ? reportCommunityPost(token, post.id, { reason: "other", details: "Reported from post detail page" }).then(() => setStatus("Report sent to moderators.")).catch(() => setStatus("Could not send report.")) : setStatus("Login is required to report.")} className="rounded-full bg-cream px-3 py-1 text-sm text-muted hover:text-teal">Report</button>
      </div>

      <section className="border-t border-gray-100 pt-8">
        <h2 className="text-lg font-bold text-navy mb-6">{post.comments.length} Replies</h2>
        {replyTo && <p className="mb-3 text-sm text-ink">Replying to {post.comments.find(comment => comment.id === replyTo)?.author?.name || "Student"} <button className="text-teal ml-3" onClick={() => setReplyTo(null)}>Cancel</button></p>}
        <form id="reply-form" onSubmit={submitReply} className="bg-surface border border-gray-100 rounded-xl p-4 mb-6 shadow-sm">
          <textarea aria-label="Reply" maxLength={5000} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply..." className="w-full bg-transparent text-sm resize-none focus:outline-none" rows={3} />
          <div className="flex justify-end">
            <button className="bg-teal hover:bg-teal-light text-white text-sm px-5 py-2 rounded-lg transition-colors font-medium">Reply</button>
          </div>
        </form>
        <div className="space-y-3">
          {post.comments.length === 0 && <p className="text-sm text-muted text-center py-8">Be the first to reply.</p>}
          {post.comments.map((comment) => (
            <article key={comment.id} className={`rounded-xl bg-surface p-4 shadow-sm ${comment.parentCommentId ? "ml-4 border-l-2 border-teal/30" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-navy">{comment.author?.name || "Student"}</p>
                {comment.official && <span className="rounded-full bg-teal/10 px-2 py-0.5 text-xs text-teal">Official</span>}
              </div>
              {comment.parentCommentId && <p className="text-xs text-muted">Reply to {post.comments.find(entry => entry.id === comment.parentCommentId)?.author?.name || 'Student'}</p>}
              {editingComment === comment.id ? <form className="mt-3" onSubmit={event => { event.preventDefault(); if (token) void updateCommunityComment(token, comment.id, commentText).then(() => { setEditingComment(null); refresh() }).catch(() => setStatus('Could not edit comment.')) }}>
                <textarea aria-label="Edit comment" required value={commentText} onChange={event => setCommentText(event.target.value)} className="w-full border rounded-lg bg-cream p-2" />
                <button className="text-sm text-teal mr-3">Save comment</button><button type="button" onClick={() => setEditingComment(null)} className="text-sm text-muted">Cancel</button>
              </form> : <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>}
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                <button className="text-teal" onClick={() => { if (!token) { setStatus('Login is required to reply.'); return } setReplyTo(comment.id); document.querySelector<HTMLTextAreaElement>('#reply-form textarea')?.focus() }}>Reply</button>
                {token && user?.id === comment.authorId && <><button className="text-teal" onClick={() => { setEditingComment(comment.id); setCommentText(comment.content) }}>Edit</button><button className="text-muted" onClick={() => void deleteCommunityComment(token, comment.id).then(refresh).catch(() => setStatus('Could not delete comment.'))}>Delete</button></>}
                <button className="text-muted" onClick={() => token ? reportCommunityPost(token, post.id, { reason: 'other', commentId: comment.id }).then(() => setStatus('Comment reported to moderators.')).catch(() => setStatus('Could not report comment.')) : setStatus('Login is required to report.')}>Report</button>
              </div>
              <p className="mt-2 text-xs text-muted">{new Date(comment.createdAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </section>
    </article>
  )
}
