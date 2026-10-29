import { NextResponse } from 'next/server'
import { getProvider } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return NextResponse.json(await getProvider(Number(id)))
  } catch (error) {
    return backendErrorResponse(error)
  }
}
