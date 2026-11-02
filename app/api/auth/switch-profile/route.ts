import { NextResponse } from 'next/server'
import {
  appUserFromAccessToken,
  authBackendErrorResponse,
  copyAuthCookies,
  getSetCookies,
  requestAuthBackend,
} from '@/lib/auth-backend'

export async function POST(request: Request) {
  try {
    const backendResponse = await requestAuthBackend(request, 'SwitchProfile')
    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text()
      const response = new NextResponse(errorBody || null, {
        status: backendResponse.status,
        headers: { 'Content-Type': backendResponse.headers.get('content-type') || 'application/json' },
      })
      copyAuthCookies(backendResponse.headers, response)
      return response
    }

    const accessCookie = getSetCookies(backendResponse.headers)
      .find(cookie => cookie.startsWith('access_token='))
    const accessToken = accessCookie?.slice('access_token='.length).split(';')[0]
    const user = accessToken ? appUserFromAccessToken(accessToken) : null
    if (!user) {
      return NextResponse.json({ error: 'A API não retornou uma sessão válida após a troca de perfil.' }, { status: 502 })
    }

    const response = NextResponse.json({ user })
    copyAuthCookies(backendResponse.headers, response)
    return response
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
