import { NextResponse } from 'next/server'
import { createApplication, listApplications } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'
import type { Application } from '@/lib/api'

export async function GET(request: Request) {
  try {
    return NextResponse.json(await listApplications(request))
  } catch (error) {
    return backendErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    return NextResponse.json(await createApplication(request, await request.json() as Omit<Application, 'id' | 'createdAt' | 'status'>), { status: 201 })
  } catch (error) {
    return backendErrorResponse(error)
  }
}
