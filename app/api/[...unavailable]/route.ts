import { unavailableBackendEndpoint } from '@/lib/auth-backend'

type RouteContext = { params: Promise<{ unavailable: string[] }> }

async function unavailable(_request: Request, context: RouteContext) {
  const { unavailable: segments } = await context.params
  return unavailableBackendEndpoint(`/api/${segments.join('/')}`)
}

export const GET = unavailable
export const POST = unavailable
export const PUT = unavailable
export const PATCH = unavailable
export const DELETE = unavailable
