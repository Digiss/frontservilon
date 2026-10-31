import { NextResponse } from 'next/server'
import {
  appUserFromAccessToken,
  authBackendErrorResponse,
  copyAuthCookies,
  getCookie,
  getSetCookies,
  requestAuthBackend,
} from '@/lib/auth-backend'

export async function GET(request: Request) {
  try {
    const accessToken = getCookie(request, 'access_token')
    const user = accessToken ? appUserFromAccessToken(accessToken) : null
    if (user && accessToken) {
      const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8')) as { exp?: number }
      if (typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000)) {
        return NextResponse.json({ user })
      }
    }

    if (!accessToken && !getCookie(request, 'refresh_token')) {
      return NextResponse.json({ user: null })
    }

    const backendResponse = await requestAuthBackend(request, 'Refresh')
    if (backendResponse.status === 401) {
      const response = NextResponse.json({ user: null })
      response.headers.append('Set-Cookie', 'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict')
      response.headers.append('Set-Cookie', 'refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict')
      return response
    }
    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text()
      const response = new NextResponse(errorBody || null, {
        status: backendResponse.status,
        headers: { 'Content-Type': backendResponse.headers.get('content-type') || 'application/json' },
      })
      copyAuthCookies(backendResponse.headers, response)
      return response
    }

    const refreshedCookie = getSetCookies(backendResponse.headers)
      .find(cookie => cookie.startsWith('access_token='))
    const refreshedToken = refreshedCookie?.slice('access_token='.length).split(';')[0]
    const refreshedUser = refreshedToken ? appUserFromAccessToken(refreshedToken) : null
    if (!refreshedUser) {
      return NextResponse.json({ error: 'A API não retornou um token renovado válido.' }, { status: 502 })
    }

    const response = NextResponse.json({ user: refreshedUser })
    copyAuthCookies(backendResponse.headers, response)
    return response
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
