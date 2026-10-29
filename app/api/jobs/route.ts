import { NextResponse } from 'next/server'
import { createJob, listJobs } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'
import type { CreatePostCommand } from '@/lib/api'

export async function GET(request: Request) {
  try {
    return NextResponse.json(await listJobs(request))
  } catch (error) {
    return backendErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const job = await createJob(request, await request.json() as CreatePostCommand)
    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    return backendErrorResponse(error)
  }
}
