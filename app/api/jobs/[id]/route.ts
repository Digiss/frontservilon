import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
  unavailableBackendEndpoint,
} from '@/lib/auth-backend'

type RouteContext = { params: Promise<{ id: string }> }
type UpdatePostPayload = {
  Title?: string
  Description?: string
  MinimumPrice?: number
  MaximumPrice?: number
  DeliveryDays?: number
  SectorId?: number
  ServiceTypeId?: number
  WorkStatusId?: number
}

export async function GET() {
  return unavailableBackendEndpoint('/api/Post/GetPostById')
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const postId = Number(id)
  if (!Number.isInteger(postId) || postId < 1) {
    return NextResponse.json({ error: 'O identificador do post é inválido.' }, { status: 400 })
  }

  let payload: UpdatePostPayload
  try {
    payload = await request.json() as UpdatePostPayload
  } catch {
    return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
  }

  if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Informe ao menos um campo para atualizar.' }, { status: 400 })
  }
  if (payload.WorkStatusId !== undefined &&
    (!Number.isInteger(payload.WorkStatusId) || payload.WorkStatusId < 1)) {
    return NextResponse.json({ error: 'WorkStatusId deve ser um inteiro positivo.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, '/api/Post/UpdatePost', {
      method: 'POST',
      body: JSON.stringify({ ...payload, PostId: postId }),
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}

export async function DELETE() {
  return unavailableBackendEndpoint('/api/Post/DeletePost')
}
