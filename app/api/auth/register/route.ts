import { NextResponse } from 'next/server'
import {
  appUserFromAccessToken,
  authBackendErrorResponse,
  copyAuthCookies,
  requestAuthBackend,
} from '@/lib/auth-backend'
import type { ActiveProfile, CreateClientCommand, CreateFreeLancerCommand } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      profile: ActiveProfile
      payload: CreateClientCommand | CreateFreeLancerCommand
    }
    if (body.profile !== 'Client' && body.profile !== 'FreeLancer') {
      return NextResponse.json({ error: 'Tipo de perfil inválido.' }, { status: 400 })
    }

    const action = body.profile === 'Client' ? 'RegisterClient' : 'RegisterFreeLancer'
    const backendResponse = await requestAuthBackend(request, action, body.payload)
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

    const response = NextResponse.json({ user }, { status: 200 })
    copyAuthCookies(backendResponse.headers, response)
    return response
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
