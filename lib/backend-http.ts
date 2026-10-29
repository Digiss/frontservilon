import { NextResponse } from 'next/server'
import { BackendError } from './backend'

export function backendErrorResponse(error: unknown): NextResponse {
  if (error instanceof BackendError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error('Erro inesperado no backend fictício:', error)
  return NextResponse.json({ error: 'Erro interno no backend fictício.' }, { status: 500 })
}
