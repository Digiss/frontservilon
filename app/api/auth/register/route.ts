import { NextResponse } from 'next/server'
import { getSessionCookie, register } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'
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
    const user = await register(body.payload, body.profile)
    const response = NextResponse.json({ user }, { status: 201 })
    response.headers.append('Set-Cookie', getSessionCookie(user.id))
    return response
  } catch (error) {
    return backendErrorResponse(error)
  }
}
