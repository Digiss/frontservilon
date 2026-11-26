import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

function extractName(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const profile = value as Record<string, unknown>
  const name = profile.name ?? profile.Name
  return typeof name === 'string' && name.trim() ? name.trim() : null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const clientId = Number(url.searchParams.get('clientId'))
  const freelancerId = Number(url.searchParams.get('freelancerId'))

  if (!Number.isInteger(clientId) || clientId < 1 || !Number.isInteger(freelancerId) || freelancerId < 1) {
    return NextResponse.json({ error: 'clientId e freelancerId devem ser inteiros positivos.' }, { status: 400 })
  }

  try {
    const [clientResponse, freelancerResponse] = await Promise.all([
      requestServilonBackend(request, `/api/Client/GetClient/${clientId}`, { method: 'GET' }),
      requestServilonBackend(request, `/api/FreeLancer/GetFreeLancer/${freelancerId}`, { method: 'GET' }),
    ])

    if (!clientResponse.ok) return servilonBackendResponse(clientResponse)
    if (!freelancerResponse.ok) return servilonBackendResponse(freelancerResponse)

    const [client, freelancer] = await Promise.all([
      clientResponse.json() as Promise<unknown>,
      freelancerResponse.json() as Promise<unknown>,
    ])
    const clientName = extractName(client)
    const freelancerName = extractName(freelancer)

    if (!clientName || !freelancerName) {
      return NextResponse.json({ error: 'A API não retornou o nome dos participantes do serviço.' }, { status: 502 })
    }

    return NextResponse.json({ clientName, freelancerName })
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
