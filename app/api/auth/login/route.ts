import { NextResponse } from 'next/server'
import {
  appUserFromAccessToken,
  authBackendErrorResponse,
  copyAuthCookies,
  requestAuthBackend,
} from '@/lib/auth-backend'

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      UserName: string | null
      Email: string | null
      Password: string
      Profile: 'Client' | 'FreeLancer'
    }
    const profile = body.Profile === 'FreeLancer' ? 1 : 0
    const backendResponse = await requestAuthBackend(request, 'Login', { ...body, Profile: profile })
    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text()
      const response = new NextResponse(errorBody || null, {
        status: backendResponse.status,
        headers: { 'Content-Type': backendResponse.headers.get('content-type') || 'application/json' },
      })
      copyAuthCookies(backendResponse.headers, response)
      return response
    }

    const result = await backendResponse.json() as { accessToken?: string }
    const user = result.accessToken ? appUserFromAccessToken(result.accessToken) : null
    if (!user) {
      return NextResponse.json({ error: 'A API não retornou uma sessão válida.' }, { status: 502 })
    }

    const response = NextResponse.json({ user })
    copyAuthCookies(backendResponse.headers, response)
    return response
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
