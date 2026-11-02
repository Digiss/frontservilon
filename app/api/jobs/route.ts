import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  appUserFromAccessToken,
  getCookie,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'
import { extractPosts, toAppJob, type TaxonomyLookups } from '@/lib/post-mapper'
import { extractSectors, extractServiceTypes, extractWorkStatuses } from '@/lib/taxonomy-mapper'

// A API não devolve os objetos aninhados (sector/serviceType/workStatus) nas listagens de post,
// só os IDs crus. Buscamos os catálogos aqui pra reconstruir os nomes no front, sem depender disso no backend.
async function loadTaxonomyLookups(request: Request): Promise<TaxonomyLookups> {
  const [sectorsResponse, serviceTypesResponse, workStatusesResponse] = await Promise.all([
    requestServilonBackend(request, '/api/Sector/GetSector', { method: 'GET' }),
    requestServilonBackend(request, '/api/ServiceType/GetServiceType', { method: 'GET' }),
    requestServilonBackend(request, '/api/WorkStatus/GetWorkStatus', { method: 'GET' }),
  ])
  const sectors = sectorsResponse.ok ? extractSectors(await sectorsResponse.json()) : []
  const serviceTypes = serviceTypesResponse.ok ? extractServiceTypes(await serviceTypesResponse.json()) : []
  const workStatuses = workStatusesResponse.ok ? extractWorkStatuses(await workStatusesResponse.json()) : []
  return {
    sectors: new Map(sectors.map(sector => [sector.id, sector.name])),
    serviceTypes: new Map(serviceTypes.map(serviceType => [serviceType.id, serviceType.name])),
    workStatuses: new Map(workStatuses.map(workStatus => [workStatus.id, workStatus.name])),
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const user = appUserFromAccessToken(getCookie(request, 'access_token') || '')
    if (!user) return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 401 })

    const lookups = await loadTaxonomyLookups(request)

    const scope = url.searchParams.get('scope')
    if (scope === 'own') {
      const response = await requestServilonBackend(
        request,
        '/api/Post/GetPostsHistory',
        { method: 'GET' },
      )
      if (!response.ok) return servilonBackendResponse(response)
      return NextResponse.json(extractPosts(await response.json()).map(post => toAppJob(post, lookups)))
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
      return NextResponse.json(extractPosts(await response.json()).map(post => toAppJob(post, lookups)))
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
    return NextResponse.json(extractPosts(await response.json()).map(post => toAppJob(post, lookups)))
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    let payload: {
      Title: string
      Description: string
      MinimumPrice: number
      MaximumPrice: number
      DeliveryDays: number
      SectorId: number
      ServiceTypeId: number
    }
    try {
      payload = await request.json() as typeof payload
    } catch {
      return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
    }
    if (!Number.isInteger(payload.DeliveryDays) || payload.DeliveryDays < 1) {
      return NextResponse.json({ error: 'DeliveryDays deve ser um inteiro positivo.' }, { status: 400 })
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
      id: postId,
      title: payload.Title,
      description: payload.Description,
      minimumPrice: payload.MinimumPrice,
      maximumPrice: payload.MaximumPrice,
      deliveryDays: payload.DeliveryDays,
      sectorId: payload.SectorId,
      serviceTypeId: payload.ServiceTypeId,
      workStatus: { statusName: 'Não iniciado' },
    }), { status: backendResponse.status })
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
