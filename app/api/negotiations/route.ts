import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

export async function GET(request: Request) {
  try {
    const response = await requestServilonBackend(request, '/api/Negotiation/GetNegotiation', {
      method: 'GET',
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}

export async function POST(request: Request) {
  let payload: { PostId?: number }
  try {
    payload = await request.json() as typeof payload
  } catch {
    return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
  }

  if (!payload || !Number.isInteger(payload.PostId) || !payload.PostId || payload.PostId < 1) {
    return NextResponse.json({ error: 'PostId deve ser um inteiro positivo.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, '/api/Negotiation/CreateNegotiation', {
      method: 'POST',
      body: JSON.stringify({ PostId: payload.PostId }),
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
