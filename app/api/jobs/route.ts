import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  appUserFromAccessToken,
  getCookie,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'
import { extractPosts, toAppJob } from '@/lib/post-mapper'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const user = appUserFromAccessToken(getCookie(request, 'access_token') || '')
    if (!user) return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 401 })

    const scope = url.searchParams.get('scope')
    if (scope === 'own') {
      const response = await requestServilonBackend(
        request,
        user.role === 'cliente'
          ? '/api/Post/GetPostsByClientId'
          : '/api/Post/GetPostsByFreeLancerId',
        { method: 'GET' },
      )
      if (!response.ok) return servilonBackendResponse(response)
      return NextResponse.json(extractPosts(await response.json()).map(toAppJob))
    }

    if (scope === 'feed') {
      const query = new URLSearchParams({
        Page: url.searchParams.get('page') || '1',
        Limit: url.searchParams.get('pageSize') || '50',
      })
      const response = await requestServilonBackend(
        request,
        `/api/Post/GetPostsFeed?${query.toString()}`,
        { method: 'GET' },
      )
      if (!response.ok) return servilonBackendResponse(response)
      return NextResponse.json(extractPosts(await response.json()).map(toAppJob))
    }

    const headers = new Headers()
    const filters = [
      ['SectorId', 'sectorId'],
      ['ServiceTypeId', 'serviceTypeId'],
      ['WorkStatusId', 'workStatusId'],
      ['MinPrice', 'minPrice'],
      ['MaxPrice', 'maxPrice'],
      ['Search', 'search'],
      ['Page', 'page'],
      ['Limit', 'pageSize'],
    ] as const
    for (const [header, parameter] of filters) {
      const value = url.searchParams.get(parameter)
      if (value) headers.set(header, value)
    }
    const response = await requestServilonBackend(request, '/api/Post/GetPosts', {
      method: 'GET',
      headers,
    })
    if (!response.ok) return servilonBackendResponse(response)
    return NextResponse.json(extractPosts(await response.json()).map(toAppJob))
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    let payload: {
      Title: string
      Description: string
      Price: number
      DeliveryDays: string
      DeliveryHours: string
      SectorId: number
      ServiceTypeId: number
    }
    try {
      payload = await request.json() as typeof payload
    } catch {
      return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
    }
    const backendResponse = await requestServilonBackend(request, '/api/Post/CreatePost', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!backendResponse.ok) return servilonBackendResponse(backendResponse)

    const result = await backendResponse.json() as { postId?: number; PostId?: number }
    const postId = result.postId ?? result.PostId
    if (!postId) {
      return NextResponse.json({ error: 'A API não retornou o identificador do post criado.' }, { status: 502 })
    }
    return NextResponse.json(toAppJob({
      ...payload,
      id: postId,
      workStatus: { statusName: 'Não iniciado' },
    }), { status: backendResponse.status })
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
