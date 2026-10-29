import { NextResponse } from 'next/server'
import { getProviders } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams
    return NextResponse.json(await getProviders(params.get('setor') || undefined, params.get('subsetor') || undefined))
  } catch (error) {
    return backendErrorResponse(error)
  }
}
