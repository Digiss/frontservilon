import { NextResponse } from 'next/server'
import {
  appUserFromAccessToken,
  authBackendErrorResponse,
  copyAuthCookies,
  requestAuthBackend,
} from '@/lib/auth-backend'
import { isAtLeastEighteen, normalizeBrazilianPhoneNumber } from '@/lib/auth-validation'
import type { ActiveProfile, CreateClientCommand, CreateFreeLancerCommand } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      profile?: unknown
      payload?: unknown
    } | null
    if (!body || !body.payload || typeof body.payload !== 'object') {
      return NextResponse.json({ error: 'Informe os dados para criar a conta.' }, { status: 400 })
    }
    if (body.profile !== 'Client' && body.profile !== 'FreeLancer') {
      return NextResponse.json({ error: 'Tipo de perfil inválido.' }, { status: 400 })
    }
    const payload = body.payload as Partial<CreateClientCommand | CreateFreeLancerCommand>
    if (typeof payload.BirthDate !== 'string' || typeof payload.PhoneNumber !== 'string') {
      return NextResponse.json({ error: 'Data de nascimento ou telefone inválido.' }, { status: 400 })
    }
    if (!isAtLeastEighteen(payload.BirthDate)) {
      return NextResponse.json({ error: 'Somente pessoas com 18 anos ou mais podem se cadastrar.' }, { status: 400 })
    }
    const phoneNumber = normalizeBrazilianPhoneNumber(payload.PhoneNumber)
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Informe um telefone com DDD e 10 ou 11 dígitos.' }, { status: 400 })
    }

    const action = body.profile === 'Client' ? 'RegisterClient' : 'RegisterFreeLancer'
    const backendResponse = await requestAuthBackend(request, action, {
      ...payload,
      PhoneNumber: phoneNumber,
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

    const response = NextResponse.json({ user }, { status: 200 })
    copyAuthCookies(backendResponse.headers, response)
    return response
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
