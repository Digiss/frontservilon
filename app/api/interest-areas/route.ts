import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

export async function GET(request: Request) {
  try {
    const response = await requestServilonBackend(
      request,
      '/api/InterestArea/GetInterestAreasByFreeLancerId',
      { method: 'GET' },
    )
    if (!response.ok) return servilonBackendResponse(response)
    const body: unknown = await response.json()
    if (Array.isArray(body)) return NextResponse.json(body)
    if (body && typeof body === 'object' &&
      'interestAreaList' in body && Array.isArray(body.interestAreaList)) {
      return NextResponse.json(body.interestAreaList)
    }
    if (body && typeof body === 'object' &&
      'InterestAreaList' in body && Array.isArray(body.InterestAreaList)) {
      return NextResponse.json(body.InterestAreaList)
    }
    return NextResponse.json({ error: 'A API retornou uma lista de áreas de interesse inválida.' }, { status: 502 })
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
  }
  if (!body || typeof body !== 'object' ||
    !('ServiceTypeId' in body) ||
    !Number.isInteger(body.ServiceTypeId) ||
    Number(body.ServiceTypeId) < 1) {
    return NextResponse.json({ error: 'ServiceTypeId deve ser um inteiro positivo.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, '/api/InterestArea/CreateInterestArea', {
      method: 'POST',
      body: JSON.stringify({ ServiceTypeId: body.ServiceTypeId }),
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}

export async function DELETE(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
  }
  if (!body || typeof body !== 'object' ||
    !('InterestAreaId' in body) ||
    !Number.isInteger(body.InterestAreaId) ||
    Number(body.InterestAreaId) < 1) {
    return NextResponse.json({ error: 'InterestAreaId deve ser um inteiro positivo.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, '/api/InterestArea/DeleteInterestArea', {
      method: 'POST',
      body: JSON.stringify({ InterestAreaId: body.InterestAreaId }),
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}