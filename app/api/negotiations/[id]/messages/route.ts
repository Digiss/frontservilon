import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const negotiationId = Number(id)
  if (!Number.isInteger(negotiationId) || negotiationId < 1) {
    return NextResponse.json({ error: 'O identificador da negociação é inválido.' }, { status: 400 })
  }

  const url = new URL(request.url)
  const afterMessageId = url.searchParams.get('afterMessageId')
  if (afterMessageId !== null && (!/^\d+$/.test(afterMessageId) || Number(afterMessageId) < 1)) {
    return NextResponse.json({ error: 'afterMessageId deve ser um inteiro positivo.' }, { status: 400 })
  }

  try {
    const query = afterMessageId ? `?afterMessageId=${afterMessageId}` : ''
    const response = await requestServilonBackend(
      request,
      `/api/Message/GetMessagesHistory/${negotiationId}${query}`,
      { method: 'GET' },
    )
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
