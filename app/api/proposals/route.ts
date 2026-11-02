import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

export async function POST(request: Request) {
  let payload: { NegotiationId?: number; Price?: number; DeliveryDays?: number }
  try {
    payload = await request.json() as typeof payload
  } catch {
    return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
  }

  if (
    !payload ||
    !Number.isInteger(payload.NegotiationId) || !payload.NegotiationId || payload.NegotiationId < 1 ||
    typeof payload.Price !== 'number' || !Number.isFinite(payload.Price) || payload.Price <= 0 ||
    !Number.isInteger(payload.DeliveryDays) || !payload.DeliveryDays || payload.DeliveryDays < 1
  ) {
    return NextResponse.json({ error: 'Informe negociação, preço positivo e prazo em dias positivo.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, '/api/Proposal/CreateProposal', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
