export type CatalogSector = { id: number; name: string }
export type CatalogServiceType = { id: number; name: string; sectorId: number }
export type CatalogWorkStatus = { id: number; name: string }

function extractList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body
  if (body && typeof body === 'object') {
    const wrapped = body as Record<string, unknown>
    if (Array.isArray(wrapped.postId)) return wrapped.postId
  }
  throw new Error('A API retornou um catálogo em formato inesperado.')
}

function readPositiveInteger(value: unknown, field: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`A API retornou um valor inválido no campo ${field}.`)
  }
  return parsed
}

function readName(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`A API retornou um valor inválido no campo ${field}.`)
  }
  return value.trim()
}

export function extractSectors(body: unknown): CatalogSector[] {
  return extractList(body).map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`O setor na posição ${index + 1} tem formato inválido.`)
    }
    const sector = item as Record<string, unknown>
    return {
      id: readPositiveInteger(sector.id ?? sector.Id, 'Id'),
      name: readName(sector.sectorName ?? sector.SectorName, 'SectorName'),
    }
  })
}

export function extractServiceTypes(body: unknown): CatalogServiceType[] {
  return extractList(body).map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`O tipo de serviço na posição ${index + 1} tem formato inválido.`)
    }
    const serviceType = item as Record<string, unknown>
    return {
      id: readPositiveInteger(serviceType.id ?? serviceType.Id, 'Id'),
      name: readName(serviceType.typeName ?? serviceType.TypeName, 'TypeName'),
      sectorId: readPositiveInteger(serviceType.sectorId ?? serviceType.SectorId, 'SectorId'),
    }
  })
}

export function extractWorkStatuses(body: unknown): CatalogWorkStatus[] {
  return extractList(body).map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`O status na posição ${index + 1} tem formato inválido.`)
    }
    const workStatus = item as Record<string, unknown>
    return {
      id: readPositiveInteger(workStatus.id ?? workStatus.Id, 'Id'),
      name: readName(workStatus.statusName ?? workStatus.StatusName, 'StatusName'),
    }
  })
}
