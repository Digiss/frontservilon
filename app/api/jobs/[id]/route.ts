import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
  unavailableBackendEndpoint,
} from '@/lib/auth-backend'
import { extractPosts, toAppJob } from '@/lib/post-mapper'

type RouteContext = { params: Promise<{ id: string }> }
type BackendPost = ReturnType<typeof extractPosts>[number]
type PostLookupResult = { post: BackendPost | null; response: Response | null }
type UpdatePostPayload = {
  Title?: string
  Description?: string
  MinimumPrice?: number
  MaximumPrice?: number
  DeliveryDays?: number
  SectorId?: number
  ServiceTypeId?: number
  WorkStatusId?: number
}

async function findPostById(request: Request, endpoint: string, postId: number): Promise<PostLookupResult> {
  const pageSize = 100
  const seenIds = new Set<number>()

  for (let page = 1; ; page += 1) {
    const headers = new Headers({ Page: String(page), Limit: String(pageSize) })
    const response = await requestServilonBackend(request, endpoint, { method: 'GET', headers })
    if (!response.ok) return { post: null, response }

    const posts = extractPosts(await response.json())
    const match = posts.find(post => post.id === postId)
    if (match) return { post: match, response: null }
    if (posts.length < pageSize) return { post: null, response: null }
    if (posts.every(post => seenIds.has(post.id))) {
      throw new Error(`A API repetiu uma página de posts durante a busca pelo post ${postId}.`)
    }

    for (const post of posts) seenIds.add(post.id)
  }
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const postId = Number(id)
  if (!Number.isInteger(postId) || postId < 1) {
    return NextResponse.json({ error: 'O identificador do post é inválido.' }, { status: 400 })
  }

  try {
    const ownPosts = await findPostById(request, '/api/Post/GetPostsHistory', postId)
    if (ownPosts.response) return servilonBackendResponse(ownPosts.response)
    if (ownPosts.post) return NextResponse.json(toAppJob(ownPosts.post))

    const visiblePosts = await findPostById(request, '/api/Post/GetPosts', postId)
    if (visiblePosts.response) return servilonBackendResponse(visiblePosts.response)
    if (visiblePosts.post) return NextResponse.json(toAppJob(visiblePosts.post))

    return NextResponse.json({ error: `O post ${postId} não foi encontrado.` }, { status: 404 })
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const postId = Number(id)
  if (!Number.isInteger(postId) || postId < 1) {
    return NextResponse.json({ error: 'O identificador do post é inválido.' }, { status: 400 })
  }

  let payload: UpdatePostPayload
  try {
    payload = await request.json() as UpdatePostPayload
  } catch {
    return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
  }

  if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Informe ao menos um campo para atualizar.' }, { status: 400 })
  }
  if (payload.WorkStatusId !== undefined &&
    (!Number.isInteger(payload.WorkStatusId) || payload.WorkStatusId < 1)) {
    return NextResponse.json({ error: 'WorkStatusId deve ser um inteiro positivo.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, '/api/Post/UpdatePost', {
      method: 'POST',
      body: JSON.stringify({ ...payload, PostId: postId }),
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}

export async function DELETE() {
  return unavailableBackendEndpoint('/api/Post/DeletePost')
}
