import { authBackendErrorResponse, passThroughAuthResponse, requestAuthBackend } from '@/lib/auth-backend'

export async function POST(request: Request) {
  try {
    return await passThroughAuthResponse(await requestAuthBackend(request, 'Refresh'))
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
