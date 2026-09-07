import { parsePagination } from "../pagination.js"
import { Router } from "express"
import { requireStudent } from "../auth.js"
import { ApiError, asyncHandler, isPrismaMissingRecord } from "../errors.js"
import { parsePositiveId } from "../universityQuery.js"
import {
  communityCategories,
  communityCommentCreateSchema,
  communityCommentUpdateSchema,
  communityPostCreateSchema,
  communityPostUpdateSchema,
  communityReportSchema,
  validateBody,
} from "../validation.js"

const visibleContent = { in: ["published", "reported"] }

function mapAuthor(author) {
  return author ? { id: author.id, name: author.name } : null
}

function mapPost(post, viewerId) {
  const likes = post._count?.likes ?? post.likes?.length ?? 0
  const comments = post._count?.comments ?? post.comments?.length ?? 0
  const saved = post.savedBy?.some((item) => item.userId === viewerId) ?? false
  const liked = post.likes?.some((item) => item.userId === viewerId) ?? false

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    category: post.category,
    universityId: post.universityId,
    university: post.university ? { id: post.university.id, name: post.university.name, slug: post.university.slug, city: post.university.city } : null,
    relatedProgram: post.relatedProgram,
    tags: post.tags,
    author: mapAuthor(post.author),
    authorId: post.authorId,
    status: post.status,
    pinned: post.pinned,
    officialAnswer: post.officialAnswer,
    officialCommentId: post.officialCommentId,
    likes,
    comments,
    liked,
    saved,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }
}

function mapComment(comment) {
  return {
    id: comment.id,
    postId: comment.postId,
    authorId: comment.authorId,
    author: mapAuthor(comment.author),
    content: comment.content,
    parentCommentId: comment.parentCommentId,
    status: comment.status,
    official: comment.official,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  }
}

async function optionalStudent(prisma, req) {
  const authorization = req.headers.authorization || ""
  if (!authorization) return null

  return new Promise((resolve) => {
    requireStudent(prisma)(req, {}, (error) => {
      if (error) resolve(null)
      else resolve(req.user)
    })
  })
}

export function createCommunityRouter(prisma) {
  const router = Router()

  router.get("/categories", (req, res) => {
    res.json({ data: communityCategories })
  })

  router.get(
    "/posts",
    asyncHandler(async (req, res) => {
      const viewer = await optionalStudent(prisma, req)
      const { take, page, skip } = parsePagination(req.query, 20, 50)
      const search = typeof req.query.search === "string" ? req.query.search.trim() : ""
      const category = typeof req.query.category === "string" ? req.query.category.trim() : ""
      const universityId = req.query.universityId ? Number(req.query.universityId) : null

      const where = {
        status: visibleContent,
        ...(category ? { category } : {}),
        ...(Number.isInteger(universityId) && universityId > 0 ? { universityId } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
                { tags: { has: search } },
              ],
            }
          : {}),
      }

      const [posts, total] = await Promise.all([
        prisma.communityPost.findMany({
          where,
          include: {
            author: { select: { id: true, name: true } },
            university: { select: { id: true, name: true, slug: true, city: true } },
            likes: viewer ? { where: { userId: viewer.id } } : false,
            savedBy: viewer ? { where: { userId: viewer.id } } : false,
            _count: { select: { comments: { where: { status: visibleContent } }, likes: true } },
          },
          orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
          skip,
          take,
        }),
        prisma.communityPost.count({ where }),
      ])

      res.json({ data: posts.map((post) => mapPost(post, viewer?.id)), meta: { total, page, limit: take } })
    }),
  )

  router.get(
    "/posts/:id",
    asyncHandler(async (req, res) => {
      const viewer = await optionalStudent(prisma, req)
      const post = await prisma.communityPost.findFirst({
        where: { id: parsePositiveId(req.params.id), status: visibleContent },
        include: {
          author: { select: { id: true, name: true } },
          university: { select: { id: true, name: true, slug: true, city: true } },
          likes: viewer ? { where: { userId: viewer.id } } : false,
          savedBy: viewer ? { where: { userId: viewer.id } } : false,
          comments: {
            where: { status: visibleContent },
            include: { author: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { comments: { where: { status: visibleContent } }, likes: true } },
        },
      })

      if (!post) throw new ApiError(404, "Community post not found")

      res.json({ data: { ...mapPost(post, viewer?.id), comments: post.comments.map(mapComment) } })
    }),
  )

  router.post(
    "/posts",
    requireStudent(prisma),
    validateBody(communityPostCreateSchema),
    asyncHandler(async (req, res) => {
      const post = await prisma.communityPost.create({
        data: {
          ...req.body,
          authorId: req.user.id,
          status: "published",
        },
        include: {
          author: { select: { id: true, name: true } },
          university: { select: { id: true, name: true, slug: true, city: true } },
          _count: { select: { comments: { where: { status: visibleContent } }, likes: true } },
        },
      })

      await prisma.analyticsEvent.create({
        data: {
          userId: req.user.id,
          eventType: "community_post_created",
          entityType: "community_post",
          entityId: post.id,
          metadata: { category: post.category },
        },
      })

      res.status(201).json({ data: mapPost(post, req.user.id) })
    }),
  )

  router.patch(
    "/posts/:id",
    requireStudent(prisma),
    validateBody(communityPostUpdateSchema),
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const existing = await prisma.communityPost.findUnique({ where: { id } })

      if (!existing) throw new ApiError(404, "Community post not found")
      if (existing.authorId !== req.user.id) throw new ApiError(403, "You can only edit your own posts")

      if (["hidden", "removed"].includes(existing.status)) throw new ApiError(403, "Moderated posts cannot be edited")
      const post = await prisma.communityPost.update({
        where: { id, authorId: req.user.id },
        data: { ...req.body },
        include: {
          author: { select: { id: true, name: true } },
          university: { select: { id: true, name: true, slug: true, city: true } },
          _count: { select: { comments: { where: { status: visibleContent } }, likes: true } },
        },
      })

      res.json({ data: mapPost(post, req.user.id) })
    }),
  )

  router.delete(
    "/posts/:id",
    requireStudent(prisma),
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const existing = await prisma.communityPost.findUnique({ where: { id } })

      if (!existing) throw new ApiError(404, "Community post not found")
      if (existing.authorId !== req.user.id) throw new ApiError(403, "You can only delete your own posts")

      await prisma.communityPost.update({ where: { id }, data: { status: "removed" } })
      res.json({ data: { ok: true } })
    }),
  )

  router.post(
    "/posts/:id/comments",
    requireStudent(prisma),
    validateBody(communityCommentCreateSchema),
    asyncHandler(async (req, res) => {
      const postId = parsePositiveId(req.params.id)
      const post = await prisma.communityPost.findFirst({ where: { id: postId, status: visibleContent } })

      if (!post) throw new ApiError(404, "Community post not found")

      if (req.body.parentCommentId) {
        const parent = await prisma.communityComment.findFirst({ where: { id: req.body.parentCommentId, postId, status: visibleContent } })
        if (!parent) throw new ApiError(404, "Parent comment not found in this post")
      }
      const comment = await prisma.communityComment.create({
        data: {
          postId,
          authorId: req.user.id,
          content: req.body.content,
          status: "published",
          parentCommentId: req.body.parentCommentId,
        },
        include: { author: { select: { id: true, name: true } } },
      })

      if (post.authorId !== req.user.id) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: "community_reply",
            title: "New reply on your community post",
            message: `${req.user.name} replied to "${post.title}".`,
            relatedEntityType: "community_post",
            relatedEntityId: post.id,
            linkUrl: `/community/${post.id}`,
            priority: "normal",
          },
        })
      }

      await prisma.analyticsEvent.create({
        data: {
          userId: req.user.id,
          eventType: "community_comment_created",
          entityType: "community_post",
          entityId: post.id,
        },
      })

      res.status(201).json({ data: mapComment(comment) })
    }),
  )

  router.patch(
    "/comments/:id",
    requireStudent(prisma),
    validateBody(communityCommentUpdateSchema),
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const existing = await prisma.communityComment.findUnique({ where: { id } })

      if (!existing) throw new ApiError(404, "Community comment not found")
      if (existing.authorId !== req.user.id) throw new ApiError(403, "You can only edit your own comments")

      if (["hidden", "removed"].includes(existing.status)) throw new ApiError(403, "Moderated comments cannot be edited")
      if (existing.official) throw new ApiError(403, "Ask a moderator to update an official answer")
      const comment = await prisma.communityComment.update({
        where: { id, authorId: req.user.id },
        data: req.body,
        include: { author: { select: { id: true, name: true } } },
      })

      res.json({ data: mapComment(comment) })
    }),
  )

  router.delete(
    "/comments/:id",
    requireStudent(prisma),
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const existing = await prisma.communityComment.findUnique({ where: { id } })

      if (!existing) throw new ApiError(404, "Community comment not found")
      if (existing.authorId !== req.user.id) throw new ApiError(403, "You can only delete your own comments")

      await prisma.$transaction(async (tx) => {
        await tx.communityComment.update({ where: { id, authorId: req.user.id }, data: { status: "removed", official: false } })
        await tx.communityPost.updateMany({ where: { officialCommentId: id }, data: { officialCommentId: null, officialAnswer: null } })
      })
      res.json({ data: { ok: true } })
    }),
  )

  router.post(
    "/posts/:id/like",
    requireStudent(prisma),
    asyncHandler(async (req, res) => {
      const postId = parsePositiveId(req.params.id)
      const post = await prisma.communityPost.findFirst({ where: { id: postId, status: visibleContent } })
      if (!post) throw new ApiError(404, "Community post not found")

      const existing = await prisma.communityLike.findUnique({ where: { userId_postId: { userId: req.user.id, postId } } })
      if (existing) {
        await prisma.communityLike.delete({ where: { userId_postId: { userId: req.user.id, postId } } })
      } else {
        await prisma.communityLike.create({ data: { userId: req.user.id, postId } })
        if (post.authorId !== req.user.id) {
          await prisma.notification.create({
            data: {
              userId: post.authorId,
              type: "community_like",
              title: "Your post was upvoted",
              message: `${req.user.name} upvoted "${post.title}".`,
              relatedEntityType: "community_post",
              relatedEntityId: post.id,
              linkUrl: `/community/${post.id}`,
            },
          })
        }
      }

      const count = await prisma.communityLike.count({ where: { postId } })
      res.json({ data: { liked: !existing, likes: count } })
    }),
  )

  router.post(
    "/posts/:id/save",
    requireStudent(prisma),
    asyncHandler(async (req, res) => {
      const postId = parsePositiveId(req.params.id)
      const post = await prisma.communityPost.findFirst({ where: { id: postId, status: visibleContent }, select: { id: true } })
      if (!post) throw new ApiError(404, "Community post not found")
      const existing = await prisma.communitySavedPost.findUnique({ where: { userId_postId: { userId: req.user.id, postId } } })
      if (existing) {
        await prisma.communitySavedPost.delete({ where: { userId_postId: { userId: req.user.id, postId } } })
      } else {
        await prisma.communitySavedPost.create({ data: { userId: req.user.id, postId } })
      }

      res.json({ data: { saved: !existing } })
    }),
  )

  router.post(
    "/posts/:id/report",
    requireStudent(prisma),
    validateBody(communityReportSchema),
    asyncHandler(async (req, res) => {
      const postId = parsePositiveId(req.params.id)
      const post = await prisma.communityPost.findFirst({ where: { id: postId, status: visibleContent }, select: { id: true } })
      if (!post) throw new ApiError(404, "Community post not found")
      if (req.body.commentId) {
        const comment = await prisma.communityComment.findFirst({ where: { id: req.body.commentId, postId, status: visibleContent }, select: { id: true } })
        if (!comment) throw new ApiError(404, "Comment not found in this post")
      }
      const report = await prisma.communityReport.create({
        data: {
          postId,
          commentId: req.body.commentId,
          reporterId: req.user.id,
          reason: req.body.reason,
          details: req.body.details,
        },
      })

      if (req.body.commentId) await prisma.communityComment.updateMany({ where: { id: req.body.commentId, postId, status: "published" }, data: { status: "reported" } })
      await prisma.communityPost.updateMany({ where: { id: postId, status: "published" }, data: { status: "reported" } }).catch((error) => {
        if (!isPrismaMissingRecord(error)) throw error
      })

      res.status(201).json({ data: report })
    }),
  )

  return router
}
