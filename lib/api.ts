export type Role = 'cliente' | 'prestador'
export type ActiveProfile = 'Client' | 'FreeLancer'
export type UserSettings = { theme: 'claro' | 'escuro'; notificationsEnabled: boolean; privateJobs: boolean }

export type CreateClientCommand = {
  UserName: string
  Email: string
  PasswordHash: string
  Name: string
  PhoneNumber: string
  PhotoUrl: string | null
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
  Price: number
  DeliveryDays: string
  DeliveryHours: string
  SectorId: number
  ServiceTypeId: number
}

export type UpdatePostCommand = Partial<Omit<CreatePostCommand, 'Price' | 'SectorId' | 'ServiceTypeId'>> & {
  Price?: number
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

export type UpdateProfileCommand = Partial<Pick<AppUser, 'location' | 'bio' | 'skills' | 'availability' | 'serviceFormat' | 'links' | 'photoUrl' | 'sector' | 'subSector'>>

export type Application = { id: string; jobId: number; applicantId: string; clientId: string; message: string; status: 'pending' | 'accepted' | 'declined'; createdAt: string; jobTitle?: string; applicantName?: string }
export type ServiceInvitation = { id: string; jobId: number; clientId: string; providerUserId: string; providerId: number; status: 'pending' | 'accepted' | 'declined'; createdAt: string; jobTitle: string; clientName: string; providerName: string }
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
  deliveryHours?: string
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
export type ContactRequest = { jobId: number; providerName: string; clientName: string; message: string }
export type Notification = { id: string; type: 'success' | 'error' | 'info'; title: string; message: string; read: boolean; createdAt: string }
export type Favorite = { userId: string; jobId: number; createdAt: string }
export type JobFilters = { query?: string; category?: string; subSector?: string; sectorId?: number; serviceTypeId?: number; page?: number; pageSize?: number }
export type Category = { id: number; name: string; count: number; icon: string; serviceTypes: string[] }

export type ProviderProfile = {
  id: number
  userId?: string
  name: string
  role: string
  city: string
  rating: number
  reviews: number
  photo: string
  photoUrl?: string | null
  bio: string
  skills: string[]
  tags?: string[]
  certifications: string[]
  experience: string
  services: string[]
  sectors: string[]
  completed: number
  responseTime: string
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
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
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

export const api = {
  login: (payload: LoginCommand) => request<{ user: AppUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }).then(response => response.user),
  register: (profile: ActiveProfile, payload: CreateClientCommand | CreateFreeLancerCommand) =>
    request<{ user: AppUser }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ profile, payload }) }).then(response => response.user),
  getSession: () => request<{ user: AppUser | null }>('/api/auth/session').then(response => response.user),
  convertClientToProvider: (UserId: number, CPF: string) =>
    request<{ user: AppUser }>('/api/auth/register-simplified-freelancer', { method: 'POST', body: JSON.stringify({ UserId, CPF }) }).then(response => response.user),
  registerSimplifiedClient: (UserId: number) =>
    request<{ user: AppUser }>('/api/auth/register-simplified-client', { method: 'POST', body: JSON.stringify({ UserId, Address: null }) }).then(response => response.user),
  switchProfile: () =>
    request<{ user: AppUser }>('/api/auth/switch-profile', { method: 'POST' }).then(response => response.user),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getCategories: () => requestCollection<Category>('/api/categorias'),
  getServices: (type?: string) => requestCollection<Service>(`/api/servicos${type ? `?tipo=${encodeURIComponent(type)}` : ''}`),
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
  getNotifications: (_userId?: string) => requestCollection<Notification>('/api/notificacoes'),
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
  deleteJob: (id: number) => request<Job>(`/api/jobs/${id}`, { method: 'DELETE' }),
  markReviewPending: (jobId: number) => request<Job>('/api/avaliacoes/pendente', { method: 'POST', body: JSON.stringify({ jobId }) }),
  confirmClientCompletion: (jobId: number) => request<Job>(`/api/jobs/${jobId}/complete`, { method: 'POST' }),
  submitReview: (payload: Omit<Review, 'id' | 'createdAt'>) =>
    request<Review>('/api/avaliacoes', { method: 'POST', body: JSON.stringify(payload) }),
  getHistory: (type: HistoryType) => type === 'criados'
    ? request<Job[]>('/api/jobs?scope=own')
    : requestCollection<HistoryEntry>(`/api/historico?tipo=${type}`),
  getMessages: (conversationId: string) => requestCollection<ChatMessage>(`/api/chat/mensagens?conversationId=${encodeURIComponent(conversationId)}`),
  sendMessage: (payload: Omit<ChatMessage, 'id' | 'createdAt' | 'status'>) =>
    request<ChatMessage>('/api/chat/mensagens', { method: 'POST', body: JSON.stringify(payload) }),
  requestContact: (payload: ContactRequest) =>
    request('/api/chat/solicitacoes', { method: 'POST', body: JSON.stringify(payload) }),
  applyToJob: (payload: Pick<Application, 'jobId' | 'message'>) =>
    request<Application>('/api/candidaturas', { method: 'POST', body: JSON.stringify(payload) }),
  getApplications: (_userId?: string) => requestCollection<Application>('/api/candidaturas'),
  respondToApplication: (id: string, accept: boolean) =>
    request<Application>(`/api/candidaturas/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ accept }) }),
  getInvitations: () => requestCollection<ServiceInvitation>('/api/convites'),
  createInvitation: (jobId: number, providerId: number) =>
    request<ServiceInvitation>('/api/convites', { method: 'POST', body: JSON.stringify({ jobId, providerId }) }),
  respondToInvitation: (id: string, accept: boolean) =>
    request<ServiceInvitation>(`/api/convites/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ accept }) }),
}
