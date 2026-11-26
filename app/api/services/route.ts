import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const headers = new Headers()
    const filters = [
      ['SectorId', 'sectorId'],
      ['ServiceTypeId', 'serviceTypeId'],
      ['WorkStatusId', 'workStatusId'],
      ['MinPrice', 'minPrice'],
      ['MaxPrice', 'maxPrice'],
      ['Search', 'search'],
      ['Page', 'page'],
      ['Limit', 'limit'],
    ] as const

    for (const [header, parameter] of filters) {
      const value = url.searchParams.get(parameter)
      if (value) headers.set(header, value)
    }

    const response = await requestServilonBackend(request, '/api/Service/GetServiceHistory', {
      method: 'GET',
      headers,
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
