import { NextResponse } from 'next/server'
import type { AppUser } from './api'

const backendUrl = process.env.SERVILON_BACKEND_URL || 'http://localhost:5003'

export async function requestServilonBackend(
  request: Request,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers({ Accept: 'application/json' })
  const cookie = request.headers.get('cookie')
  if (cookie) headers.set('Cookie', cookie)

  if (init.body !== undefined && init.body !== null) {
    headers.set('Content-Type', 'application/json')
  }
  new Headers(init.headers).forEach((value, key) => headers.set(key, value))

  try {
    return await fetch(new URL(path, backendUrl), {
      ...init,
      headers,
      cache: 'no-store',
    })
  } catch (error) {
    console.error(`Não foi possível acessar a rota ${path} da API Servilon.`, error)
    throw new Error('Não foi possível conectar à API Servilon. Confira SERVILON_BACKEND_URL e reinicie o Next.js após alterar a configuração.')
  }
}

export function requestAuthBackend(request: Request, action: string, body?: unknown): Promise<Response> {
  return requestServilonBackend(request, `/api/Auth/${action}`, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function appUserFromAccessToken(accessToken: string): AppUser | null {
  try {
    const payloadPart = accessToken.split('.')[1]
    if (!payloadPart) return null

    const claims = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as {
      sub?: string | number
      name?: string
      email?: string
      ActiveProfile?: string
      exp?: number
    }
    const id = claims.sub === undefined ? '' : String(claims.sub)
    if (!id || !claims.ActiveProfile || !['Client', 'FreeLancer'].includes(claims.ActiveProfile)) return null

    const role = claims.ActiveProfile === 'FreeLancer' ? 'prestador' : 'cliente'
    const username = claims.name || ''

    return {
      id,
      username,
      name: username,
      email: claims.email || '',
      role,
      location: '',
      bio: '',
      skills: [],
      certifications: [],
      history: [],
      availability: '',
      serviceFormat: '',
      links: [],
      rating: 0,
      reviews: 0,
      hasProviderProfile: role === 'prestador',
    }
  } catch {
    return null
  }
}

export function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('cookie')
  if (!cookie) return null

  const prefix = `${name}=`
  const entry = cookie.split(';').map(value => value.trim()).find(value => value.startsWith(prefix))
  return entry ? entry.slice(prefix.length) : null
}

export function getSetCookies(headers: Headers): string[] {
  return headers.getSetCookie()
}

export function copyAuthCookies(source: Headers, destination: NextResponse): void {
  for (const cookie of getSetCookies(source)) {
    destination.headers.append('Set-Cookie', cookie)
  }
}

export async function passThroughAuthResponse(response: Response): Promise<NextResponse> {
  const body = await response.text()
  const headers = new Headers()
  const contentType = response.headers.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)

  const proxied = new NextResponse(body || null, { status: response.status, headers })
  copyAuthCookies(response.headers, proxied)
  return proxied
}

export function authBackendErrorResponse(error: unknown): NextResponse {
  console.error('Erro no fluxo de autenticação do backend.', error)
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Não foi possível concluir a autenticação.' },
    { status: 502 },
  )
}

export async function servilonBackendResponse(response: Response): Promise<NextResponse> {
  const body = await response.text()
  const headers = new Headers()
  const contentType = response.headers.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)

  const proxied = new NextResponse(body || null, { status: response.status, headers })
  copyAuthCookies(response.headers, proxied)
  return proxied
}

export function unavailableBackendEndpoint(path: string): NextResponse {
  return NextResponse.json(
    { error: `A API oficial ainda não implementa o endpoint ${path}.` },
    { status: 501 },
  )
}
