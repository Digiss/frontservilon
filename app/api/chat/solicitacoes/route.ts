import { NextResponse } from 'next/server'
import { listContactRequests, requestContact } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'
import type { ContactRequest } from '@/lib/api'

export async function POST(request: Request) {
  try {
    return NextResponse.json(await requestContact(request, await request.json() as ContactRequest), { status: 201 })
  } catch (error) {
    return backendErrorResponse(error)
  }
}

export async function GET(request: Request) {
  try {
    return NextResponse.json(await listContactRequests(request))
  } catch (error) {
    return backendErrorResponse(error)
  }
}
