import { NextResponse } from 'next/server'
import { listJobs } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function GET(request: Request) {
  try {
    return NextResponse.json((await listJobs(request)).filter(job => job.status === 'Em análise'))
  } catch (error) {
    return backendErrorResponse(error)
  }
}
