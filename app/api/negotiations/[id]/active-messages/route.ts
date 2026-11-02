import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const negotiationId = Number(id)
  if (!Number.isInteger(negotiationId) || negotiationId < 1) {
    return NextResponse.json({ error: 'O identificador da negociação é inválido.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, '/api/Negotiation/ActiveMessages', {
      method: 'POST',
      body: JSON.stringify({ NegotiationId: negotiationId }),
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
