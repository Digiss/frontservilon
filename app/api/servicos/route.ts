import { NextResponse } from 'next/server'
import { createService, getServices } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'
import type { CreatePostCommand } from '@/lib/api'

export async function GET(request: Request) {
  try {
    return NextResponse.json(await getServices(request))
  } catch (error) {
    return backendErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    return NextResponse.json(await createService(request, await request.json() as CreatePostCommand), { status: 201 })
  } catch (error) {
    return backendErrorResponse(error)
  }
}
