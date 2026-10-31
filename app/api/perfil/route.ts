import { NextResponse } from 'next/server'
import {
  appUserFromAccessToken,
  authBackendErrorResponse,
  getCookie,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

export async function GET(request: Request) {
  const token = getCookie(request, 'access_token')
  const user = token ? appUserFromAccessToken(token) : null
  return user
    ? NextResponse.json({ user })
    : NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 401 })
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json() as {
      location?: string
      photoUrl?: string | null
      bio?: string
      skills?: string[]
      sector?: string
      subSector?: string
      availability?: string
      serviceFormat?: string
      links?: { label: string; url: string }[]
    }
    const token = getCookie(request, 'access_token')
    const user = token ? appUserFromAccessToken(token) : null
    if (!user) return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 401 })

    const unsupportedFields = [
      payload.bio,
      payload.sector,
      payload.subSector,
      payload.availability,
      payload.serviceFormat,
      ...(payload.skills || []),
      ...(payload.links || []).flatMap(link => [link.label, link.url]),
    ]
    if (user.role === 'prestador') unsupportedFields.push(payload.location)
    if (unsupportedFields.some(value => typeof value === 'string' && value.trim())) {
      return NextResponse.json(
        { error: 'A API oficial ainda não oferece atualização de descrição, habilidades, setor, disponibilidade ou links.' },
        { status: 501 },
      )
    }

    const updatePayload = user.role === 'cliente'
      ? {
        Name: '',
        PhoneNumber: '',
        Password: '',
        Address: payload.location || '',
        PhotoUrl: payload.photoUrl || '',
      }
      : {
        Name: '',
        PhoneNumber: '',
        Password: '',
        PhotoUrl: payload.photoUrl || '',
        ReceivePosts: true,
      }
    const action = user.role === 'cliente' ? 'UpdateClient' : 'UpdateFreeLancer'
    const backendResponse = await requestServilonBackend(request, `/api/Auth/${action}`, {
      method: 'POST',
      body: JSON.stringify(updatePayload),
    })
    if (!backendResponse.ok) return servilonBackendResponse(backendResponse)

    return NextResponse.json({
      ...user,
      location: payload.location || user.location,
      photoUrl: payload.photoUrl ?? user.photoUrl,
    })
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
