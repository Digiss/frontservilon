import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestAuthBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

export async function POST(request: Request) {
  let body: { identifier?: string; profile?: 'Client' | 'FreeLancer' }
  try {
    body = await request.json() as typeof body
  } catch {
    return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
  }

  const identifier = body?.identifier?.trim()
  if (!identifier) {
    return NextResponse.json({ error: 'Informe seu e-mail ou nome de usuário.' }, { status: 400 })
  }
  if (body.profile !== 'Client' && body.profile !== 'FreeLancer') {
    return NextResponse.json({ error: 'Perfil inválido.' }, { status: 400 })
  }

  try {
    const backendResponse = await requestAuthBackend(request, 'UserExists', {
      Email: identifier.includes('@') ? identifier : '',
      UserName: identifier.includes('@') ? '' : identifier,
      ActiveProfile: body.profile === 'FreeLancer' ? 2 : 1,
    })
    return servilonBackendResponse(backendResponse)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
