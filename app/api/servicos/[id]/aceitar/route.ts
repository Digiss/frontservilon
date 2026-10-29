import { NextResponse } from 'next/server'
import { updateJobStatus } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return NextResponse.json(await updateJobStatus(request, Number(id), 'Em andamento'))
  } catch (error) {
    return backendErrorResponse(error)
  }
}
