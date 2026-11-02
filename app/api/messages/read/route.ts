import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

export async function POST(request: Request) {
  let payload: { NegotiationId?: number; UpToMessageId?: number }
  try {
    payload = await request.json() as typeof payload
  } catch {
    return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
  }

  if (
    !payload ||
    !Number.isInteger(payload.NegotiationId) || !payload.NegotiationId || payload.NegotiationId < 1 ||
    !Number.isInteger(payload.UpToMessageId) || !payload.UpToMessageId || payload.UpToMessageId < 1
  ) {
    return NextResponse.json({ error: 'NegotiationId e UpToMessageId devem ser inteiros positivos.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, '/api/Message/MarkMessagesAsRead', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
