export type Role = 'cliente' | 'prestador'
export type ActiveProfile = 'Client' | 'FreeLancer'
export type Sector = { id: number; name: string }
export type ServiceType = { id: number; name: string; sectorId: number }
export type WorkStatus = { id: number; statusName: string }
export type InterestArea = { id: number; serviceTypeId: number }
export type UserSettings = { theme: 'claro' | 'escuro'; notificationsEnabled: boolean; privateJobs: boolean }

export type CreateClientCommand = {
  UserName: string
  Email: string
  PasswordHash: string
  Name: string
  PhoneNumber: string
  PhotoUrl: string | null
  Description?: string | null
  BirthDate: string
  Address: string | null
}

export type CreateClientSimplifiedCommand = { UserId: number; Address: string | null }
export type CreateFreeLancerCommand = Omit<CreateClientCommand, 'Address'> & { CPF: string }
export type CreateFreeLancerSimplifiedCommand = { UserId: number; CPF: string }
export type CreateUserCommand = Omit<CreateClientCommand, 'Address'>

export type CreatePostCommand = {
  Title: string
  Description: string
  MinimumPrice: number
  MaximumPrice: number
  DeliveryDays: number
  SectorId: number
  ServiceTypeId: number
}

export type UpdatePostCommand = Partial<Omit<CreatePostCommand, 'MinimumPrice' | 'MaximumPrice' | 'SectorId' | 'ServiceTypeId'>> & {
  MinimumPrice?: number
  MaximumPrice?: number
  SectorId?: number
  ServiceTypeId?: number
  WorkStatusId?: number
}

export type LoginCommand = {
  UserName: string | null
  Email: string | null
  Password: string
  Profile: ActiveProfile
}

export type RefreshTokenCommand = { OldRefreshToken: string }
export type SwitchProfileCommand = { UserId: number; RefreshToken: string }

export type AppUser = {
  id: string
  username: string
  name: string
  email: string
  role: Role
  location: string
  bio: string
  skills: string[]
  certifications: string[]
  history: string[]
  availability: string
  serviceFormat: string
  links: { label: string; url: string }[]
  rating: number
  reviews: number
  hasProviderProfile?: boolean
  photoUrl?: string | null
  sector?: string
  subSector?: string
  settings?: UserSettings
}

export type UpdateProfileCommand = Partial<Pick<AppUser, 'location' | 'photoUrl'>>

export type Negotiation = {
  id: number
  postId: number
  clientId: number
  freelancerId: number
  isMessageActive: boolean
  postOwnerProfileId: number
  negotiationStatusId: number
  createdAt: string
}
export type NegotiationProposal = { id: number; price: number; deliveryDate: number }
export type NegotiationMessage = {
  messageId: number
  senderId: number
  isMine: boolean
  content: string | null
  createdAt: string
  readAt: string | null
  proposal: NegotiationProposal | null
}
export type NegotiationMessagesHistory = {
  id: number
  postId: number
  clientId: number
  freelancerId: number
  isMessageActive: boolean
  history: NegotiationMessage[]
}
export type Review = { id: string; jobId: number; providerId: number; providerUserId?: string; clientId: string; clientName?: string; rating: number; comment: string; createdAt: string }

export type Service = {
  id: number
  title: string
  category: string
  description: string
  price: number
  duration: string
  status: 'Fazendo' | 'Em análise' | 'Não iniciado' | 'Em planejamento' | 'Em andamento' | 'Pausado' | 'Concluído' | 'Cancelado' | 'Excluído' | 'Recusado' | 'Status desconhecido'
  provider: string
  rating: number
}

export type ServiceRecord = {
  id: number
  postId: number
  proposalId: number
  price: number
  dateLimit: string
  clientId: number
  freelancerId: number
  sectorId: number
  serviceTypeId: number
  workStatusId: number
  status: string
  startDate: string | null
  endDate: string | null
  title: string
  description: string
}

export type ServiceReview = {
  id: number
  serviceId: number
  note: number
  about: string | null
}

export type Alert = Service & { urgency: 'ALTA' | 'MÉDIA'; postedAt: string; skills: string[] }

export type Job = Alert & {
  invitedProviderId?: number
  invitedProviderName?: string
  subSector: string
  location?: string
  remote: boolean
  negotiable: boolean
  salaryMin: number
  salaryMax: number
  clientName?: string
  clientRating?: number
  clientId?: string
  providerId?: number
  providerUserId?: string
  workStatusId?: number
  sectorId?: number
  serviceTypeId?: number
  providerCompletedAt?: string
  clientConfirmedAt?: string
  reviewPending?: boolean
  reviewId?: string
  attachments?: string[]
  requirements?: string[]
  dueDate?: string
}

export type ChatMessage = { id: string; conversationId: string; sender: string; text: string; attachment?: { name: string; url: string }; createdAt: string; status: 'sent' | 'received' | 'read' | 'pending' }
export type Notification = { id: string; type: 'success' | 'error' | 'info'; title: string; message: string; read: boolean; createdAt: string }
export type Favorite = { userId: string; jobId: number; createdAt: string }
export type JobFilters = { query?: string; category?: string; subSector?: string; sectorId?: number; serviceTypeId?: number; page?: number; pageSize?: number }
export type ProviderProfile = {
  id: number
  userId?: string
  name: string
  role: string
  city: string
  rating: number
  reviews: number | null
  photo: string
  photoUrl?: string | null
  bio: string
  skills?: string[]
  tags?: string[]
  certifications?: string[]
  experience?: string
  createdAt?: string
  services: string[]
  sectors?: string[]
  completed: number | null
  responseTime?: string
  links?: { label: string; url: string }[]
  availability?: string
  serviceFormat?: string
}

export type ProviderDashboardStats = { availableJobs: number; averagePrice: number; averageDeliveryDays: number; activeAssignments: number; providerCount: number }
export type HistoryType = 'concluidos' | 'andamento' | 'avaliacoes' | 'profissionais' | 'criados'
export type HistoryEntry = Job | Review | { provider: string; providerId: number; completedJobs: number }

class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiRequestError('Erro de conexão. Verifique sua conexão com a internet e tente novamente.', 0)
    }
    throw error
  }
  if (!response.ok) {
    let message = `Falha na solicitação (${response.status}).`
    try {
      const body = await response.json() as {
        error?: string
        message?: string
        title?: string
        detail?: string
        errors?: Record<string, string[]>
      }
      const validationMessage = body.errors
        ? Object.values(body.errors).flat().find(value => typeof value === 'string')
        : undefined
      message = body.error || body.message || body.detail || validationMessage || body.title || message
    } catch {
      throw new ApiRequestError(message, response.status)
    }
    throw new ApiRequestError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  const body = await response.text()
  return body ? JSON.parse(body) as T : undefined as T
}

async function requestCollection<T>(path: string): Promise<T[]> {
  try {
    return await request<T[]>(path)
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 501) return []
    throw error
  }
}

function jobsPath(filters: JobFilters | undefined, page: number, pageSize: number): string {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (filters?.query) params.set('search', filters.query)
  if (filters?.sectorId) params.set('sectorId', String(filters.sectorId))
  if (filters?.serviceTypeId) params.set('serviceTypeId', String(filters.serviceTypeId))
  return `/api/jobs?${params.toString()}`
}

function filterJobs(jobs: Job[], filters?: JobFilters): Job[] {
  const query = filters?.query?.toLowerCase() || ''
  return jobs.filter(job =>
    (!query || `${job.title} ${job.description} ${job.subSector} ${job.skills.join(' ')}`.toLowerCase().includes(query)) &&
    (!filters?.category || job.category === filters.category) &&
    (!filters?.subSector || job.subSector === filters.subSector) &&
    (!filters?.sectorId || job.sectorId === filters.sectorId) &&
    (!filters?.serviceTypeId || job.serviceTypeId === filters.serviceTypeId),
  )
}

async function getAllJobs(filters?: JobFilters): Promise<Job[]> {
  const pageSize = 100
  const jobs: Job[] = []
  const seenIds = new Set<number>()

  for (let page = 1; ; page += 1) {
    const batch = await request<Job[]>(jobsPath(filters, page, pageSize))
    if (batch.length === pageSize && batch.every(job => seenIds.has(job.id))) {
      throw new Error('A API repetiu uma página de posts e a busca foi interrompida.')
    }

    for (const job of batch) {
      if (!seenIds.has(job.id)) {
        seenIds.add(job.id)
        jobs.push(job)
      }
    }

    if (batch.length < pageSize) return filterJobs(jobs, filters)
  }
}

function parseWorkStatuses(response: unknown): WorkStatus[] {
  const list = Array.isArray(response)
    ? response
    : response && typeof response === 'object' && 'postId' in response && Array.isArray(response.postId)
      ? response.postId
      : response && typeof response === 'object' && 'workStatusList' in response && Array.isArray(response.workStatusList)
        ? response.workStatusList
        : null
  if (!list) throw new Error('A API retornou uma lista de status inválida.')
  return list.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`O status na posição ${index + 1} tem formato inválido.`)
    }
    const status = item as Record<string, unknown>
    const id = Number(status.id ?? status.Id)
    const statusName = status.statusName ?? status.StatusName
    if (!Number.isInteger(id) || id < 1 || typeof statusName !== 'string' || !statusName.trim()) {
      throw new Error(`O status na posição ${index + 1} tem identificadores inválidos.`)
    }
    return { id, statusName }
  })
}

async function fetchWorkStatuses(): Promise<WorkStatus[]> {
  return parseWorkStatuses(await request<unknown>('/api/work-statuses'))
}

function objectField(source: Record<string, unknown>, camelName: string, pascalName: string): unknown {
  return source[camelName] ?? source[pascalName]
}

function parseNegotiation(item: unknown, index: number): Negotiation {
  if (!item || typeof item !== 'object') {
    throw new Error(`A negociação na posição ${index + 1} tem formato inválido.`)
  }
  const raw = item as Record<string, unknown>
  const id = Number(objectField(raw, 'id', 'Id'))
  const postId = Number(objectField(raw, 'postId', 'PostId'))
  const clientId = Number(objectField(raw, 'clientId', 'ClientId'))
  const freelancerId = Number(objectField(raw, 'freelancerId', 'FreelancerId'))
  const postOwnerProfileId = Number(objectField(raw, 'postOwnerProfileId', 'PostOwnerProfileId'))
  const negotiationStatusId = Number(objectField(raw, 'negotiationStatusId', 'NegotiationStatusId'))
  const isMessageActive = objectField(raw, 'isMessageActive', 'IsMessageActive')
  const createdAt = objectField(raw, 'createdAt', 'CreatedAt')
  if (
    !Number.isInteger(id) || id < 1 ||
    !Number.isInteger(postId) || postId < 1 ||
    !Number.isInteger(clientId) || clientId < 1 ||
    !Number.isInteger(freelancerId) || freelancerId < 1 ||
    !Number.isInteger(postOwnerProfileId) || ![1, 2].includes(postOwnerProfileId) ||
    !Number.isInteger(negotiationStatusId) || negotiationStatusId < 1 ||
    typeof isMessageActive !== 'boolean' ||
    typeof createdAt !== 'string'
  ) {
    throw new Error(`A negociação na posição ${index + 1} tem campos inválidos.`)
  }
  return {
    id,
    postId,
    clientId,
    freelancerId,
    postOwnerProfileId,
    negotiationStatusId,
    isMessageActive,
    createdAt,
  }
}

function parseServiceHistory(response: unknown, statuses: WorkStatus[]): ServiceRecord[] {
  const list = Array.isArray(response)
    ? response
    : response && typeof response === 'object'
      ? objectField(response as Record<string, unknown>, 'serviceList', 'ServiceList')
      : null
  if (!Array.isArray(list)) throw new Error('A API retornou uma lista de serviços inválida.')

  const statusNames = new Map(statuses.map(status => [status.id, status.statusName]))
  return list.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`O serviço na posição ${index + 1} tem formato inválido.`)
    }

    const raw = item as Record<string, unknown>
    const id = Number(objectField(raw, 'id', 'Id'))
    const postId = Number(objectField(raw, 'postId', 'PostId'))
    const proposalId = Number(objectField(raw, 'proposalId', 'ProposalId'))
    const price = Number(objectField(raw, 'price', 'Price'))
    const clientId = Number(objectField(raw, 'clientId', 'ClientId'))
    const freelancerId = Number(objectField(raw, 'freelancerId', 'FreelancerId'))
    const sectorId = Number(objectField(raw, 'sectorId', 'SectorId'))
    const serviceTypeId = Number(objectField(raw, 'serviceTypeId', 'ServiceTypeId'))
    const workStatusId = Number(objectField(raw, 'workStatusId', 'WorkStatusId'))
    const dateLimit = objectField(raw, 'dateLimit', 'DateLimit')
    const startDate = objectField(raw, 'startDate', 'StartDate')
    const endDate = objectField(raw, 'endDate', 'EndDate')
    const postValue = objectField(raw, 'post', 'Post')
    const post = postValue && typeof postValue === 'object' ? postValue as Record<string, unknown> : null

    if (
      !Number.isInteger(id) || id < 1 ||
      !Number.isInteger(postId) || postId < 1 ||
      !Number.isInteger(proposalId) || proposalId < 1 ||
      !Number.isFinite(price) || price <= 0 ||
      !Number.isInteger(clientId) || clientId < 1 ||
      !Number.isInteger(freelancerId) || freelancerId < 1 ||
      !Number.isInteger(sectorId) || sectorId < 1 ||
      !Number.isInteger(serviceTypeId) || serviceTypeId < 1 ||
      !Number.isInteger(workStatusId) || workStatusId < 1 ||
      typeof dateLimit !== 'string'
    ) {
      throw new Error(`O serviço na posição ${index + 1} tem campos inválidos.`)
    }

    const nestedStatus = objectField(raw, 'workStatus', 'WorkStatus')
    const statusName = nestedStatus && typeof nestedStatus === 'object'
      ? objectField(nestedStatus as Record<string, unknown>, 'statusName', 'StatusName')
      : undefined
    const title = post ? objectField(post, 'title', 'Title') : undefined
    const description = post ? objectField(post, 'description', 'Description') : undefined

    return {
      id,
      postId,
      proposalId,
      price,
      dateLimit,
      clientId,
      freelancerId,
      sectorId,
      serviceTypeId,
      workStatusId,
      status: typeof statusName === 'string' ? statusName : statusNames.get(workStatusId) || `Status ${workStatusId}`,
      startDate: typeof startDate === 'string' ? startDate : null,
      endDate: typeof endDate === 'string' ? endDate : null,
      title: typeof title === 'string' && title.trim() ? title : 'Título indisponível',
      description: typeof description === 'string' ? description : '',
    }
  })
}

export function filterPostsWithoutServices(posts: Job[], services: ServiceRecord[]): Job[] {
  const servicePostIds = new Set(services.map(service => service.postId))
  return posts.filter(post => !servicePostIds.has(post.id))
}

function parseNegotiationMessages(response: unknown): NegotiationMessagesHistory {
  if (!response || typeof response !== 'object') {
    throw new Error('A API retornou um histórico de mensagens inválido.')
  }
  const raw = response as Record<string, unknown>
  const id = Number(objectField(raw, 'id', 'Id'))
  const postId = Number(objectField(raw, 'postId', 'PostId'))
  const clientId = Number(objectField(raw, 'clientId', 'ClientId'))
  const freelancerId = Number(objectField(raw, 'freelancerId', 'FreelancerId'))
  const isMessageActive = objectField(raw, 'isMessageActive', 'IsMessageActive')
  const historyValue = objectField(raw, 'history', 'History')
  if (
    !Number.isInteger(id) || id < 1 ||
    !Number.isInteger(postId) || postId < 1 ||
    !Number.isInteger(clientId) || clientId < 1 ||
    !Number.isInteger(freelancerId) || freelancerId < 1 ||
    typeof isMessageActive !== 'boolean' ||
    !Array.isArray(historyValue)
  ) {
    throw new Error('A API retornou um histórico de mensagens com campos inválidos.')
  }
  const history = historyValue.map((item, index): NegotiationMessage => {
    if (!item || typeof item !== 'object') {
      throw new Error(`A mensagem na posição ${index + 1} tem formato inválido.`)
    }
    const message = item as Record<string, unknown>
    const messageId = Number(objectField(message, 'messageId', 'MessageId'))
    const senderId = Number(objectField(message, 'senderId', 'SenderId'))
    const isMine = objectField(message, 'isMine', 'IsMine')
    const content = objectField(message, 'content', 'Content')
    const createdAt = objectField(message, 'createdAt', 'CreatedAt')
    const readAt = objectField(message, 'readAt', 'ReadAt')
    const proposalValue = objectField(message, 'proposal', 'Proposal')
    let proposal: NegotiationProposal | null = null
    if (proposalValue !== null && proposalValue !== undefined) {
      if (typeof proposalValue !== 'object') {
        throw new Error(`A proposta da mensagem ${messageId} tem formato inválido.`)
      }
      const rawProposal = proposalValue as Record<string, unknown>
      const proposalId = Number(objectField(rawProposal, 'id', 'Id'))
      const price = Number(objectField(rawProposal, 'price', 'Price'))
      const deliveryDate = Number(objectField(rawProposal, 'deliveryDate', 'DeliveryDate'))
      if (
        !Number.isInteger(proposalId) || proposalId < 1 ||
        !Number.isFinite(price) || price <= 0 ||
        !Number.isInteger(deliveryDate) || deliveryDate < 1
      ) {
        throw new Error(`A proposta da mensagem ${messageId} tem campos inválidos.`)
      }
      proposal = { id: proposalId, price, deliveryDate }
    }
    if (
      !Number.isInteger(messageId) || messageId < 1 ||
      !Number.isInteger(senderId) || senderId < 1 ||
      typeof isMine !== 'boolean' ||
      (content !== null && typeof content !== 'string') ||
      typeof createdAt !== 'string' ||
      (readAt !== null && readAt !== undefined && typeof readAt !== 'string')
    ) {
      throw new Error(`A mensagem na posição ${index + 1} tem campos inválidos.`)
    }
    return {
      messageId,
      senderId,
      isMine,
      content: typeof content === 'string' ? content : null,
      createdAt,
      readAt: typeof readAt === 'string' ? readAt : null,
      proposal,
    }
  })
  return { id, postId, clientId, freelancerId, isMessageActive, history }
}

export const api = {
  userExists: (identifier: string, profile: ActiveProfile) =>
    request<unknown>('/api/auth/user-exists', { method: 'POST', body: JSON.stringify({ identifier, profile }) }),
  login: (payload: LoginCommand) => request<{ user: AppUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }).then(response => response.user),
  register: (profile: ActiveProfile, payload: CreateClientCommand | CreateFreeLancerCommand) =>
    request<{ user: AppUser }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ profile, payload }) }).then(response => response.user),
  getSession: () => request<{ user: AppUser | null }>('/api/auth/session').then(response => response.user),
  convertClientToProvider: (UserId: number, CPF: string) =>
    request<{ user: AppUser }>('/api/auth/register-simplified-freelancer', { method: 'POST', body: JSON.stringify({ UserId, CPF }) }).then(response => response.user),
  registerSimplifiedFreeLancer: (UserId: number, CPF: string) =>
    request<{ user: AppUser }>('/api/auth/register-simplified-freelancer', { method: 'POST', body: JSON.stringify({ UserId, CPF }) }).then(response => response.user),
  registerSimplifiedClient: (UserId: number, Address: string | null = null) =>
    request<{ user: AppUser }>('/api/auth/register-simplified-client', { method: 'POST', body: JSON.stringify({ UserId, Address }) }).then(response => response.user),
  switchProfile: () =>
    request<{ user: AppUser }>('/api/auth/switch-profile', { method: 'POST' }).then(response => response.user),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getSectors: () => request<Sector[]>('/api/sectors'),
  getServiceTypes: () => request<ServiceType[]>('/api/service-types'),
  getWorkStatuses: fetchWorkStatuses,
  getInterestAreas: async () => {
    const response = await request<unknown>('/api/interest-areas')
    const list = Array.isArray(response)
      ? response
      : response && typeof response === 'object' && 'interestAreaList' in response &&
          Array.isArray(response.interestAreaList)
        ? response.interestAreaList
        : null
    if (!list) throw new Error('A API retornou uma lista de áreas de interesse inválida.')
    return list.map((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`A área de interesse na posição ${index + 1} tem formato inválido.`)
      }
      const area = item as Record<string, unknown>
      const id = Number(area.id ?? area.Id)
      const serviceTypeId = Number(area.serviceTypeId ?? area.ServiceTypeId)
      if (!Number.isInteger(id) || id < 1 || !Number.isInteger(serviceTypeId) || serviceTypeId < 1) {
        throw new Error(`A área de interesse na posição ${index + 1} tem identificadores inválidos.`)
      }
      return { id, serviceTypeId }
    })
  },
  createInterestArea: async (serviceTypeId: number) => {
    const response = await request<{ interestAreaId?: number; InterestAreaId?: number }>('/api/interest-areas', {
      method: 'POST',
      body: JSON.stringify({ ServiceTypeId: serviceTypeId }),
    })
    const id = response.interestAreaId ?? response.InterestAreaId
    if (!Number.isInteger(id) || !id || id < 1) {
      throw new Error('A API não retornou o identificador da área de interesse criada.')
    }
    return { id, serviceTypeId }
  },
  deleteInterestArea: (id: number) =>
    request<void>('/api/interest-areas', { method: 'DELETE', body: JSON.stringify({ InterestAreaId: id }) }),
  getServices: async () => {
    const statuses = await fetchWorkStatuses()
    const pageSize = 100
    const services: ServiceRecord[] = []
    let page = 1

    while (true) {
      const currentPage = parseServiceHistory(
        await request<unknown>(`/api/services?page=${page}&limit=${pageSize}`),
        statuses,
      )
      services.push(...currentPage)
      if (currentPage.length < pageSize) return services
      page += 1
    }
  },
  getServiceHistory: async (serviceId?: number) => {
    const services = await api.getServices()
    return serviceId === undefined ? services : services.filter(service => service.id === serviceId)
  },
  getServiceParticipantNames: (clientId: number, freelancerId: number) => {
    const query = new URLSearchParams({ clientId: String(clientId), freelancerId: String(freelancerId) })
    return request<{ clientName: string; freelancerName: string }>(`/api/service-participants?${query}`)
  },
  getAlerts: () => requestCollection<Alert>('/api/servicos/alertas'),
  getJobs: async (filters?: JobFilters) =>
    filterJobs(await request<Job[]>(jobsPath(filters, filters?.page || 1, filters?.pageSize || 50)), filters),
  getAllJobs,
  getOwnJobs: () => request<Job[]>('/api/jobs?scope=own'),
  getJobFeed: (page = 1, pageSize = 50) =>
    request<Job[]>(`/api/jobs?scope=feed&page=${page}&pageSize=${pageSize}`),
  getFavoriteJobIds: () => requestCollection<number>('/api/favoritos'),
  setFavoriteJob: (jobId: number, favorite: boolean) => request('/api/favoritos', {
    method: favorite ? 'POST' : 'DELETE',
    body: JSON.stringify({ jobId }),
  }),
  getNotifications: (_userId?: string) => request<Notification[]>('/api/notificacoes'),
  markNotificationRead: (id: string) => request<Notification>(`/api/notificacoes/${encodeURIComponent(id)}`, { method: 'PATCH' }),
  createJob: (payload: CreatePostCommand) => request<Job>('/api/jobs', { method: 'POST', body: JSON.stringify(payload) }),
  updatePost: (id: number, payload: UpdatePostCommand) =>
    request<void>(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getJob: (id: number) => request<Job>(`/api/jobs/${id}`),
  getProviders: (sector?: string, subSector?: string) => requestCollection<ProviderProfile>(
    `/api/prestadores${sector ? `?setor=${encodeURIComponent(sector)}${subSector ? `&subsetor=${encodeURIComponent(subSector)}` : ''}` : ''}`,
  ),
  getProvider: (id: number) => request<ProviderProfile>(`/api/prestadores/${id}`),
  getProviderDashboard: async () => {
    try {
      return await request<ProviderDashboardStats>('/api/prestadores/painel')
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 501) return null
      throw error
    }
  },
  getProviderReviews: (id: number) => requestCollection<Pick<Review, 'id' | 'rating' | 'comment' | 'createdAt' | 'clientName'>>(`/api/avaliacoes?prestadorId=${id}`),
  createService: (payload: CreatePostCommand) => request<Service>('/api/servicos', { method: 'POST', body: JSON.stringify(payload) }),
  updateProfile: (payload: UpdateProfileCommand) => request<AppUser>('/api/perfil', { method: 'PATCH', body: JSON.stringify(payload) }),
  updateSettings: async (payload: Partial<UserSettings>): Promise<UserSettings> => {
    const key = 'servilon-preferences'
    const current = JSON.parse(localStorage.getItem(key) || '{}') as Partial<UserSettings>
    const settings: UserSettings = { theme: 'claro', notificationsEnabled: true, privateJobs: false, ...current, ...payload }
    localStorage.setItem(key, JSON.stringify(settings))
    return settings
  },
  acceptService: (id: number) => request<Job>(`/api/servicos/${id}/aceitar`, { method: 'POST' }),
  updateJobStatus: (id: number, _status: Job['status'], workStatusId?: number): Promise<void> => {
    if (!workStatusId) {
      return Promise.reject(new Error('A API exige o WorkStatusId para alterar o status, mas ainda não disponibiliza a lista de status.'))
    }
    return request<void>(`/api/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ WorkStatusId: workStatusId }),
    })
  },
  updateServiceStatus: (serviceId: number, workStatusId: number) =>
    request<void>('/api/services/status', {
      method: 'POST',
      body: JSON.stringify({ ServiceId: serviceId, WorkStatusId: workStatusId }),
    }),
  cancelPost: async (id: number) => {
    const statuses = await fetchWorkStatuses()
    const cancelledStatus = statuses.find(status => status.statusName.trim().toLocaleLowerCase('pt-BR') === 'cancelado')
    if (!cancelledStatus) {
      throw new Error('A API não retornou o status "Cancelado"; o post não foi alterado.')
    }
    await request<void>(`/api/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ WorkStatusId: cancelledStatus.id }),
    })
  },
  deleteJob: (id: number) => request<Job>(`/api/jobs/${id}`, { method: 'DELETE' }),
  getServiceReviews: async (serviceId: number): Promise<ServiceReview[]> => {
    const response = await request<unknown>(`/api/reviews?serviceId=${serviceId}`)
    const list = Array.isArray(response)
      ? response
      : response && typeof response === 'object'
        ? objectField(response as Record<string, unknown>, 'reviews', 'Reviews')
        : null
    if (!Array.isArray(list)) throw new Error('A API retornou uma lista de avaliações inválida.')
    return list.map((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`A avaliação na posição ${index + 1} tem formato inválido.`)
      }
      const raw = item as Record<string, unknown>
      const id = Number(objectField(raw, 'id', 'Id'))
      const reviewServiceId = Number(objectField(raw, 'serviceId', 'ServiceId'))
      const note = Number(objectField(raw, 'reviewNote', 'ReviewNote'))
      const about = objectField(raw, 'about', 'About')
      if (
        !Number.isInteger(id) || id < 1 ||
        reviewServiceId !== serviceId ||
        !Number.isInteger(note) || note < 1 || note > 5 ||
        (about !== null && about !== undefined && typeof about !== 'string')
      ) {
        throw new Error(`A avaliação na posição ${index + 1} tem campos inválidos.`)
      }
      return { id, serviceId: reviewServiceId, note, about: typeof about === 'string' ? about : null }
    })
  },
  submitReview: async (serviceId: number, note: number, about: string) => {
    const response = await request<unknown>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ ServiceId: serviceId, Note: note, About: about.trim() || null }),
    })
    if (!response || typeof response !== 'object') {
      throw new Error('A API não retornou o identificador da avaliação.')
    }
    const reviewId = Number(objectField(response as Record<string, unknown>, 'reviewId', 'ReviewId'))
    if (!Number.isInteger(reviewId) || reviewId < 1) {
      throw new Error('A API não retornou o identificador da avaliação.')
    }
    return reviewId
  },
  getHistory: (type: HistoryType) => type === 'criados'
    ? request<Job[]>('/api/jobs?scope=own')
    : requestCollection<HistoryEntry>(`/api/historico?tipo=${type}`),
  getNegotiations: async () => {
    const response = await request<unknown>('/api/negotiations')
    const list = Array.isArray(response)
      ? response
      : response && typeof response === 'object'
        ? objectField(response as Record<string, unknown>, 'negotiations', 'Negotiations')
        : null
    if (Array.isArray(list)) return list.map(parseNegotiation)
    throw new Error('A API retornou uma lista de negociações inválida.')
  },
  createNegotiation: async (postId: number) => {
    const response = await request<{ negotiationId?: number; NegotiationId?: number }>('/api/negotiations', {
      method: 'POST',
      body: JSON.stringify({ PostId: postId }),
    })
    const negotiationId = response.negotiationId ?? response.NegotiationId
    if (!Number.isInteger(negotiationId) || !negotiationId || negotiationId < 1) {
      throw new Error('A API não retornou o identificador da negociação.')
    }
    return negotiationId
  },
  activateNegotiationMessages: (negotiationId: number) =>
    request<void>(`/api/negotiations/${negotiationId}/active-messages`, { method: 'POST' }),
  getNegotiationMessages: async (negotiationId: number, afterMessageId?: number) => {
    const after = afterMessageId ? `?afterMessageId=${afterMessageId}` : ''
    return parseNegotiationMessages(await request<unknown>(`/api/negotiations/${negotiationId}/messages${after}`))
  },
  sendNegotiationMessage: async (negotiationId: number, content: string) => {
    const response = await request<unknown>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ NegotiationId: negotiationId, Content: content }),
    })
    if (!response || typeof response !== 'object') {
      throw new Error('A API não retornou o identificador da mensagem.')
    }
    const raw = response as Record<string, unknown>
    const messageId = Number(objectField(raw, 'messageId', 'MessageId'))
    if (!Number.isInteger(messageId) || messageId < 1) {
      throw new Error('A API não retornou o identificador da mensagem.')
    }
    return messageId
  },
  createProposal: async (negotiationId: number, price: number, deliveryDays: number) => {
    const response = await request<unknown>('/api/proposals', {
      method: 'POST',
      body: JSON.stringify({ NegotiationId: negotiationId, Price: price, DeliveryDays: deliveryDays }),
    })
    if (!response || typeof response !== 'object') {
      throw new Error('A API não retornou o identificador da proposta.')
    }
    const proposalId = Number(objectField(response as Record<string, unknown>, 'proposalId', 'ProposalId'))
    if (!Number.isInteger(proposalId) || proposalId < 1) {
      throw new Error('A API não retornou o identificador da proposta.')
    }
    return proposalId
  },
  acceptProposal: async (proposalId: number) => {
    const response = await request<unknown>('/api/proposals/accept', {
      method: 'POST',
      body: JSON.stringify({ ProposalId: proposalId }),
    })
    if (!response || typeof response !== 'object') {
      throw new Error('A API não retornou o identificador do serviço criado.')
    }
    const serviceId = Number(objectField(response as Record<string, unknown>, 'serviceId', 'ServiceId'))
    if (!Number.isInteger(serviceId) || serviceId < 1) {
      throw new Error('A API não retornou o identificador do serviço criado.')
    }
    return serviceId
  },
  getUnreadMessages: async () => {
    const response = await request<unknown>('/api/messages/unread')
    if (!response || typeof response !== 'object') {
      throw new Error('A API retornou uma contagem de mensagens não lidas inválida.')
    }
    const raw = objectField(response as Record<string, unknown>, 'unreadMessages', 'UnreadMessages')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('A API retornou uma contagem de mensagens não lidas inválida.')
    }
    const counts: Record<number, number> = {}
    for (const [id, count] of Object.entries(raw)) {
      const negotiationId = Number(id)
      const unreadCount = Number(count)
      if (!Number.isInteger(negotiationId) || negotiationId < 1 || !Number.isInteger(unreadCount) || unreadCount < 0) {
        throw new Error('A API retornou uma contagem de mensagens não lidas inválida.')
      }
      counts[negotiationId] = unreadCount
    }
    return counts
  },
  markNegotiationMessagesRead: (negotiationId: number, upToMessageId: number) =>
    request<unknown>('/api/messages/read', {
      method: 'POST',
      body: JSON.stringify({ NegotiationId: negotiationId, UpToMessageId: upToMessageId }),
    }),
  applyToJob: async (payload: { jobId: number; message: string }) => {
    const negotiations = await api.getNegotiations()
    const existing = negotiations.find(item => item.postId === payload.jobId)
    const negotiationId = existing?.id ?? await api.createNegotiation(payload.jobId)
    if (payload.message.trim()) {
      const history = await api.getNegotiationMessages(negotiationId)
      if (!history.history.length) {
        await api.sendNegotiationMessage(negotiationId, payload.message.trim())
      }
    }
    return negotiationId
  },
}
