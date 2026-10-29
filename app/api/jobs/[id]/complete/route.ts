import { NextResponse } from 'next/server'
import { confirmJobCompletion } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return NextResponse.json(await confirmJobCompletion(request, Number(id)))
  } catch (error) {
    return backendErrorResponse(error)
  }
}
