import type { Job } from './api'

type BackendPost = {
  id: number
  title?: string
  description?: string
  price?: number
  minimumPrice?: number
  maximumPrice?: number
  workStatusId?: number
  deliveryDays?: number | string
  clientId?: number | null
  freelancerId?: number | null
  sectorId?: number
  serviceTypeId?: number
  workStatus?: { statusName?: string }
  sector?: { sectorName?: string }
  serviceType?: { typeName?: string }
  createdAt?: string
}

export type TaxonomyLookups = {
  sectors: Map<number, string>
  serviceTypes: Map<number, string>
  workStatuses: Map<number, string>
}

export function toAppJob(post: BackendPost, lookups?: TaxonomyLookups): Job {
  const minimumPrice = Number(post.minimumPrice ?? post.price) || 0
  const maximumPrice = Number(post.maximumPrice ?? post.price ?? minimumPrice) || 0
  const statuses: Job['status'][] = [
    'Fazendo',
    'Em análise',
    'Não iniciado',
    'Em planejamento',
    'Em andamento',
    'Pausado',
    'Concluído',
    'Cancelado',
    'Excluído',
    'Recusado',
  ]
  // A API às vezes não devolve os objetos aninhados (sector/serviceType/workStatus);
  // nesse caso os IDs crus continuam vindo certos, então caímos no catálogo pra achar o nome.
  const sectorName = post.sector?.sectorName
    || (post.sectorId !== undefined ? lookups?.sectors.get(post.sectorId) : undefined)
    || ''
  const serviceTypeName = post.serviceType?.typeName
    || (post.serviceTypeId !== undefined ? lookups?.serviceTypes.get(post.serviceTypeId) : undefined)
    || ''
  const workStatusName = post.workStatus?.statusName
    || (post.workStatusId !== undefined ? lookups?.workStatuses.get(post.workStatusId) : undefined)
  const status = statuses.find(value => value === workStatusName) || 'Não iniciado'
  const title = post.title || ''
  const date = post.createdAt || ''

  return {
    id: post.id,
    title,
    category: sectorName,
    description: post.description || '',
    price: minimumPrice,
    duration: formatDeliveryDays(post.deliveryDays),
    dueDate: formatDeliveryDays(post.deliveryDays),
    status,
    workStatusId: post.workStatusId,
    provider: '',
    rating: 0,
    urgency: 'MÉDIA',
    postedAt: date,
    skills: [],
    subSector: serviceTypeName,
    remote: false,
    negotiable: false,
    salaryMin: minimumPrice,
    salaryMax: maximumPrice,
    clientId: post.clientId === undefined || post.clientId === null ? undefined : String(post.clientId),
    providerId: post.freelancerId || undefined,
    sectorId: post.sectorId,
    serviceTypeId: post.serviceTypeId,
  }
}

export function formatDeliveryDays(days: number | string | undefined | null) {
  const value = Number(days)
  if (!Number.isInteger(value) || value < 1) return ''
  return value === 1 ? '1 dia' : `${value} dias`
}

export function formatPostPriceRange(minimum: number, maximum: number) {
  const formattedMinimum = minimum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (minimum === maximum) return `R$ ${formattedMinimum}`
  const formattedMaximum = maximum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `R$ ${formattedMinimum}–${formattedMaximum}`
}

export function extractPosts(body: unknown): BackendPost[] {
  const list = Array.isArray(body)
    ? body
    : body && typeof body === 'object' && 'postList' in body && Array.isArray(body.postList)
      ? body.postList
      : null
  if (!list) throw new Error('A API retornou uma resposta de posts em formato inesperado.')

  return list.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`O post na posição ${index + 1} tem formato inválido.`)
    }

    const wrapper = item as Record<string, unknown>
    const post = wrapper.post ?? wrapper.Post ?? wrapper
    if (!post || typeof post !== 'object' || Array.isArray(post)) {
      throw new Error(`O post na posição ${index + 1} tem formato inválido.`)
    }

    const rawPost = post as Record<string, unknown>
    const id = Number(rawPost.id ?? rawPost.Id)
    if (!Number.isInteger(id) || id < 1) {
      throw new Error(`O post na posição ${index + 1} não tem um identificador válido.`)
    }

    return { ...rawPost, id } as BackendPost
  })
}
