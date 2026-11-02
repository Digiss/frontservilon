import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

export async function GET(request: Request) {
  try {
    const response = await requestServilonBackend(request, '/api/WorkStatus/GetWorkStatus', {
      method: 'GET',
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
