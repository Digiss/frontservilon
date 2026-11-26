import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

export async function POST(request: Request) {
  let payload: { ServiceId?: number; WorkStatusId?: number }
  try {
    payload = await request.json() as typeof payload
  } catch {
    return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
  }

  if (
    !payload ||
    !Number.isInteger(payload.ServiceId) || !payload.ServiceId || payload.ServiceId < 1 ||
    !Number.isInteger(payload.WorkStatusId) || !payload.WorkStatusId || payload.WorkStatusId < 1
  ) {
    return NextResponse.json({ error: 'ServiceId e WorkStatusId devem ser inteiros positivos.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, '/api/Service/UpdateServiceStatus', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
