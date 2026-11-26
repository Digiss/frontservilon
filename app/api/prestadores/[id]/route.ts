import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

type RouteContext = { params: Promise<{ id: string }> }

function field(record: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) return record[key]
  }
  return undefined
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const providerId = Number(id)
  if (!Number.isInteger(providerId) || providerId < 1) {
    return NextResponse.json({ error: 'O identificador do prestador é inválido.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(
      request,
      `/api/FreeLancer/GetFreeLancer/${providerId}`,
      { method: 'GET' },
    )
    if (!response.ok) return servilonBackendResponse(response)

    const body = await response.json() as unknown
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A API retornou um perfil de prestador inválido.' }, { status: 502 })
    }

    const raw = body as Record<string, unknown>
    const idFromResponse = Number(field(raw, 'id', 'Id'))
    const name = field(raw, 'name', 'Name')
    const rating = Number(field(raw, 'reviewScore', 'ReviewScore'))
    const description = field(raw, 'description', 'Description')
    const photoValue = field(raw, 'photoUrl', 'PhotoUrl')
    const serviceTypes = field(raw, 'serviceTypes', 'ServiceTypes')
    const createdAt = field(raw, 'createdAt', 'CreatedAt')
    if (
      idFromResponse !== providerId ||
      typeof name !== 'string' || !name.trim() ||
      !Number.isFinite(rating) ||
      (description !== null && description !== undefined && typeof description !== 'string') ||
      (photoValue !== null && photoValue !== undefined && typeof photoValue !== 'string') ||
      typeof createdAt !== 'string' || !Number.isFinite(Date.parse(createdAt)) ||
      !Array.isArray(serviceTypes)
    ) {
      return NextResponse.json({ error: 'A API retornou um perfil de prestador inválido.' }, { status: 502 })
    }

    const services = serviceTypes.map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const serviceName = field(item as Record<string, unknown>, 'name', 'Name')
      return typeof serviceName === 'string' && serviceName.trim() ? serviceName.trim() : null
    })
    if (services.some(service => service === null)) {
      return NextResponse.json({ error: 'A API retornou tipos de serviço inválidos para o prestador.' }, { status: 502 })
    }

    const photoUrl = typeof photoValue === 'string' ? photoValue : null
    return NextResponse.json({
      id: providerId,
      name: name.trim(),
      role: 'Prestador',
      city: '',
      rating,
      reviews: null,
      photo: photoUrl || '',
      photoUrl,
      bio: typeof description === 'string' && description.trim() ? description.trim() : 'Descrição não informada.',
      createdAt,
      services,
      completed: null,
    })
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
