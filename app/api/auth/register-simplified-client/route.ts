import { NextResponse } from 'next/server'
import {
  appUserFromAccessToken,
  authBackendErrorResponse,
  copyAuthCookies,
  requestAuthBackend,
} from '@/lib/auth-backend'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { UserId: number; Address?: string | null }
    if (!Number.isInteger(body.UserId) || body.UserId <= 0) {
      return NextResponse.json({ error: 'Identificador de usuário inválido.' }, { status: 400 })
    }

    const backendResponse = await requestAuthBackend(request, 'RegisterSimplifiedClient', {
      UserId: body.UserId,
      Address: body.Address || null,
    })
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
