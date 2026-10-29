import { NextResponse } from 'next/server'
import { updateJobStatus } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'
import type { Job } from '@/lib/api'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await request.json() as { status: Job['status'] }
    return NextResponse.json(await updateJobStatus(request, Number(id), status))
  } catch (error) {
    return backendErrorResponse(error)
  }
}
