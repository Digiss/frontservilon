import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

export async function POST(request: Request) {
  let payload: { NegotiationId?: number; Content?: string }
  try {
    payload = await request.json() as typeof payload
  } catch {
    return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
  }

  if (
    !payload ||
    !Number.isInteger(payload.NegotiationId) || !payload.NegotiationId || payload.NegotiationId < 1 ||
    typeof payload.Content !== 'string' || !payload.Content.trim() || payload.Content.length > 1000
  ) {
    return NextResponse.json({ error: 'Informe uma negociação e uma mensagem de até 1000 caracteres.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, '/api/Message/CreateMessage', {
      method: 'POST',
      body: JSON.stringify({ NegotiationId: payload.NegotiationId, Content: payload.Content.trim() }),
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
