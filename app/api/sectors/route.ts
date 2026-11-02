import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'
import { extractSectors } from '@/lib/taxonomy-mapper'

export async function GET(request: Request) {
  try {
    const response = await requestServilonBackend(request, '/api/Sector/GetSector', { method: 'GET' })
    if (!response.ok) return servilonBackendResponse(response)
    return NextResponse.json(extractSectors(await response.json()))
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
