import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'
import { extractServiceTypes } from '@/lib/taxonomy-mapper'

export async function GET(request: Request) {
  try {
    const response = await requestServilonBackend(request, '/api/ServiceType/GetServiceType', { method: 'GET' })
    if (!response.ok) return servilonBackendResponse(response)
    return NextResponse.json(extractServiceTypes(await response.json()))
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
