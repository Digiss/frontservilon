import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

export async function GET(request: Request) {
  const serviceId = Number(new URL(request.url).searchParams.get('serviceId'))
  if (!Number.isInteger(serviceId) || serviceId < 1) {
    return NextResponse.json({ error: 'serviceId deve ser um inteiro positivo.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, `/api/Review/GetReviews/${serviceId}`, {
      method: 'GET',
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}

export async function POST(request: Request) {
  let payload: { ServiceId?: number; Note?: number; About?: string | null }
  try {
    payload = await request.json() as typeof payload
  } catch {
    return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
  }

  if (
    !payload ||
    !Number.isInteger(payload.ServiceId) || !payload.ServiceId || payload.ServiceId < 1 ||
    !Number.isInteger(payload.Note) || payload.Note === undefined || payload.Note < 1 || payload.Note > 5 ||
    (payload.About !== undefined && payload.About !== null &&
      (typeof payload.About !== 'string' || payload.About.length > 500))
  ) {
    return NextResponse.json({ error: 'Informe ServiceId, nota entre 1 e 5 e comentário de até 500 caracteres.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, '/api/Review/CreateReview', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
