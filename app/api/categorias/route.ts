import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function GET() {
  try {
    return NextResponse.json(await getCategories())
  } catch (error) {
    return backendErrorResponse(error)
  }
}
